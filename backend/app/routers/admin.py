from fastapi import APIRouter, Request, HTTPException
from ..config.database import get_database
from ..models.user import UserRole
from datetime import datetime
from bson import ObjectId

router = APIRouter()


def _ensure_admin(request: Request):
    if not request.state.user or request.state.user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/users")
async def list_users(request: Request):
    _ensure_admin(request)
    db = get_database()
    users = await db.users.find().to_list(length=100)
    for user in users:
        user["_id"] = str(user["_id"])
        if "hashed_password" in user:
            del user["hashed_password"]
    return users


@router.get("/system-metrics")
async def get_system_metrics(request: Request):
    _ensure_admin(request)
    db = get_database()
    user_count = await db.users.count_documents({})
    document_count = await db.documents.count_documents({})
    pending_upgrades = await db.upgrade_requests.count_documents({"status": "pending"})
    total_messages = await db.support_messages.count_documents({})
    return {
        "totalUsers": user_count,
        "totalDocuments": document_count,
        "pendingUpgrades": pending_upgrades,
        "apiRequestsLast24h": 0,
        "storageUsedBytes": 0,
        "platformStats": {
            "userDistribution": [],
            "totalStorage": 0,
            "totalAnalyses": await db.documents.count_documents({"analysis": {"$exists": True}}),
            "totalMessages": total_messages,
            "totalUsers": user_count,
            "activeUsersToday": 0
        }
    }


@router.get("/upgrade-requests")
async def get_upgrade_requests(request: Request):
    _ensure_admin(request)
    db = get_database()
    requests = await db.upgrade_requests.find().sort("createdAt", -1).to_list(length=100)
    for request_item in requests:
        request_item["_id"] = str(request_item["_id"])
    return requests


@router.post("/approve-upgrade/{request_id}")
async def approve_upgrade(request: Request, request_id: str):
    _ensure_admin(request)
    db = get_database()
    upgrade_request = await db.upgrade_requests.find_one({"_id": ObjectId(request_id)})
    if not upgrade_request:
        raise HTTPException(status_code=404, detail="Upgrade request not found")

    await db.upgrade_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "approved", "updatedAt": datetime.utcnow()}})
    user_id = upgrade_request["userId"]
    try:
        user_obj = ObjectId(user_id)
    except Exception:
        user_obj = user_id
    await db.users.update_one({"_id": user_obj}, {"$set": {"plan": "pro", "upgradeRequestStatus": "approved"}})
    return {"status": "approved"}


@router.post("/reject-upgrade/{request_id}")
async def reject_upgrade(request: Request, request_id: str):
    _ensure_admin(request)
    db = get_database()
    upgrade_request = await db.upgrade_requests.find_one({"_id": ObjectId(request_id)})
    if not upgrade_request:
        raise HTTPException(status_code=404, detail="Upgrade request not found")

    await db.upgrade_requests.update_one({"_id": ObjectId(request_id)}, {"$set": {"status": "rejected", "updatedAt": datetime.utcnow()}})
    return {"status": "rejected"}


@router.get("/projects")
async def list_projects(request: Request):
    _ensure_admin(request)
    db = get_database()
    projects = await db.projects.find().to_list(length=100)
    for project in projects:
        project["id"] = str(project["_id"])
        del project["_id"]
    return projects


@router.post("/projects")
async def create_project(request: Request, body: dict):
    _ensure_admin(request)
    db = get_database()
    now = datetime.utcnow()
    doc = {
        "name": body.get("name", "Untitled Project"),
        "description": body.get("description", ""),
        "status": body.get("status", "planning"),
        "supervisors": body.get("supervisors", []),
        "collaborators": body.get("collaborators", []),
        "milestones": body.get("milestones", []),
        "associatedDocuments": body.get("associatedDocuments", []),
        "createdAt": now,
        "updatedAt": now
    }
    result = await db.projects.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc


@router.patch("/projects/{project_id}")
async def update_project(request: Request, project_id: str, body: dict):
    _ensure_admin(request)
    db = get_database()
    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": {**body, "updatedAt": datetime.utcnow()}})
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["id"] = str(project["_id"])
    del project["_id"]
    return project


@router.delete("/projects/{project_id}")
async def delete_project(request: Request, project_id: str):
    _ensure_admin(request)
    db = get_database()
    result = await db.projects.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}


@router.patch("/users/{user_id}/role")
async def update_user_role(request: Request, user_id: str, body: dict):
    _ensure_admin(request)
    role = body.get("role")
    if role not in [UserRole.USER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = get_database()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    if "hashed_password" in user:
        del user["hashed_password"]
    return user


@router.get("/settings")
async def get_settings(request: Request):
    _ensure_admin(request)
    db = get_database()
    settings_doc = await db.admin_settings.find_one({})
    if not settings_doc:
        settings_doc = {
            "require2FA": False,
            "restrictAIToPeerReviewed": False,
            "language": "en",
            "maintenanceMode": False,
            "allowedUploadOrigins": [],
            "maxUploadMB": 50,
            "updatedAt": datetime.utcnow()
        }
    settings_doc["id"] = str(settings_doc.get("_id", ""))
    settings_doc.pop("_id", None)
    return settings_doc


@router.patch("/settings")
async def update_settings(request: Request, body: dict):
    _ensure_admin(request)
    db = get_database()
    settings_doc = await db.admin_settings.find_one({})
    if settings_doc:
        await db.admin_settings.update_one({"_id": settings_doc["_id"]}, {"$set": {**body, "updatedAt": datetime.utcnow()}})
        settings_doc.update(body)
        settings_doc["updatedAt"] = datetime.utcnow()
    else:
        settings_doc = {**body, "updatedAt": datetime.utcnow()}
        await db.admin_settings.insert_one(settings_doc)
    settings_doc["id"] = str(settings_doc.get("_id", ""))
    settings_doc.pop("_id", None)
    return settings_doc


@router.get("/audit-logs")
async def get_audit_logs(request: Request):
    _ensure_admin(request)
    db = get_database()
    logs = await db.audit_logs.find().sort("createdAt", -1).to_list(length=100)
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
    return logs


@router.get("/stats")
async def get_stats(request: Request):
    _ensure_admin(request)
    db = get_database()
    user_count = await db.users.count_documents({})
    payment_count = await db.payments.count_documents({"status": "paid"})
    total_revenue = await db.payments.aggregate([
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(length=1)
    return {
        "user_count": user_count,
        "payment_count": payment_count,
        "total_revenue_paise": total_revenue[0]["total"] if total_revenue else 0
    }
