import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database.mongodb_config import MongoDB, get_notifications_collection, get_users_collection

async def seed():
    print("Connecting to MongoDB...")
    await MongoDB.connect()
    
    users_coll = get_users_collection()
    notifs_coll = get_notifications_collection()
    
    # Get all users to seed for everyone
    users = await users_coll.find({}).to_list(100)
    
    if not users:
        print("No users found to seed notifications for.")
        await MongoDB.close()
        return
        
    print(f"Found {len(users)} users. Seeding notifications...")
    
    now = datetime.utcnow()
    
    mock_notifications = [
        {
            "type": "system",
            "title": "Welcome",
            "message": "Welcome to BO-LAB! Start optimizing your first experiment.",
            "icon": "🎉",
            "is_read": False,
            "created_at": now - timedelta(days=2)
        },
        {
            "type": "login",
            "title": "Login",
            "message": "Google Login Successful",
            "icon": "✓",
            "is_read": True,
            "created_at": now - timedelta(hours=1)
        },
        {
            "type": "dataset_uploaded",
            "title": "Dataset Uploaded",
            "message": "Dataset successfully uploaded and parsed.",
            "icon": "📤",
            "is_read": True,
            "created_at": now - timedelta(minutes=45)
        },
        {
            "type": "dataset_locked",
            "title": "Dataset Locked",
            "message": "Dataset 'tanushree_final_mos2.xlsx' has been locked.",
            "icon": "🔒",
            "is_read": False,
            "created_at": now - timedelta(minutes=25)
        },
        {
            "type": "experiment_completed",
            "title": "Experiment Completed",
            "message": "Experiment EXP_022 completed successfully.",
            "icon": "🧪",
            "is_read": False,
            "created_at": now - timedelta(minutes=10)
        },
        {
            "type": "model_trained",
            "title": "Model Trained",
            "message": "GP model retrained with new best parameters.",
            "icon": "🤖",
            "is_read": False,
            "created_at": now - timedelta(minutes=2)
        },
        {
            "type": "system",
            "title": "New Prediction",
            "message": "New prediction available for download.",
            "icon": "🚀",
            "is_read": False,
            "created_at": now - timedelta(minutes=1)
        },
        {
            "type": "system",
            "title": "Storage Warning",
            "message": "Storage usage reached 75%.",
            "icon": "📦",
            "is_read": False,
            "created_at": now - timedelta(days=1)
        },
        {
            "type": "collaborator_added",
            "title": "Collaborator Added",
            "message": "Collaboration invitation accepted by Raj Singh.",
            "icon": "👥",
            "is_read": False,
            "created_at": now - timedelta(hours=2)
        }
    ]
    
    docs_to_insert = []
    for user in users:
        user_id = str(user["_id"])
        # Clear existing to avoid duplicates when running multiple times
        await notifs_coll.delete_many({"user_id": user_id})
        
        for notif in mock_notifications:
            new_notif = notif.copy()
            new_notif["user_id"] = user_id
            docs_to_insert.append(new_notif)
            
    if docs_to_insert:
        await notifs_coll.insert_many(docs_to_insert)
        print(f"Inserted {len(docs_to_insert)} notifications across {len(users)} users.")
        
    await MongoDB.close()
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
