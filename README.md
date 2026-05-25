# 🚀 AgentHub — AI Assistant that Gets Things Done

> Talk to AgentHub, and it makes things happen — order food, book flights, pay bills, buy groceries and more using just your voice or text.

![AgentHub](https://img.shields.io/badge/AI-Claude%20Sonnet-5b6ef5?style=flat-square) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square) ![React](https://img.shields.io/badge/Frontend-React%2018-61dafb?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice Input** | Speak your command — Web Speech API captures it instantly |
| 🤖 **Claude AI Brain** | Claude Sonnet with tool use routes intent → actions |
| 🍕 **Food Ordering** | Zomato & Swiggy integration with menu search |
| ⚡ **Grocery Delivery** | Blinkit & Zepto with 10-minute delivery |
| ✈️ **Flight Booking** | Search & book flights (domestic + international) |
| 💡 **Bill Payments** | Electricity, mobile recharge, broadband, gas, DTH |
| 📅 **Calendar** | Create events and set reminders |
| 🔒 **Trust Layer** | Spending limits, per-service toggles, confirmation thresholds |
| 📋 **Activity Feed** | Full log of every action taken |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           React Frontend                │
│  Voice → Chat UI → Activity Feed        │
└──────────────┬──────────────────────────┘
               │ WebSocket
┌──────────────▼──────────────────────────┐
│           FastAPI Backend               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Claude Sonnet AI Agent      │   │
│  │  (Tool Use + Agentic Loop)      │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │       Service Registry          │   │
│  │  Zomato │ Blinkit │ Flights     │   │
│  │  Swiggy │ Zepto   │ Utilities   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   SQLite DB (Activity + Settings)│  │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone & Setup

```bash
git clone https://github.com/sparshg21/agent-hub.git
cd Agent-hub
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

### 4. Docker (Alternative)

```bash
cp backend/.env.example backend/.env
# Add ANTHROPIC_API_KEY to backend/.env

docker-compose up --build
```

Open **http://localhost:3000**

---

## 💬 Example Commands

```
"Order Chicken Biryani from Zomato"
"Book cheapest flight to Delhi next Friday for 2 people"
"Order 2 litres of milk and a dozen eggs from Blinkit"
"Recharge my Airtel number 9876543210 with ₹299 plan"
"Pay my BESCOM electricity bill for account 1234567"
"Schedule a team meeting tomorrow at 3pm"
"Set a reminder to take medicine at 8am daily"
```

---

## 🔒 Trust & Safety

AgentHub includes a **User Trust Layer**:

- **Spending limits**: Set max spend per action
- **Confirmation threshold**: Require explicit confirmation above ₹X
- **Service toggles**: Enable/disable individual services
- **Activity log**: Every action is logged and auditable

---

## 🛣️ Roadmap

- [ ] Real API integrations (Zomato, Blinkit, MakeMyTrip)
- [ ] OAuth flows for service authentication
- [ ] Multi-user support with JWT auth
- [ ] Push notifications for order updates
- [ ] WhatsApp / Telegram bot interface
- [ ] iOS / Android app with native voice
- [ ] Payment gateway integration (Razorpay)
- [ ] Scheduled & recurring actions

---

## 📁 Project Structure

```
Agent-hub/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket
│   ├── agent.py             # Claude AI orchestrator
│   ├── models.py            # Database models
│   ├── database.py          # SQLite/PostgreSQL setup
│   ├── services/
│   │   ├── food.py          # Zomato/Swiggy
│   │   ├── grocery.py       # Blinkit/Zepto
│   │   ├── flights.py       # Flight search & booking
│   │   ├── utilities.py     # Bill payments
│   │   └── calendar.py      # Events & reminders
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app layout
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js  # Real-time chat
│   │   │   └── useVoice.js      # Speech recognition
│   │   └── components/
│   │       ├── MessageBubble.jsx
│   │       ├── VoiceButton.jsx
│   │       ├── ToolIndicator.jsx
│   │       ├── ActivityFeed.jsx
│   │       ├── SettingsPanel.jsx
│   │       └── SuggestedPrompts.jsx
│   └── package.json
└── docker-compose.yml
```

---

*Built with ❤️ using Claude AI — May 2026*
