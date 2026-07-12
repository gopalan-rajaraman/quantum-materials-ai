import pymongo
from dotenv import load_dotenv
import os

load_dotenv('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/backend/.env')
client = pymongo.MongoClient(os.getenv('MONGODB_URL'))
db = client['bo_loop_db']
db.users.update_many({}, {'$set': {'active_dataset_id': None}})
print("Successfully cleared active datasets.")
