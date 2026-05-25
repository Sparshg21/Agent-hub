"""
AgentHub FastAPI Backend
Main application entry point with REST + WebSocket API.
"""
import json
import os
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import uvicorn

from database import get_db, init_db
from models import Activity, UserSettings
from agent import run_agent


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Create default user settings if not exist
    async with __import__('database').AsyncSessionLocal() as db:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == "default_user"))
        if not result.scalar_one_or_none():
            db.add(UserSettings(user_id="default_user"))
            await db.commit()
    yield


app = FastAPI(title="AgentHub API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    user_id: str = "default_user"


class SettingsUpdate(BaseModel):
    max_spend_per_action: Optional[float] = None
    require_confirmation_above: Optional[float] = None
    enabled_services: Optional[list] = None
    blackout_categories: Optional[list] = None
    preferred_payment: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None


class ActivityUpdate(BaseModel):
    status: str  # confirmed | cancelled


# ── Helper ────────────────────────────────────────────────────────────────────
async def get_user_settings(user_id: str, db: AsyncSession) -> UserSettings:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


def needs_confirmation(amount: float, settings: UserSettings) -> bool:
    return amount >= settings.require_confirmation_above


# ── REST Routes ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AgentHub API", "version": "1.0.0"}


@app.get("/api/settings/{user_id}")
async def get_settings(user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    settings = await get_user_settings(user_id, db)
    return {
        "user_id": settings.user_id,
        "name": settings.name,
        "phone": settings.phone,
        "max_spend_per_action": settings.max_spend_per_action,
        "require_confirmation_above": settings.require_confirmation_above,
        "enabled_services": json.loads(settings.enabled_services),
        "blackout_categories": json.loads(settings.blackout_categories),
        "preferred_payment": settings.preferred_payment,
    }


@app.patch("/api/settings/{user_id}")
async def update_settings(
    update: SettingsUpdate,
    user_id: str = "default_user",
    db: AsyncSession = Depends(get_db),
):
    settings = await get_user_settings(user_id, db)

    if update.max_spend_per_action is not None:
        settings.max_spend_per_action = update.max_spend_per_action
    if update.require_confirmation_above is not None:
        settings.require_confirmation_above = update.require_confirmation_above
    if update.enabled_services is not None:
        settings.enabled_services = json.dumps(update.enabled_services)
    if update.blackout_categories is not None:
        settings.blackout_categories = json.dumps(update.blackout_categories)
    if update.preferred_payment is not None:
        settings.preferred_payment = update.preferred_payment
    if update.name is not None:
        settings.name = update.name
    if update.phone is not None:
        settings.phone = update.phone

    await db.commit()
    await db.refresh(settings)
    return {"success": True, "settings": update.dict(exclude_none=True)}


@app.get("/api/activity/{user_id}")
async def get_activity(
    user_id: str = "default_user",
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Activity)
        .where(Activity.user_id == user_id)
        .order_by(desc(Activity.created_at))
        .limit(limit)
    )
    activities = result.scalars().all()
    return [
        {
            "id": a.id,
            "service": a.service,
            "action": a.action,
            "intent": a.intent,
            "status": a.status,
            "details": json.loads(a.details) if a.details else {},
            "amount": a.amount,
            "confirmation_required": a.confirmation_required,
            "result": json.loads(a.result) if a.result else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]


@app.patch("/api/activity/{activity_id}")
async def update_activity(
    activity_id: str,
    update: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.status = update.status
    activity.confirmed_by_user = (update.status == "confirmed")
    await db.commit()
    return {"success": True, "status": update.status}


# ── WebSocket Chat ────────────────────────────────────────────────────────────
conversation_histories: dict[str, list] = {}


@app.websocket("/ws/chat/{user_id}")
async def chat_websocket(websocket: WebSocket, user_id: str = "default_user"):
    await websocket.accept()

    # Initialize conversation history for this user
    if user_id not in conversation_histories:
        conversation_histories[user_id] = []

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to AgentHub AI ✨",
        })

        # Get a new DB session for this connection
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            settings_result = await db.execute(
                select(UserSettings).where(UserSettings.user_id == user_id)
            )
            settings = settings_result.scalar_one_or_none()
            if not settings:
                settings = UserSettings(user_id=user_id)
                db.add(settings)
                await db.commit()
                await db.refresh(settings)

            while True:
                data = await websocket.receive_json()
                user_message = data.get("message", "")

                if not user_message.strip():
                    continue

                # Run the agent
                full_response = ""
                tool_calls_made = []

                async for event in run_agent(user_message, conversation_histories.get(user_id, [])):
                    if event["type"] == "text_delta":
                        full_response += event["text"]
                        await websocket.send_json({
                            "type": "text_delta",
                            "text": event["text"],
                        })

                    elif event["type"] == "tool_call":
                        await websocket.send_json({
                            "type": "tool_call",
                            "tool_name": event["tool_name"],
                            "tool_input": event["tool_input"],
                        })
                        tool_calls_made.append(event)

                    elif event["type"] == "tool_result":
                        result_data = event["result"]
                        amount = None

                        # Extract amount for activity logging
                        if isinstance(result_data, dict):
                            amount = (
                                result_data.get("grand_total")
                                or result_data.get("total_price")
                                or result_data.get("amount_paid")
                            )

                        # Map tool name to service
                        tool_service_map = {
                            "search_food": "zomato",
                            "order_food": "zomato",
                            "search_grocery": "blinkit",
                            "order_grocery": "blinkit",
                            "search_flights": "flights",
                            "book_flight": "flights",
                            "get_bill_details": "utilities",
                            "pay_bill": "utilities",
                            "create_calendar_event": "calendar",
                            "set_reminder": "calendar",
                        }

                        service = tool_service_map.get(event["tool_name"], "other")

                        # Log to activity feed only for transactional actions
                        action_verbs = ["order_food", "order_grocery", "book_flight", "pay_bill",
                                       "create_calendar_event", "set_reminder"]
                        if event["tool_name"] in action_verbs:
                            requires_confirm = amount and needs_confirmation(amount, settings)
                            activity = Activity(
                                user_id=user_id,
                                service=service,
                                action=event["tool_name"],
                                intent=user_message,
                                status="completed",
                                details=json.dumps(event.get("tool_input", {})),
                                amount=amount,
                                confirmation_required=bool(requires_confirm),
                                result=json.dumps(result_data),
                            )
                            db.add(activity)
                            await db.commit()

                        await websocket.send_json({
                            "type": "tool_result",
                            "tool_name": event["tool_name"],
                            "result": result_data,
                        })

                    elif event["type"] == "done":
                        # Update conversation history
                        conversation_histories[user_id] = event["updated_history"][-20:]  # Keep last 20 messages
                        await websocket.send_json({"type": "response_complete"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
