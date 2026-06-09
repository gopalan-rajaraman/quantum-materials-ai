"""
MongoDB configuration and connection management.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "bo_loop_db")

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

    @classmethod
    async def connect(cls):
        """Create database connection."""
        cls.client = AsyncIOMotorClient(MONGODB_URL)
        cls.database = cls.client[DATABASE_NAME]
        print(f"Connected to MongoDB: {DATABASE_NAME}")

    @classmethod
    async def close(cls):
        """Close database connection."""
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")

    @classmethod
    def get_database(cls):
        """Get database instance."""
        return cls.database

# Collections
def get_datasets_collection():
    """Get datasets collection."""
    return MongoDB.get_database().datasets

def get_experiments_collection():
    """Get experiments collection."""
    return MongoDB.get_database().experiments

def get_users_collection():
    """Get users collection."""
    return MongoDB.get_database().users

def get_activity_log_collection():
    """Get activity log collection."""
    return MongoDB.get_database().activity_log


def get_sessions_collection():
    """Get sessions collection for storing auth/session tokens."""
    return MongoDB.get_database().sessions
