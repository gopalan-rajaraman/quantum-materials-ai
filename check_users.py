import sys; sys.path.append('backend');
import asyncio
from dotenv import load_dotenv; load_dotenv('backend/.env');
from app.database.mongodb_config import MongoDB, get_users_collection

async def main():
    await MongoDB.connect()
    c = get_users_collection()
    users = await c.find().to_list(100)
    print("USERS:")
    for u in users:
        print(f"{u.get('email')} | {u.get('full_name')} | pw_hash:{u.get('password_hash') is not None} | verified:{u.get('is_verified')}")
    await MongoDB.close()

asyncio.run(main())
