import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "bo_loop_db")

print(f"Connecting to {DATABASE_NAME} on MongoDB Atlas...")
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

collections = db.list_collection_names()
print(f"Collections found: {collections}\n")

for coll_name in collections:
    coll = db[coll_name]
    count = coll.count_documents({})
    print(f"--- Collection: {coll_name} ({count} documents) ---")
    
    # Fetch first 2 documents as sample
    docs = coll.find().limit(2)
    for i, doc in enumerate(docs):
        # Convert ObjectId to string for easy reading
        doc['_id'] = str(doc.get('_id'))
        print(f"  Doc {i+1}: {doc}")
    print()

client.close()
