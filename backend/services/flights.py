"""
Flight booking service integration.
Simulates realistic flight search and booking (MakeMyTrip / IndiGo / Air India style).
"""
import random
import uuid
from datetime import datetime, timedelta, date
from typing import Optional


AIRLINES = [
    {"name": "IndiGo", "code": "6E", "logo": "✈️"},
    {"name": "Air India", "code": "AI", "logo": "✈️"},
    {"name": "SpiceJet", "code": "SG", "logo": "✈️"},
    {"name": "Vistara", "code": "UK", "logo": "✈️"},
    {"name": "GoFirst", "code": "G8", "logo": "✈️"},
    {"name": "AkasaAir", "code": "QP", "logo": "✈️"},
]

CITIES = {
    "delhi": {"code": "DEL", "name": "Indira Gandhi International Airport"},
    "mumbai": {"code": "BOM", "name": "Chhatrapati Shivaji Maharaj International Airport"},
    "bangalore": {"code": "BLR", "name": "Kempegowda International Airport"},
    "bengaluru": {"code": "BLR", "name": "Kempegowda International Airport"},
    "chennai": {"code": "MAA", "name": "Chennai International Airport"},
    "kolkata": {"code": "CCU", "name": "Netaji Subhas Chandra Bose International Airport"},
    "hyderabad": {"code": "HYD", "name": "Rajiv Gandhi International Airport"},
    "pune": {"code": "PNQ", "name": "Pune International Airport"},
    "ahmedabad": {"code": "AMD", "name": "Sardar Vallabhbhai Patel International Airport"},
    "goa": {"code": "GOI", "name": "Dabolim Airport"},
    "jaipur": {"code": "JAI", "name": "Jaipur International Airport"},
    "kochi": {"code": "COK", "name": "Cochin International Airport"},
    "dubai": {"code": "DXB", "name": "Dubai International Airport"},
    "singapore": {"code": "SIN", "name": "Singapore Changi Airport"},
    "london": {"code": "LHR", "name": "Heathrow Airport"},
    "new york": {"code": "JFK", "name": "John F. Kennedy International Airport"},
}


def _get_city(city_name: str) -> dict:
    city_lower = city_name.lower().strip()
    for key, val in CITIES.items():
        if key in city_lower or city_lower in key:
            return val
    return {"code": city_name[:3].upper(), "name": f"{city_name} Airport"}


def _generate_flight_price(base: int, airline: dict, travel_class: str) -> int:
    multipliers = {"economy": 1.0, "business": 2.8, "first": 4.5}
    airline_multiplier = {
        "IndiGo": 0.85, "SpiceJet": 0.80, "GoFirst": 0.78,
        "Air India": 1.0, "Vistara": 1.1, "AkasaAir": 0.82,
    }
    m = multipliers.get(travel_class.lower(), 1.0)
    am = airline_multiplier.get(airline["name"], 1.0)
    return int(base * m * am * random.uniform(0.9, 1.15))


def search_flights(
    origin: str,
    destination: str,
    date_str: str,
    passengers: int = 1,
    travel_class: str = "economy",
) -> dict:
    """Search for available flights."""
    origin_info = _get_city(origin)
    dest_info = _get_city(destination)

    # Parse date
    try:
        travel_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        travel_date = date.today() + timedelta(days=7)

    flights = []
    base_prices = {"economy": random.randint(3500, 8000), "business": 15000, "first": 30000}
    base_price = base_prices.get(travel_class.lower(), 5000)

    for i, airline in enumerate(random.sample(AIRLINES, min(4, len(AIRLINES)))):
        hour = random.randint(5, 22)
        minute = random.choice([0, 15, 30, 45])
        duration_mins = random.randint(90, 180)

        dep_time = datetime.combine(travel_date, datetime.min.time().replace(hour=hour, minute=minute))
        arr_time = dep_time + timedelta(minutes=duration_mins)

        price = _generate_flight_price(base_price, airline, travel_class)
        total_price = price * passengers

        flights.append({
            "flight_number": f"{airline['code']}{random.randint(100, 999)}",
            "airline": airline["name"],
            "origin_code": origin_info["code"],
            "destination_code": dest_info["code"],
            "origin_city": origin,
            "destination_city": destination,
            "departure": dep_time.strftime("%H:%M"),
            "arrival": arr_time.strftime("%H:%M"),
            "duration": f"{duration_mins // 60}h {duration_mins % 60}m",
            "travel_class": travel_class,
            "price_per_person": price,
            "total_price": total_price,
            "passengers": passengers,
            "seats_left": random.randint(2, 15),
            "date": travel_date.strftime("%d %b %Y"),
            "refundable": random.choice([True, False]),
            "baggage": "15kg" if travel_class == "economy" else "30kg",
        })

    # Sort by price
    flights.sort(key=lambda x: x["price_per_person"])

    return {
        "flights": flights,
        "origin": f"{origin.title()} ({origin_info['code']})",
        "destination": f"{destination.title()} ({dest_info['code']})",
        "date": travel_date.strftime("%d %b %Y"),
        "passengers": passengers,
        "travel_class": travel_class,
        "cheapest_price": flights[0]["total_price"] if flights else 0,
    }


def book_flight(
    flight_number: str,
    airline: str,
    origin: str,
    destination: str,
    departure: str,
    travel_date: str,
    passengers: int = 1,
    travel_class: str = "economy",
    passenger_name: str = "Traveller",
    total_price: float = 5000,
) -> dict:
    """Book a flight."""
    booking_id = f"AH{random.randint(10000000, 99999999)}"
    pnr = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))

    return {
        "booking_id": booking_id,
        "pnr": pnr,
        "status": "confirmed",
        "flight_number": flight_number,
        "airline": airline,
        "origin": origin,
        "destination": destination,
        "departure": departure,
        "date": travel_date,
        "travel_class": travel_class,
        "passengers": passengers,
        "passenger_name": passenger_name,
        "total_price": total_price,
        "payment_method": "UPI",
        "baggage": "15kg" if travel_class == "economy" else "30kg",
        "check_in_opens": "24 hours before departure",
        "cancellation_policy": "Free cancellation within 24 hours",
        "e_ticket_url": f"https://agenthub.app/tickets/{booking_id}",
    }
