"""
MongoDB configuration and connection management.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.DATABASE_NAME

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

    @classmethod
    async def connect(cls):
        """Create database connection."""
        cls.client = AsyncIOMotorClient(MONGODB_URL)
        cls.database = cls.client[DATABASE_NAME]
        logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
        # Initialize indexes
        await init_indexes()

    @classmethod
    async def close(cls):
        """Close database connection."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

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


def get_dataset_events_collection():
    """Get dataset events collection for audit trail."""
    return MongoDB.get_database().dataset_events

def get_sessions_collection():
    """Get sessions collection for storing auth/session tokens."""
    return MongoDB.get_database().sessions

def get_login_history_collection():
    """Get login history collection."""
    return MongoDB.get_database().login_history

async def init_indexes():
    """Initialize necessary MongoDB indexes."""
    db = MongoDB.get_database()
    if db is None:
        return

    # users indexes
    await db.users.create_index("active_dataset_id")
    
    # datasets indexes
    await db.datasets.create_index("user_id")
    
    # experiments indexes
    await db.experiments.create_index([("dataset_id", 1), ("experiment_number", 1)])
    await db.experiments.create_index([("dataset_id", 1), ("created_at", 1)])
    
    # dataset_events indexes
    await db.dataset_events.create_index([("dataset_id", 1), ("created_at", 1)])
    
    # sessions index (TTL 7 days)
    await db.sessions.create_index([("expires_at", 1)], expireAfterSeconds=0)

