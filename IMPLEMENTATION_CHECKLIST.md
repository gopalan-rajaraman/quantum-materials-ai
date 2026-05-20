# Bayesian Optimization for WS₂ CVD — Quick Implementation Checklist

## ✅ COMPLETED

### Backend ML Implementation
- ✅ **Data Encoder** (`data_encoder.py`): Categorical encoding + feature matrix (exact notebook match)
- ✅ **GP Model** (`gp_model.py`): Matérn 5/2 kernel, fit/predict, scale handling
- ✅ **Bayesian Optimization** (`bayesian_optimization.py`): Expected Improvement acquisition + BO loop
- ✅ **Optimizer Orchestrator** (`optimizer.py`): End-to-end pipeline coordination
- ✅ **API Routes** (`thermal_cvd_routes.py`): 12 FastAPI endpoints ready
- ✅ **Verification Script** (`verify_bo_alignment.py`): All 6 tests passing

### Servers Running
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:5173

---

## 🎯 NEXT: FRONTEND IMPLEMENTATION

### Phase 1: Core Components (Week 1)

#### 1. **Upload & Data Preview**
   - [ ] Create `<FileUpload>` component with drag-drop
   - [ ] Display preview table (first 10 rows)
   - [ ] Show stats: # experiments, FWHM range
   - [ ] Call: `POST /thermal-cvd/train`

#### 2. **Encoding Maps Dashboard**
   - [ ] Tabbed interface (P1, P2, Substrate, CG, COM, PC, SA, Class)
   - [ ] Bar charts: {Category} → {Integer Code}
   - [ ] Show frequency (how many experiments per category)
   - [ ] Data source: Response from `/encoding-info` endpoint

#### 3. **Variable Explorer**
   - [ ] 4 scatter plots: GTE, GTI, FRA, Pressure vs FWHM
   - [ ] Color by FWHM (red=high, green=low)
   - [ ] Shade search space [min, max] as background
   - [ ] Show observed points as red dots
   - [ ] Data: Use uploaded Excel + variable ranges

#### 4. **GP Surrogate Visualizer** (Most Important for BO)
   - [ ] 4 line plots (one per variable)
   - [ ] Each plot shows:
     - **GP mean**: Blue line
     - **±2σ band**: Light blue shaded
     - **Observed data**: Red scatter points
     - **Best experiment**: Green star
     - **Next suggested**: Dashed green vertical line
   - [ ] Call: `GET /thermal-cvd/gp-slice?variable={GTE|GTI|FRA|Pressure}`

#### 5. **Suggested Experiments**
   - [ ] Card layout showing top 5 suggestions
   - [ ] Per card:
     - Parameter name + value + unit (GTE: 724.7 °C)
     - Normalized position in search space [████░░░░]
     - Predicted FWHM ± uncertainty
     - EI value (scientific notation)
   - [ ] Top card highlighted (highest EI)
   - [ ] Call: `POST /thermal-cvd/suggest?n_suggestions=5`

---

### Phase 2: Advanced Features (Week 2)

#### 6. **Acquisition Function Plots**
   - [ ] 4 area charts (one per variable)
   - [ ] Orange filled area under EI curve
   - [ ] Peak marked with green dot
   - [ ] Next suggested x-value as vertical dashed line
   - [ ] Call: `GET /thermal-cvd/acquisition?variable={var}`

#### 7. **Experiment Form**
   - [ ] Input fields: GTE, GTI, FRA, Pressure, Measured FWHM
   - [ ] Each field has unit label + allowed range hints
   - [ ] Validation: check ranges before submit
   - [ ] Submit button: Create new experiment entry
   - [ ] Success message with "Upload More" or "Retrain Model" options

#### 8. **Active Learning Loop Tracker**
   - [ ] 4 plots showing BO convergence:
     1. **Best FWHM over iterations**: Stepped line (decreasing)
     2. **Predicted FWHM per iteration**: Scatter + line
     3. **Max EI per iteration**: Bar chart (decaying)
     4. **Variable values over iterations**: 4 lines (normalized [0,1])
   - [ ] Statistics: # iterations, final improvement, time elapsed

#### 9. **Upload New Experiments**
   - [ ] File upload for new Excel data (10+ experiments)
   - [ ] Parse & add to training set
   - [ ] Retrain GP automatically
   - [ ] Show: "Merged X experiments. New best FWHM: 18 meV ↓3 meV"
   - [ ] Call: `POST /thermal-cvd/add-experiments`

#### 10. **Constants Switcher**
   - [ ] Dropdown menus for each categorical constant
   - [ ] Options populated from encoding maps
   - [ ] "Apply Changes" button → retrain GP
   - [ ] Example: Change Substrate from SiO2/Si → Sapphire
   - [ ] Call: `POST /thermal-cvd/update-constant`

---

### Phase 3: Polish & Deploy (Week 3)

#### 11. **Export Results**
   - [ ] Download button → Excel workbook with 4 sheets:
     - Sheet 1: Encoded database (with GP predictions)
     - Sheet 2: Encoding maps (label → code)
     - Sheet 3: Next experiment (recommended parameters)
     - Sheet 4: BO history (convergence data)
   - [ ] Call: `GET /thermal-cvd/export`

#### 12. **Error Handling & Validation**
   - [ ] Check file format (must be .xlsx)
   - [ ] Validate required columns present
   - [ ] Handle missing/invalid data gracefully
   - [ ] Show helpful error messages
   - [ ] Disable buttons until prerequisites met

#### 13. **Mobile Responsiveness**
   - [ ] Charts responsive (Plotly/Recharts)
   - [ ] Stack cards vertically on mobile
   - [ ] Touch-friendly button sizing
   - [ ] Readable text sizing

#### 14. **Accessibility**
   - [ ] WCAG 2.1 AA compliance
   - [ ] Alt text for all charts
   - [ ] Keyboard navigation
   - [ ] Color-blind friendly palette (include patterns, not just colors)

---

## 📐 Architecture Overview

```
Frontend (React)                    Backend (FastAPI)
    |                                     |
    |-- <Dashboard>                   Python ML Pipeline
    |   ├─ Upload                    ├─ /train (encoder + scalers)
    |   ├─ Encoding Maps             ├─ /fit-gp (GP training)
    |   ├─ Variable Explorer         ├─ /suggest (EI acquisition)
    |   ├─ GP Surrogates ← → API ← → ├─ /gp-slice (visualization)
    |   ├─ Acquisition Fn            ├─ /acquisition (EI plots)
    |   ├─ Suggestions               ├─ /add-experiments (new data)
    |   ├─ New Experiment Form       └─ /export (download)
    |   └─ Export
    |
    └─ State (Redux/Context)
```

---

## 🧪 Testing

### End-to-End Flow
1. Upload `quantum-materials-ai/frontend/public/quantum_template.csv` or notebook's labelled.xlsx
2. Click "Train Model" → should show encoding maps
3. Click "Generate Suggestions" → should show top 5 experiments
4. Fill experiment form, submit → new experiment added
5. Click "Export" → download Excel with results

### Acceptance Criteria
- ✅ All plots render without errors
- ✅ Backend prediction ≈ notebook predictions
- ✅ EI acquisition matches notebook calculation
- ✅ Suggestions have highest EI among search space
- ✅ BO convergence shows improvement over iterations

---

## 📚 Resources

| File | Purpose |
|------|---------|
| `FRONTEND_INTEGRATION_GUIDE.md` | Detailed component specs, API contracts |
| `backend/verify_bo_alignment.py` | Run verification tests |
| `/memories/session/bayesian_optimization_integration.md` | Integration notes |
| `README.md` | Project overview (update after frontend) |

---

## 🚀 Timeline Estimate

- **Week 1**: Components 1-5 (upload, encoding, explorer, GP plots, suggestions)
- **Week 2**: Components 6-10 (EI plots, form, tracker, new experiments, constants)
- **Week 3**: Components 11-14 (export, validation, mobile, a11y)
- **Week 4**: Testing, bug fixes, deployment

---

## 💡 Pro Tips

1. **Use Plotly.js** for interactive plots (hover tooltips, zoom)
2. **Cache API responses** to avoid redundant calls
3. **Show loading spinners** during training (GP fitting takes ~5s)
4. **Debounce search** if you add real-time prediction
5. **Store data in localStorage** for dev/demo persistence
6. **Test with full notebook dataset** (21 experiments)

---

## Questions?

- Check `FRONTEND_INTEGRATION_GUIDE.md` for API details
- Run `backend/verify_bo_alignment.py` to test ML logic
- Review notebook cells 1-12 for expected behavior
