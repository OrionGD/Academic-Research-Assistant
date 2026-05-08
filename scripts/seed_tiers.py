import os
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aras_db")
    
def hash_password(password: str) -> str:
    return password


users_to_create = [
    {
        "email": "free@aras.ai",
        "password": "Password123",
        "name": "Free Tier User",
        "plan": "free",
        "role": "user"
    },
    {
        "email": "basic@aras.ai",
        "password": "Password123",
        "name": "Basic Tier User",
        "plan": "basic",
        "role": "user"
    },
    {
        "email": "standard@aras.ai",
        "password": "Password123",
        "name": "Standard Tier User",
        "plan": "standard",
        "role": "user"
    },
    {
        "email": "pro@aras.ai",
        "password": "Password123",
        "name": "Pro Tier User",
        "plan": "pro",
        "role": "user"
    },
    {
        "email": "admin@aras.ai",
        "password": "Password123",
        "name": "Admin User",
        "plan": "pro",
        "role": "admin"
    }
]

async def seed_users():
    if not MONGODB_URI:
        print("Error: MONGODB_URI not found in .env")
        return

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    
    print(f"Connecting to database: {DATABASE_NAME}")
    
    for user_info in users_to_create:
        email = user_info["email"]
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            print(f"User {email} already exists. Updating plan and role...")
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "hashed_password": hash_password(user_info["password"]),
                    "plan": user_info["plan"],
                    "role": user_info["role"]
                }}
            )
        else:
            print(f"Creating user {email}...")
            user_data = {
                "email": email,
                "hashed_password": hash_password(user_info["password"]),
                "name": user_info["name"],
                "plan": user_info["plan"],
                "role": user_info["role"],
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(user_data)
    
    print("\nSeeding complete!")
    print("\nCredentials:")
    for u in users_to_create:
        print(f"- {u['email']} / {u['password']} (Plan: {u['plan'].upper()}, Role: {u['role'].upper()})")

if __name__ == "__main__":
    asyncio.run(seed_users())
