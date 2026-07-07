import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

async def fix_datasets():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Find the user
    user = await db.users.find_one({"email": "chaudharykhus3107@gmail.com"})
    if not user:
        print("User not found!")
        return
    
    user_id = user["_id"]
    print(f"Found user with ID: {user_id}")
    
    # Get all datasets for this user, sorted by _id
    datasets_cursor = db.datasets.find({"user_id": user_id}).sort("_id", 1)
    datasets = await datasets_cursor.to_list(length=100)
    
    print(f"Found {len(datasets)} datasets for user.")
    
    for i, dataset in enumerate(datasets):
        new_dataset_id = f"EXP_{i+1:03d}"
        
        # Check if it already matches (optional optimization)
        if dataset.get("dataset_id") == new_dataset_id:
            print(f"Dataset {dataset['_id']} is already {new_dataset_id}. Skipping.")
            continue
            
        print(f"Updating dataset {dataset.get('dataset_id')} -> {new_dataset_id}")
        
        # Update data array
        data_rows = dataset.get("data", [])
        total_rows = len(data_rows)
        for j, row in enumerate(data_rows):
            row["Exp Number"] = f"{new_dataset_id}_{j+1:03d}"
            
        new_range = f"{new_dataset_id}_EXP_001 to {new_dataset_id}_EXP_{total_rows:03d}"
        
        # Update document in DB
        await db.datasets.update_one(
            {"_id": dataset["_id"]},
            {
                "$set": {
                    "dataset_id": new_dataset_id,
                    "experiment_id_range": new_range,
                    "data": data_rows
                }
            }
        )
        print(f"Successfully updated to {new_dataset_id}")
        
    print("Done fixing datasets!")

if __name__ == "__main__":
    asyncio.run(fix_datasets())
