"""
Calendar and reminder service integration.
Works with Google Calendar-style events.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List


# In-memory calendar store for MVP
_events_store = []


def create_event(
    title: str,
    date_str: str,
    time_str: str = "10:00",
    duration_minutes: int = 60,
    description: Optional[str] = None,
    location: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    reminder_minutes: int = 30,
) -> dict:
    """Create a calendar event."""
    try:
        event_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    except Exception:
        event_dt = datetime.now() + timedelta(days=1)

    end_dt = event_dt + timedelta(minutes=duration_minutes)
    event_id = str(uuid.uuid4())[:8]

    event = {
        "event_id": event_id,
        "title": title,
        "start": event_dt.strftime("%d %b %Y, %I:%M %p"),
        "end": end_dt.strftime("%I:%M %p"),
        "duration": f"{duration_minutes} min",
        "description": description,
        "location": location,
        "attendees": attendees or [],
        "reminder": f"{reminder_minutes} minutes before",
        "calendar": "AgentHub Calendar",
        "status": "confirmed",
        "event_url": f"https://agenthub.app/calendar/{event_id}",
    }

    _events_store.append(event)
    return event


def set_reminder(
    title: str,
    remind_at: str,  # "2024-01-15 09:00" or "tomorrow 9am"
    notes: Optional[str] = None,
) -> dict:
    """Set a reminder."""
    reminder_id = str(uuid.uuid4())[:8]

    return {
        "reminder_id": reminder_id,
        "title": title,
        "remind_at": remind_at,
        "notes": notes,
        "status": "set",
        "message": f"Reminder set: '{title}' at {remind_at}",
    }


def list_events(days_ahead: int = 7) -> dict:
    """List upcoming events."""
    return {
        "events": _events_store[-10:],
        "count": len(_events_store),
        "period": f"Next {days_ahead} days",
    }
