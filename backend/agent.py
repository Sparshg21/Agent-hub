"""
AgentHub AI Agent — the core orchestration brain.
Uses Claude with tool use to parse user intent and route to services.
"""
import json
import os
from typing import Any, AsyncGenerator
import anthropic

from services.food import search_food, place_order
from services.grocery import search_grocery, place_grocery_order
from services.flights import search_flights, book_flight
from services.utilities import get_bill_details, pay_bill
from services.calendar import create_event, set_reminder, list_events


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Tool definitions for Claude
TOOLS = [
    {
        "name": "search_food",
        "description": "Search for food items on Zomato or Swiggy. Use this when user wants to order food, search for a dish, or find restaurants.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Food item or dish to search for"},
                "platform": {"type": "string", "enum": ["zomato", "swiggy"], "description": "Food delivery platform to search on", "default": "zomato"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "order_food",
        "description": "Place a food order on Zomato or Swiggy. Use this after finding food items to confirm an order.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item_name": {"type": "string", "description": "Name of the food item to order"},
                "restaurant": {"type": "string", "description": "Restaurant name"},
                "quantity": {"type": "integer", "description": "Number of items to order", "default": 1},
                "platform": {"type": "string", "enum": ["zomato", "swiggy"], "default": "zomato"},
                "address": {"type": "string", "description": "Delivery address", "default": "Home"},
                "special_instructions": {"type": "string", "description": "Special preparation instructions"},
            },
            "required": ["item_name"],
        },
    },
    {
        "name": "search_grocery",
        "description": "Search for grocery items on Blinkit or Zepto for quick 10-minute delivery.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Grocery item to search for"},
                "platform": {"type": "string", "enum": ["blinkit", "zepto"], "default": "blinkit"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "order_grocery",
        "description": "Order groceries from Blinkit or Zepto. Use this to place grocery orders with multiple items.",
        "input_schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "description": "List of items to order",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "quantity": {"type": "integer", "default": 1},
                        },
                    },
                },
                "platform": {"type": "string", "enum": ["blinkit", "zepto"], "default": "blinkit"},
                "address": {"type": "string", "default": "Home"},
            },
            "required": ["items"],
        },
    },
    {
        "name": "search_flights",
        "description": "Search for available flights between two cities. Use this when user wants to book a flight or check flight options.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Departure city (e.g. 'Mumbai', 'Delhi')"},
                "destination": {"type": "string", "description": "Arrival city (e.g. 'Bangalore', 'Goa')"},
                "date": {"type": "string", "description": "Travel date in YYYY-MM-DD format"},
                "passengers": {"type": "integer", "description": "Number of passengers", "default": 1},
                "travel_class": {"type": "string", "enum": ["economy", "business", "first"], "default": "economy"},
            },
            "required": ["origin", "destination", "date"],
        },
    },
    {
        "name": "book_flight",
        "description": "Book a specific flight. Use this after showing search results and user confirms their choice.",
        "input_schema": {
            "type": "object",
            "properties": {
                "flight_number": {"type": "string"},
                "airline": {"type": "string"},
                "origin": {"type": "string"},
                "destination": {"type": "string"},
                "departure": {"type": "string", "description": "Departure time"},
                "travel_date": {"type": "string"},
                "passengers": {"type": "integer", "default": 1},
                "travel_class": {"type": "string", "default": "economy"},
                "passenger_name": {"type": "string", "default": "Traveller"},
                "total_price": {"type": "number"},
            },
            "required": ["flight_number", "airline", "origin", "destination", "departure", "travel_date", "total_price"],
        },
    },
    {
        "name": "get_bill_details",
        "description": "Get current bill details for utilities like electricity, mobile, broadband, gas, or DTH. Also use to check available mobile recharge plans.",
        "input_schema": {
            "type": "object",
            "properties": {
                "service_type": {"type": "string", "enum": ["electricity", "mobile", "broadband", "gas", "water", "dth"], "description": "Type of utility service"},
                "account_id": {"type": "string", "description": "Account number, mobile number, or consumer ID"},
                "operator": {"type": "string", "description": "Service provider name (e.g. Jio, Airtel, BESCOM)"},
            },
            "required": ["service_type", "account_id"],
        },
    },
    {
        "name": "pay_bill",
        "description": "Pay a utility bill or recharge a mobile number. Use this after showing bill details.",
        "input_schema": {
            "type": "object",
            "properties": {
                "service_type": {"type": "string", "enum": ["electricity", "mobile", "broadband", "gas", "water", "dth"]},
                "account_id": {"type": "string"},
                "amount": {"type": "number", "description": "Amount to pay in INR"},
                "operator": {"type": "string"},
                "plan_validity": {"type": "string", "description": "For mobile recharge: plan validity period"},
            },
            "required": ["service_type", "account_id", "amount"],
        },
    },
    {
        "name": "create_calendar_event",
        "description": "Create a calendar event or meeting. Use for scheduling appointments, meetings, or reminders.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Event title"},
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "time": {"type": "string", "description": "Time in HH:MM format (24-hour)", "default": "10:00"},
                "duration_minutes": {"type": "integer", "default": 60},
                "description": {"type": "string"},
                "location": {"type": "string"},
                "attendees": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "date"],
        },
    },
    {
        "name": "set_reminder",
        "description": "Set a simple reminder for the user.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "What to remind about"},
                "remind_at": {"type": "string", "description": "When to remind (e.g. 'tomorrow 9am', '2024-01-15 09:00')"},
                "notes": {"type": "string", "description": "Additional notes for the reminder"},
            },
            "required": ["title", "remind_at"],
        },
    },
]


def execute_tool(tool_name: str, tool_input: dict) -> Any:
    """Execute a tool and return the result."""
    try:
        if tool_name == "search_food":
            return search_food(**tool_input)
        elif tool_name == "order_food":
            return place_order(**tool_input)
        elif tool_name == "search_grocery":
            return search_grocery(**tool_input)
        elif tool_name == "order_grocery":
            return place_grocery_order(**tool_input)
        elif tool_name == "search_flights":
            return search_flights(
                origin=tool_input["origin"],
                destination=tool_input["destination"],
                date_str=tool_input["date"],
                passengers=tool_input.get("passengers", 1),
                travel_class=tool_input.get("travel_class", "economy"),
            )
        elif tool_name == "book_flight":
            return book_flight(**tool_input)
        elif tool_name == "get_bill_details":
            return get_bill_details(**tool_input)
        elif tool_name == "pay_bill":
            return pay_bill(**tool_input)
        elif tool_name == "create_calendar_event":
            return create_event(
                title=tool_input["title"],
                date_str=tool_input["date"],
                time_str=tool_input.get("time", "10:00"),
                duration_minutes=tool_input.get("duration_minutes", 60),
                description=tool_input.get("description"),
                location=tool_input.get("location"),
                attendees=tool_input.get("attendees"),
            )
        elif tool_name == "set_reminder":
            return set_reminder(**tool_input)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        return {"error": str(e)}


SYSTEM_PROMPT = """You are AgentHub AI, a powerful personal assistant that can perform real actions for users through integrated services.

You can:
🍕 Order food from Zomato or Swiggy
🛒 Order groceries from Blinkit or Zepto (10-minute delivery)
✈️ Search and book flights (domestic and international)
💡 Pay utility bills (electricity, mobile recharge, broadband, gas, water, DTH)
📅 Create calendar events and set reminders

Guidelines:
1. Be proactive — use tools immediately when you understand the intent
2. For food/grocery orders: search first, then confirm with user before ordering
3. For flights: always search first and present options clearly
4. For bill payments: always show bill details before paying
5. For high-value actions (>₹500): summarize what you're about to do before executing
6. Present results in a clean, readable format with prices in ₹
7. If information is missing (like travel date), ask concisely for just what you need
8. After completing an action, give a friendly confirmation with key details
9. Keep responses conversational and helpful — you're a smart assistant, not a robot

Current date: use your knowledge to interpret relative dates like "next Friday", "tomorrow", etc.
Default delivery address: Home
Default payment: UPI"""


async def run_agent(user_message: str, conversation_history: list = None) -> AsyncGenerator[dict, None]:
    """
    Run the agent with a user message.
    Yields events: tool_call, tool_result, text_delta, done
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    messages = list(conversation_history or [])
    messages.append({"role": "user", "content": user_message})

    # Agentic loop — keep going until no more tool calls
    max_iterations = 5
    for iteration in range(max_iterations):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # Collect all content from this response
        tool_calls = []
        text_parts = []

        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
                yield {"type": "text_delta", "text": block.text}
            elif block.type == "tool_use":
                tool_calls.append(block)
                yield {
                    "type": "tool_call",
                    "tool_name": block.name,
                    "tool_input": block.input,
                    "tool_use_id": block.id,
                }

        # Add assistant message to history
        messages.append({"role": "assistant", "content": response.content})

        # If no tool calls, we're done
        if response.stop_reason == "end_turn" or not tool_calls:
            break

        # Execute all tool calls
        tool_results = []
        for tool_call in tool_calls:
            result = execute_tool(tool_call.name, tool_call.input)
            yield {
                "type": "tool_result",
                "tool_name": tool_call.name,
                "tool_use_id": tool_call.id,
                "result": result,
            }
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_call.id,
                "content": json.dumps(result),
            })

        # Add tool results to messages for next iteration
        messages.append({"role": "user", "content": tool_results})

    yield {"type": "done", "updated_history": messages}
