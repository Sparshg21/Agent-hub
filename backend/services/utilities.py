"""
Utility bill payment service integrations.
Covers electricity, water, gas, mobile recharge, broadband, DTH.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import Optional


OPERATORS = {
    "mobile": ["Jio", "Airtel", "Vi", "BSNL"],
    "electricity": ["BESCOM", "MSEDCL", "TPDDL", "CESC", "TNEB"],
    "broadband": ["Jio Fiber", "Airtel Xstream", "ACT Fibernet", "BSNL Broadband"],
    "dth": ["Tata Sky", "Dish TV", "Sun Direct", "Videocon d2h", "Airtel Digital TV"],
    "gas": ["Mahanagar Gas", "Indraprastha Gas", "Adani Gas"],
    "water": ["BWSSB", "BMC Water", "Delhi Jal Board"],
}

MOBILE_PLANS = {
    "Jio": [
        {"validity": "28 days", "data": "1.5GB/day", "calls": "Unlimited", "price": 155},
        {"validity": "84 days", "data": "1.5GB/day", "calls": "Unlimited", "price": 395},
        {"validity": "365 days", "data": "2GB/day", "calls": "Unlimited", "price": 2999},
    ],
    "Airtel": [
        {"validity": "28 days", "data": "1GB/day", "calls": "Unlimited", "price": 179},
        {"validity": "84 days", "data": "1.5GB/day", "calls": "Unlimited", "price": 459},
        {"validity": "365 days", "data": "2GB/day", "calls": "Unlimited", "price": 3359},
    ],
    "Vi": [
        {"validity": "28 days", "data": "1GB/day", "calls": "Unlimited", "price": 155},
        {"validity": "84 days", "data": "1.5GB/day", "calls": "Unlimited", "price": 409},
    ],
}


def get_bill_details(service_type: str, account_id: str, operator: Optional[str] = None) -> dict:
    """Fetch current bill details for a utility."""
    due_date = datetime.now() + timedelta(days=random.randint(3, 15))
    amount = 0

    if service_type == "electricity":
        amount = random.randint(800, 3500)
        units = random.randint(150, 600)
        return {
            "service_type": "electricity",
            "operator": operator or random.choice(OPERATORS["electricity"]),
            "account_id": account_id,
            "bill_month": (datetime.now() - timedelta(days=30)).strftime("%B %Y"),
            "units_consumed": units,
            "amount_due": amount,
            "due_date": due_date.strftime("%d %b %Y"),
            "overdue": False,
        }
    elif service_type == "mobile":
        op = operator or "Jio"
        return {
            "service_type": "mobile_recharge",
            "operator": op,
            "mobile_number": account_id,
            "current_balance": f"₹{random.randint(0, 50)}",
            "data_remaining": f"{round(random.uniform(0, 3), 1)} GB",
            "validity_ends": (datetime.now() + timedelta(days=random.randint(1, 28))).strftime("%d %b %Y"),
            "available_plans": MOBILE_PLANS.get(op, MOBILE_PLANS["Jio"]),
        }
    elif service_type == "broadband":
        amount = random.randint(500, 1500)
        return {
            "service_type": "broadband",
            "operator": operator or random.choice(OPERATORS["broadband"]),
            "account_id": account_id,
            "plan": "100 Mbps Unlimited",
            "amount_due": amount,
            "due_date": due_date.strftime("%d %b %Y"),
            "data_used": f"{random.randint(50, 900)} GB",
        }
    else:
        amount = random.randint(200, 2000)
        return {
            "service_type": service_type,
            "operator": operator or service_type.title(),
            "account_id": account_id,
            "amount_due": amount,
            "due_date": due_date.strftime("%d %b %Y"),
        }


def pay_bill(
    service_type: str,
    account_id: str,
    amount: float,
    operator: Optional[str] = None,
    plan_validity: Optional[str] = None,
) -> dict:
    """Pay a utility bill or recharge a mobile."""
    txn_id = f"TXN{random.randint(100000000, 999999999)}"

    result = {
        "transaction_id": txn_id,
        "status": "success",
        "service_type": service_type,
        "operator": operator or service_type.title(),
        "account_id": account_id,
        "amount_paid": amount,
        "payment_method": "UPI",
        "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "receipt_url": f"https://agenthub.app/receipts/{txn_id}",
    }

    if service_type == "mobile":
        result["recharge_successful"] = True
        result["new_validity"] = plan_validity or "28 days"
        result["message"] = f"Recharge of ₹{amount} successful for {account_id}"
    elif service_type == "electricity":
        result["message"] = f"Electricity bill of ₹{amount} paid successfully"
        result["next_due"] = (datetime.now() + timedelta(days=30)).strftime("%d %b %Y")
    else:
        result["message"] = f"{service_type.title()} payment of ₹{amount} successful"

    return result
