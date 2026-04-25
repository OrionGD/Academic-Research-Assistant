import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_config():
    return {
        "app": "app.main:app",
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": int(os.getenv("PORT", 2022)),
        "reload": os.getenv("ENV", "dev") == "dev",  # reload only in dev
        "log_level": "info",
    }

if __name__ == "__main__":
    config = get_config()

    uvicorn.run(
        config["app"],
        host=config["host"],
        port=config["port"],
        reload=config["reload"],
        log_level=config["log_level"],
    )