import re

with open(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\backend\app\routes\upload_routes.py", "r", encoding="utf-8") as f:
    content = f.read()

# We need to find @router.post("/upload") and @router.post("/upload-json")
start_idx = content.find('@router.post("/upload")\n')
if start_idx == -1:
    print("Could not find /upload")
    exit(1)

end_idx = content.find('@router.post("/upload-json")\n')
if end_idx == -1:
    print("Could not find /upload-json")
    exit(1)

# Import dependencies at the top if needed
import_stmt = "from app.database.mongodb_config import MongoDB\nfrom app.services.matching_engine import MatchingEngine\nimport uuid\nimport asyncio\nimport os\n"
if "MatchingEngine" not in content:
    content = import_stmt + content

new_endpoints = """
@router.post("/upload/parse")
async def parse_dataset(
    files: list[UploadFile] = File(...),
    experiment_id: str = Form("Thermal CVD"),
    current_user: dict = Depends(get_current_user)
):
    \"\"\"
    Phase 1: Parse the uploaded file, extract columns, and return a preview.
    Saves the file to a temporary location and creates an ImportSession.
    \"\"\"
    try:
        import os
        import uuid
        
        # Save files temporarily
        temp_dir = os.path.join(os.getcwd(), "temp_uploads")
        os.makedirs(temp_dir, exist_ok=True)
        
        session_id = str(uuid.uuid4())
        
        file = files[0] # Handle one file for simplicity in parsing
        contents = await file.read()
        
        file_path = os.path.join(temp_dir, f"{session_id}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(contents)
            
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        columns = list(df.columns)
        
        # Generate preview
        preview = df.head(5).replace({np.nan: None}).to_dict(orient='records')
        
        # Detect duplicates
        from collections import Counter
        col_counts = Counter(columns)
        duplicate_headers = [col for col, count in col_counts.items() if count > 1]
        
        # Save session to MongoDB
        session_doc = {
            "session_id": session_id,
            "user_id": ObjectId(current_user["_id"]),
            "experiment_id": experiment_id,
            "file_path": file_path,
            "original_filename": file.filename,
            "columns": columns,
            "preview": preview,
            "duplicate_headers": duplicate_headers,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db = MongoDB.db
        await db["import_sessions"].insert_one(session_doc)
        
        return {
            "import_session_id": session_id,
            "columns": columns,
            "preview": preview,
            "duplicate_headers": duplicate_headers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ConfirmImportPayload(BaseModel):
    import_session_id: str
    mapping: Dict[str, str]
    template_id: Optional[str] = None
    save_as_template: Optional[bool] = False
    template_name: Optional[str] = None
    cat_constants: Optional[Dict[str, str]] = None
    num_constants: Optional[Dict[str, float]] = None

@router.post("/upload/confirm")
async def confirm_import(
    payload: ConfirmImportPayload,
    current_user: dict = Depends(get_current_user)
):
    \"\"\"
    Phase 2: Confirm mapping, rename columns, create dataset, trigger GP asynchronously.
    \"\"\"
    try:
        db = MongoDB.db
        datasets_collection = get_datasets_collection()
        
        # 1. Fetch Session
        session = await db["import_sessions"].find_one({"session_id": payload.import_session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Import session not found or expired")
            
        file_path = session["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Uploaded file no longer available")
            
        # 2. Load dataframe
        if session["original_filename"].endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        total_rows = len(df)
        
        # 3. Apply Mapping
        # mapping is { internal_name: excel_column }
        # We need to rename dataframe columns from excel_column -> internal_name
        inverted_mapping = {v: k for k, v in payload.mapping.items()}
        df = df.rename(columns=inverted_mapping)
        
        # Default target handling
        if 'PL_FWHM' in df.columns:
            df = df.dropna(subset=['PL_FWHM']).reset_index(drop=True)
            
        if payload.cat_constants:
            for col, val in payload.cat_constants.items():
                df[col] = val
        if payload.num_constants:
            for col, val in payload.num_constants.items():
                df[col] = float(val)
                
        df['TOCVD'] = 'Thermal CVD'
        thermal_cvd_df = df
        
        # 4. Save template if requested
        if payload.save_as_template and payload.template_name:
            template_doc = {
                "name": payload.template_name,
                "experiment_id": session["experiment_id"],
                "user_id": ObjectId(current_user["_id"]),
                "mapping_json": payload.mapping,
                "version": 1,
                "is_default": False,
                "created_by": str(current_user["_id"]),
                "last_used_at": datetime.utcnow().isoformat(),
                "times_used": 1,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await db["import_templates"].insert_one(template_doc)
            
        # 5. Create Dataset Record
        dataset_count = await datasets_collection.count_documents({"user_id": ObjectId(current_user["_id"])})
        dataset_id = f"EXP_{dataset_count + 1:03d}"
        
        exp_numbers = [f"{dataset_id}_{i+1:03d}" for i in range(len(thermal_cvd_df))]
        if 'Exp Number' not in thermal_cvd_df.columns:
            thermal_cvd_df.insert(0, 'Exp Number', exp_numbers)
        
        dataset_record = {
            "name": session["original_filename"],
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "created_at": datetime.utcnow().isoformat(),
            "rows": f"{len(thermal_cvd_df):,} rows",
            "dataset_id": dataset_id,
            "experiment_id_range": f"{dataset_id}_EXP_001 to {dataset_id}_EXP_{len(thermal_cvd_df):03d}",
            "data": thermal_cvd_df.replace({np.nan: None}).to_dict(orient='records'),
            "user_id": ObjectId(current_user["_id"]),
            "status": "unlocked",
            "column_mapping": payload.mapping
        }
        
        insert_result = await datasets_collection.insert_one(dataset_record)
        
        # 6. Trigger GP Asynchronously
        import asyncio
        asyncio.create_task(run_gp_training_async(thermal_cvd_df, current_user["_id"]))
        
        # Cleanup
        try:
            os.remove(file_path)
            await db["import_sessions"].delete_one({"session_id": payload.import_session_id})
        except:
            pass
            
        return {
            "status": "success",
            "inserted_id": str(insert_result.inserted_id),
            "message": "Dataset imported successfully",
            "report": {
                "rows_processed": total_rows,
                "variables_mapped": len(payload.mapping),
                "extra_columns_ignored": len(session["columns"]) - len(payload.mapping)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_gp_training_async(df, user_id):
    \"\"\"Background task to train GP.\"\"\"
    try:
        if cvd_routes.optimizer_instance is not None:
            # Drop NaN rows in required num columns for training
            num_cols = ['GTE', 'GTI', 'FRA', 'Pressure', 'PL_FWHM']
            for col in num_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            train_df = df.dropna(subset=['PL_FWHM']).reset_index(drop=True)
            
            if len(train_df) > 0:
                cvd_routes.optimizer_instance.load_training_data(train_df)
                cvd_routes.optimizer_instance.generate_search_space(n_points=5000)
                cvd_routes.optimizer_instance.train_gp()
                cvd_routes.set_optimizer(user_id, cvd_routes.optimizer_instance)
                best_fwhm = float(cvd_routes.optimizer_instance.y_train.min())
                await log_activity("GP Model Retrained", f"Best FWHM: {best_fwhm:.2f} meV", "bg-cyan-500", user_id)
    except Exception as e:
        print(f"Async GP Training Error: {e}")

"""

new_content = content[:start_idx] + new_endpoints + content[end_idx:]

with open(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\backend\app\routes\upload_routes.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("upload_routes.py updated.")
