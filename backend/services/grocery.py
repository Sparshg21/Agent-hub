"""
Grocery delivery service integrations — Blinkit & Zepto (10-minute delivery).
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

BLINKIT_CATALOG = {
    "Amul Milk 500ml": {"price": 30, "category": "dairy", "brand": "Amul", "unit": "500ml"},
    "Amul Butter 100g": {"price": 58, "category": "dairy", "brand": "Amul", "unit": "100g"},
    "Bread": {"price": 45, "category": "bakery", "brand": "Britannia", "unit": "400g"},
    "Eggs (6 pack)": {"price": 72, "category": "eggs", "brand": "Farm Fresh", "unit": "6 pcs"},
    "Basmati Rice 1kg": {"price": 125, "category": "grains", "brand": "India Gate", "unit": "1kg"},
    "Atta 5kg": {"price": 265, "category": "grains", "brand": "Aashirvaad", "unit": "5kg"},
    "Tomatoes 500g": {"price": 35, "category": "vegetables", "brand": "Fresh", "unit": "500g"},
    "Onions 1kg": {"price": 45, "category": "vegetables", "brand": "Fresh", "unit": "1kg"},
    "Potatoes 1kg": {"price": 40, "category": "vegetables", "brand": "Fresh", "unit": "1kg"},
    "Bananas (6 pcs)": {"price": 55, "category": "fruits", "brand": "Fresh", "unit": "6 pcs"},
    "Colgate Toothpaste 200g": {"price": 98, "category": "personal_care", "brand": "Colgate", "unit": "200g"},
    "Dettol Soap 75g": {"price": 48, "category": "personal_care", "brand": "Dettol", "unit": "75g"},
    "Tata Salt 1kg": {"price": 28, "category": "condiments", "brand": "Tata", "unit": "1kg"},
    "Sugar 1kg": {"price": 55, "category": "condiments", "brand": "Fresh", "unit": "1kg"},
    "Tea 250g": {"price": 145, "category": "beverages", "brand": "Tata Tea Gold", "unit": "250g"},
    "Coffee 100g": {"price": 185, "category": "beverages", "brand": "Nescafe", "unit": "100g"},
    "Maggi Noodles 70g": {"price": 14, "category": "snacks", "brand": "Maggi", "unit": "70g"},
    "Lay's Chips 26g": {"price": 20, "category": "snacks", "brand": "Lay's", "unit": "26g"},
    "Parle-G Biscuits 100g": {"price": 10, "category": "snacks", "brand": "Parle", "unit": "100g"},
    "Mineral Water 1L": {"price": 20, "category": "beverages", "brand": "Bisleri", "unit": "1L"},
}

ZEPTO_CATALOG = {**BLINKIT_CATALOG}  # Same catalog for simplicity, prices may vary slightly


def search_grocery(query: str, platform: str = "blinkit") -> dict:
    """Search for grocery items."""
    catalog = BLINKIT_CATALOG if platform.lower() == "blinkit" else ZEPTO_CATALOG
    results = []

    query_lower = query.lower()
    for item, details in catalog.items():
        if (any(word in item.lower() for word in query_lower.split())
                or query_lower in details.get("brand", "").lower()
                or query_lower in details.get("category", "").lower()):
            results.append({
                "name": item,
                "price": details["price"],
                "brand": details["brand"],
                "unit": details["unit"],
                "category": details["category"],
                "platform": platform,
                "in_stock": True,
                "delivery_time": "10 minutes",
            })

    if not results:
        for item, details in list(catalog.items())[:5]:
            results.append({
                "name": item,
                "price": details["price"],
                "brand": details["brand"],
                "unit": details["unit"],
                "category": details["category"],
                "platform": platform,
                "in_stock": True,
                "delivery_time": "10 minutes",
            })

    return {"results": results[:8], "platform": platform, "query": query}


def place_grocery_order(
    items: List[dict],  # [{"name": "Amul Milk 500ml", "quantity": 2}, ...]
    platform: str = "blinkit",
    address: str = "Home",
) -> dict:
    """Place a grocery order."""
    catalog = BLINKIT_CATALOG if platform.lower() == "blinkit" else ZEPTO_CATALOG

    order_items = []
    subtotal = 0

    for item_req in items:
        item_name = item_req.get("name", "")
        qty = item_req.get("quantity", 1)

        # Find matching item
        matched = None
        for name, details in catalog.items():
            if name.lower() == item_name.lower() or item_name.lower() in name.lower():
                matched = (name, details)
                break

        if matched:
            name, details = matched
            item_total = details["price"] * qty
            subtotal += item_total
            order_items.append({
                "name": name,
                "brand": details["brand"],
                "unit": details["unit"],
                "price": details["price"],
                "quantity": qty,
                "total": item_total,
            })

    delivery_fee = 0 if subtotal >= 199 else 25
    order_id = f"{'BLK' if platform == 'blinkit' else 'ZPT'}{random.randint(100000, 999999)}"
    delivery_time = datetime.now() + timedelta(minutes=10)

    return {
        "order_id": order_id,
        "status": "confirmed",
        "platform": platform,
        "items": order_items,
        "item_count": len(order_items),
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "grand_total": subtotal + delivery_fee,
        "estimated_delivery": delivery_time.strftime("%I:%M %p"),
        "delivery_address": address,
        "payment_method": "UPI",
        "tracking_url": f"https://{platform}.com/track/{order_id}",
    }
