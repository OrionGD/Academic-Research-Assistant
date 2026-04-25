import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime
from dotenv import load_dotenv

# Load env from root
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aras_db")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def migrate():
    if not MONGODB_URI:
        print("Error: MONGODB_URI not found")
        return

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    
    print(f"Migrating and seeding database: {DATABASE_NAME}")

    # 1. Migrate Plans and Roles to Uppercase Enums
    # free -> BASIC, basic -> BASIC, standard -> BASIC, pro -> PREMIUM/ENTERPRISE
    
    print("Normalizing plans and roles...")
    
    # Map legacy strings to new Enums
    plan_map = {
        "free": "BASIC",
        "basic": "BASIC",
        "standard": "BASIC",
        "pro": "PREMIUM",
        "enterprise": "ENTERPRISE"
    }
    
    role_map = {
        "user": "USER_BASIC",
        "admin": "ADMIN"
    }

    cursor = db.users.find({})
    count = 0
    async for user in cursor:
        count += 1
        if count % 50 == 0:
            print(f"Processed {count} users...")
        updates = {}
        
        # Normalize Plan
        current_plan = user.get("plan")
        if current_plan in plan_map:
            updates["plan"] = plan_map[current_plan]
        elif isinstance(current_plan, str) and not current_plan.isupper():
            updates["plan"] = current_plan.upper()
            
        # Normalize Role
        current_role = user.get("role")
        if current_role == "admin":
            updates["role"] = "ADMIN"
        elif current_role == "user":
            # Determine which user role based on plan
            plan = updates.get("plan", current_plan or "BASIC").upper()
            if plan == "PREMIUM":
                updates["role"] = "USER_PREMIUM"
            elif plan == "ENTERPRISE":
                updates["role"] = "USER_ENTERPRISE"
            else:
                updates["role"] = "USER_BASIC"
        
        # Ensure credits exist
        if "credits" not in user or not isinstance(user["credits"], dict):
            plan = updates.get("plan", current_plan or "BASIC").upper()
            if plan == "ENTERPRISE":
                updates["credits"] = {"uploads_remaining": 50, "searches_remaining": 999999, "chats_remaining": 70, "can_compare": True}
            elif plan == "PREMIUM":
                updates["credits"] = {"uploads_remaining": 27, "searches_remaining": 12, "chats_remaining": 49, "can_compare": True}
            else:
                updates["credits"] = {"uploads_remaining": 10, "searches_remaining": 10, "chats_remaining": 20, "can_compare": True}

        if updates:
            await db.users.update_one({"_id": user["_id"]}, {"$set": updates})

    print("User migration complete.")

    # 2. Ensure Core Test Accounts Exist with correct credentials
    core_users = [
        {
            "email": "admin@aras.ai",
            "name": "Super Admin",
            "role": "ADMIN",
            "plan": "ENTERPRISE",
            "password": "Password123"
        },
        {
            "email": "basic@aras.ai",
            "name": "Basic User",
            "role": "USER_BASIC",
            "plan": "BASIC",
            "password": "Password123"
        },
        {
            "email": "premium@aras.ai",
            "name": "Premium User",
            "role": "USER_PREMIUM",
            "plan": "PREMIUM",
            "password": "Password123"
        },
        {
            "email": "enterprise@aras.ai",
            "name": "Enterprise User",
            "role": "USER_ENTERPRISE",
            "plan": "ENTERPRISE",
            "password": "Password123"
        }
    ]

    for u in core_users:
        existing = await db.users.find_one({"email": u["email"]})
        user_doc = {
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "plan": u["plan"],
            "hashed_password": hash_password(u["password"]),
            "status": "ACTIVE",
            "credits": {
                "uploads_remaining": 50 if u["plan"] == "ENTERPRISE" else (27 if u["plan"] == "PREMIUM" else 10),
                "searches_remaining": 999999 if u["plan"] == "ENTERPRISE" else (12 if u["plan"] == "PREMIUM" else 10),
                "chats_remaining": 70 if u["plan"] == "ENTERPRISE" else (49 if u["plan"] == "PREMIUM" else 20),
                "can_compare": True
            }
        }
        if existing:
            await db.users.update_one({"_id": existing["_id"]}, {"$set": user_doc})
            print(f"Verified core user: {u['email']}")
        else:
            user_doc["created_at"] = datetime.utcnow()
            await db.users.insert_one(user_doc)
            print(f"Created core user: {u['email']}")

    # 3. Create necessary collections if they don't exist by inserting a dummy doc or just ensuring they are initialized
    collections = ["documents", "chat_history", "audit_logs", "payments", "upgrade_requests"]
    for coll in collections:
        count = await db[coll].count_documents({})
        print(f"Collection '{coll}' has {count} documents.")

    print("\nDatabase is now synchronized with the latest platform architecture.")

if __name__ == "__main__":
    asyncio.run(migrate())
