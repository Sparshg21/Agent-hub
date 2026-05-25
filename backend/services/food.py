"""
Food delivery service integrations — Zomato & Swiggy.
In production these would call real APIs. For MVP they simulate realistic responses.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import Optional


ZOMATO_MENU = {
    "Pizza Margherita": {"price": 299, "restaurant": "La Pino'z", "time": 35},
    "Chicken Biryani": {"price": 349, "restaurant": "Behrouz Biryani", "time": 45},
    "Butter Chicken": {"price": 399, "restaurant": "Moti Mahal", "time": 40},
    "Masala Dosa": {"price": 149, "restaurant": "Sagar Ratna", "time": 25},
    "Veg Burger": {"price": 189, "restaurant": "McDonald's", "time": 30},
    "Paneer Tikka": {"price": 279, "restaurant": "Barbeque Nation", "time": 35},
    "Pasta Arrabbiata": {"price": 249, "restaurant": "Domino's", "time": 30},
    "Fried Rice": {"price": 199, "restaurant": "Wow! Momo", "time": 25},
}

SWIGGY_MENU = {
    "Chicken Wrap": {"price": 219, "restaurant": "Fasos", "time": 30},
    "Dal Makhani": {"price": 269, "restaurant": "Punjab Grill", "time": 40},
    "Pav Bhaji": {"price": 169, "restaurant": "Shiv Sagar", "time": 25},
    "Chocolate Cake": {"price": 399, "restaurant": "The Cake Shop", "time": 45},
}


def search_food(query: str, platform: str = "zomato") -> dict:
    """Search for food items matching the query."""
    menu = ZOMATO_MENU if platform.lower() == "zomato" else SWIGGY_MENU
    results = []

    query_lower = query.lower()
    for item, details in menu.items():
        if any(word in item.lower() for word in query_lower.split()):
            results.append({
                "name": item,
                "price": details["price"],
                "restaurant": details["restaurant"],
                "delivery_time": details["time"],
                "platform": platform,
                "rating": round(random.uniform(4.0, 4.8), 1),
            })

    if not results:
        # Return some popular items if no exact match
        for item, details in list(menu.items())[:3]:
            results.append({
                "name": item,
                "price": details["price"],
                "restaurant": details["restaurant"],
                "delivery_time": details["time"],
                "platform": platform,
                "rating": round(random.uniform(4.0, 4.8), 1),
            })

    return {"results": results, "platform": platform, "query": query}


def place_order(
    item_name: str,
    restaurant: str,
    quantity: int = 1,
    platform: str = "zomato",
    address: str = "Home",
    special_instructions: Optional[str] = None,
) -> dict:
    """Place a food order."""
    menu = ZOMATO_MENU if platform.lower() == "zomato" else SWIGGY_MENU

    # Find the item
    item_details = None
    for name, details in menu.items():
        if name.lower() == item_name.lower() or item_name.lower() in name.lower():
            item_details = details
            item_name = name
            break

    if not item_details:
        item_details = {"price": 299, "restaurant": restaurant or "Local Restaurant", "time": 35}

    total = item_details["price"] * quantity
    delivery_fee = 30 if total < 299 else 0
    gst = round(total * 0.05)
    grand_total = total + delivery_fee + gst

    delivery_time = datetime.now() + timedelta(minutes=item_details["time"])

    order_id = f"{platform.upper()[:3]}{random.randint(100000, 999999)}"

    return {
        "order_id": order_id,
        "status": "confirmed",
        "item": item_name,
        "quantity": quantity,
        "restaurant": item_details["restaurant"],
        "platform": platform,
        "item_price": item_details["price"],
        "quantity": quantity,
        "subtotal": total,
        "delivery_fee": delivery_fee,
        "gst": gst,
        "grand_total": grand_total,
        "estimated_delivery": delivery_time.strftime("%I:%M %p"),
        "delivery_address": address,
        "special_instructions": special_instructions,
        "payment_method": "UPI",
        "tracking_url": f"https://{platform}.com/track/{order_id}",
    }
