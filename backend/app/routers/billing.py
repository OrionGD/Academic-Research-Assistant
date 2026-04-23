from fastapi import APIRouter, Request, HTTPException
import time
import uuid
from datetime import datetime
from typing import Dict, Any
from ..config.settings import settings
from ..config.database import get_database
from ..models.payment import PaymentStatus

router = APIRouter()

def get_price(plan: str, cycle: str) -> int:
    if plan == "pro":
        return settings.PRICE_PRO_MONTHLY if cycle == "monthly" else settings.PRICE_PRO_ANNUAL
    elif plan == "standard":
        return 799 if cycle == "monthly" else 7990
    elif plan == "basic":
        return 299 if cycle == "monthly" else 2990
    elif plan == "enterprise":
        return settings.PRICE_ENTERPRISE_MONTHLY if cycle == "monthly" else settings.PRICE_ENTERPRISE_ANNUAL
    return 0


@router.get("/plans")
async def list_plans():
    return [
        {"tier": "FREE", "monthlyInr": 0, "yearlyInr": 0, "description": "Standard research access"},
        {"tier": "BASIC", "monthlyInr": 499, "yearlyInr": 4999, "description": "For casual researchers"},
        {"tier": "STANDARD", "monthlyInr": 1499, "yearlyInr": 14999, "description": "For active professionals"},
        {"tier": "PRO", "monthlyInr": 2999, "yearlyInr": 29999, "description": "Unrestricted research power"}
    ]


@router.get("/subscription")
async def get_subscription(request: Request):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    plan = user.get("plan", "free")
    billing_cycle = user.get("billing_cycle") or "monthly"
    amount = get_price(plan, billing_cycle)
    return {
        "planTier": plan.upper(),
        "subscriptionStatus": "active" if plan != "free" else "inactive",
        "currentPeriodEnd": user.get("subscription_expires_at"),
        "cancelAtPeriodEnd": False,
        "billingInterval": billing_cycle,
        "amountInr": amount
    }


@router.get("/usage")
async def get_usage(request: Request):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    plan = user.get("plan", "free")
    limits = {
        "free": {"uploads": 5, "queries": 20, "storageMb": 50},
        "basic": {"uploads": 50, "queries": 200, "storageMb": 500},
        "standard": {"uploads": 200, "queries": 1000, "storageMb": 5000},
        "pro": {"uploads": 9999, "queries": 99999, "storageMb": 99999}
    }[plan]

    usage = user.get("usage_limits", {})
    upload_remaining = usage.get("docs", limits["uploads"])
    query_remaining = usage.get("chat", limits["queries"])

    return {
        "planTier": plan.upper(),
        "uploads": {"used": limits["uploads"] - upload_remaining, "limit": limits["uploads"], "percentage": int(((limits["uploads"] - upload_remaining) / max(limits["uploads"], 1)) * 100)},
        "queries": {"used": limits["queries"] - query_remaining, "limit": limits["queries"], "percentage": int(((limits["queries"] - query_remaining) / max(limits["queries"], 1)) * 100)},
        "storage": {"usedMb": user.get("storageUsedMb", 0), "limitMb": limits["storageMb"], "percentage": int((user.get("storageUsedMb", 0) / max(limits["storageMb"], 1)) * 100)},
        "currentPeriodEnd": user.get("subscription_expires_at")
    }


@router.post("/create-order")
async def create_order(request: Request, body: Dict[str, Any]):
    """
    Simulated order creation (Placeholder)
    """
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    plan = body.get("plan")
    cycle = body.get("cycle")
    
    if not plan or not cycle:
        raise HTTPException(status_code=400, detail="Plan and cycle are required")
        
    amount_in_rupees = get_price(plan, cycle)
    
    # Generate a mock order ID
    order_id = f"mock_order_{uuid.uuid4().hex[:12]}"
    
    db = get_database()
    payment_data = {
        "user_id": request.state.user["user_id"],
        "order_id": order_id,
        "amount": amount_in_rupees * 100,
        "plan": plan,
        "billing_cycle": cycle,
        "status": PaymentStatus.CREATED,
        "events": [
            {
                "type": "ORDER_CREATED_SIMULATED",
                "timestamp": datetime.utcnow(),
                "metadata": {"amount": amount_in_rupees, "cycle": cycle}
            }
        ],
        "created_at": datetime.utcnow()
    }
    await db.payments.insert_one(payment_data)
    
    return {
        "orderId": order_id,
        "amount": amount_in_rupees * 100,
        "currency": "INR",
        "message": "Simulation Mode: Use /verify to complete",
        "isSimulated": True
    }

@router.post("/verify")
async def verify_payment(request: Request, body: Dict[str, Any]):
    """
    Simulated verification (Instantly approves the plan)
    """
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    order_id = body.get("orderId") or body.get("order_id")
    
    if not order_id:
        raise HTTPException(status_code=400, detail="Order ID required")
        
    db = get_database()
    payment = await db.payments.find_one({"order_id": order_id})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    if payment["status"] == PaymentStatus.PAID:
        return {"status": "success", "message": "Already processed"}
        
    # Mock successful payment
    payment_id = f"mock_pay_{uuid.uuid4().hex[:12]}"
    
    await db.payments.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "payment_id": payment_id,
                "status": PaymentStatus.PAID,
                "last_payment_at": datetime.utcnow()
            },
            "$push": {
                "events": {
                    "type": "PAYMENT_VERIFIED_SIMULATED",
                    "timestamp": datetime.utcnow(),
                    "metadata": {"paymentId": payment_id}
                }
            }
        }
    )
    
    # Update User Plan in DB
    user_id = payment["user_id"]
    from bson import ObjectId
    try:
        user_query = {"_id": ObjectId(user_id)}
    except:
        user_query = {"_id": user_id}

    await db.users.update_one(
        user_query,
        {
            "$set": {
                "plan": payment["plan"],
                "billing_cycle": payment["billing_cycle"],
                "last_payment_at": datetime.utcnow(),
                "subscription_expires_at": None # Or set a future date
            }
        }
    )
    
    return {
        "status": "success", 
        "message": f"Plan upgraded to {payment['plan']} (Simulated)",
        "plan": payment["plan"]
    }

@router.post("/webhook")
async def webhook(request: Request):
    """
    Placeholder for webhook
    """
    return {"status": "ignored", "message": "Billing webhooks are disabled in simulation mode"}
