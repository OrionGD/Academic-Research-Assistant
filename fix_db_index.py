"""
Fix stale MongoDB index: drops the firebaseUid_1 unique index
from the users collection across ALL databases on the cluster.
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

uri = os.getenv("MONGODB_URI", "")
client = MongoClient(uri, server_api=ServerApi("1"), serverSelectionTimeoutMS=8000)

# Iterate every database on the cluster
for db_name in client.list_database_names():
    if db_name in ("admin", "local", "config"):
        continue
    db = client[db_name]
    if "users" not in db.list_collection_names():
        continue
    col = db["users"]
    indexes = col.index_information()
    print(f"\n[{db_name}.users] indexes: {list(indexes.keys())}")
    if "firebaseUid_1" in indexes:
        col.drop_index("firebaseUid_1")
        print(f"  -> Dropped firebaseUid_1 from {db_name}.users")
    else:
        print(f"  -> No stale index found")

client.close()
print("\nDone.")
