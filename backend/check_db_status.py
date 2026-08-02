import asyncio
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database()
    datasets = await db.datasets.find({}).to_list(None)
    for ds in datasets:
        print(f"ID: {ds['_id']}, Name: {ds.get('name')}, Status: {ds.get('status')}")

if __name__ == "__main__":
    asyncio.run(check_db())
