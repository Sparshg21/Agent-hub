# 🤖 AgentHub

> A universal AI assistant that gets things done in the real world — just by talking.

AgentHub bridges Claude AI with real-world services through a unified agent-callable API layer. Users simply tell their assistant what they want, and it happens.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎙️ **Voice-first** | Speak naturally — powered by Web Speech API (en-IN) |
| 🍔 **Food ordering** | Search restaurants & order from Swiggy or Zomato |
| 🛒 **Quick commerce** | Get groceries in 10 min from Blinkit or Zepto |
| ✈️ **Flight booking** | Search and book domestic flights |
| 💳 **Payments** | Pay bills, recharge Jio/Airtel/Vi |
| 🛡️ **Trust layer** | Spending limits, confirmation thresholds per service |
| 📋 **Activity log** | Full history of all actions with order IDs / PNRs |
| 🌙 **Dark UI** | Beautiful dark-themed interface with animations |

---

## 🏗️ Architecture

```
agenthub/
├── backend/          # Express + TypeScript API
│   ├── src/
│   │   ├── services/
│   │   │   ├── claudeAgent.ts    # Claude API + tool calling
│   │   │   ├── serviceRegistry.ts # Mock service APIs
│   │   │   └── mockData.ts       # Realistic mock data
│   │   ├── routes/
│   │   │   ├── chat.ts           # /api/chat endpoints
│   │   │   └── services.ts       # /api/services endpoint
│   │   └── index.ts              # Express server
│   └── package.json
│
└── frontend/         # React + TypeScript + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── ChatInterface/    # Main conversation UI
    │   │   ├── VoiceButton/      # Mic button + waveform
    │   │   ├── ActionCard/       # Confirm / cancel cards
    │   │   ├── ActivityFeed/     # Action history
    │   │   ├── ServicePanel/     # Connected services list
    │   │   ├── SettingsPanel/    # Spending limits + prefs
    │   │   └── Layout/           # Sidebar + Header
    │   ├── hooks/
    │   │   └── useSpeechRecognition.ts
    │   ├── store/
    │   │   └── useStore.ts       # Zustand global state
    │   └── pages/App.tsx
    └── package.json
```

**Flow:**
```
Voice/Text → Frontend → POST /api/chat
  → Claude API (tool calling) → Mock Service
  → PendingAction created → User sees confirmation card
  → User confirms → POST /api/chat/confirm
  → Real action executes → Order ID / PNR returned
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

### 2. Setup

```bash
# Clone and install all deps
git clone https://github.com/sparshg21/agent-hub.git
cd agent-hub
npm run install:all
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

### 4. Run

```bash
# Run both frontend + backend in one command
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/api/health

---

## 💬 Example Conversations

```
You: "Order my usual biryani from Zomato"
AgentHub: Searching Zomato for biryani... I found Behrouz Biryani (⭐4.5, 35-45 min).
          Their Chicken Biryani is ₹399. Want me to place the order? [Confirm] [Cancel]

You: "Book me the cheapest flight to Mumbai next Friday"
AgentHub: I found 2 options:
          • IndiGo 6E-204 — ₹4,299 — Departs 06:15
          • Air India AI-101 — ₹5,899 — Departs 09:00
          Book IndiGo for ₹4,299? [Confirm] [Cancel]

You: "Recharge my Jio number 9999999999 with ₹299"
AgentHub: ₹299 Jio recharge for 9999999999. Total: ₹299. Proceed? [Confirm] [Cancel]
```

---

## 🔧 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send a message, get AI response + optional action |
| `/api/chat/confirm` | POST | Execute a confirmed pending action |
| `/api/chat/cancel` | POST | Cancel a pending action |
| `/api/chat/actions` | GET | Get full activity log |
| `/api/services` | GET | List all registered services |
| `/api/health` | GET | Health check |

---

## 🛡️ Trust Layer

Every action above a configured spending limit requires explicit confirmation:

1. Claude parses intent → creates a `PendingAction`
2. Frontend shows an **ActionCard** with full details + estimated cost
3. User taps **Confirm** or **Cancel**
4. Only on confirm does the actual order/booking execute

Spending limits are configurable per service in the Settings panel.

---

## 🗺️ Roadmap

- [ ] Real Swiggy / Zomato API integration
- [ ] Real Blinkit / Zepto integration
- [ ] Google Flights / IRCTC / MakeMyTrip
- [ ] Razorpay / PhonePe payment flows
- [ ] Push notifications for order updates
- [ ] Multi-language voice (Hindi, Tamil, etc.)
- [ ] Mobile app (React Native)
- [ ] B2B enterprise API

---

## 📄 License

MIT — Built with ❤️ for India

---

*Drafted May 2026 · Powered by Claude AI*
