import os
from dotenv import load_dotenv
load_dotenv()
print(f"MONGODB_URI: {os.getenv('MONGODB_URI')}")
print(f"DATABASE_NAME: {os.getenv('DATABASE_NAME')}")
print(f"CWD: {os.getcwd()}")
