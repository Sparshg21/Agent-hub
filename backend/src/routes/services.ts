import { Router, Request, Response } from 'express';

const router = Router();

// ─── GET /api/services ────────────────────────────────────────────────────────

const SERVICE_REGISTRY = [
  {
    id: 'swiggy',
    name: 'Swiggy',
    category: 'Food Delivery',
    emoji: '🍔',
    color: '#FC8019',
    description: 'Food delivery from 200,000+ restaurants',
    enabled: true,
    spendingLimit: 2000,
  },
  {
    id: 'zomato',
    name: 'Zomato',
    category: 'Food Delivery',
    emoji: '🍕',
    color: '#E23744',
    description: 'Food ordering and delivery',
    enabled: true,
    spendingLimit: 2000,
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    category: 'Quick Commerce',
    emoji: '⚡',
    color: '#F8C200',
    description: 'Grocery delivery in 10 minutes',
    enabled: true,
    spendingLimit: 3000,
  },
  {
    id: 'zepto',
    name: 'Zepto',
    category: 'Quick Commerce',
    emoji: '🛒',
    color: '#9B59B6',
    description: 'Groceries delivered in 8 minutes',
    enabled: true,
    spendingLimit: 3000,
  },
  {
    id: 'flights',
    name: 'Flight Booking',
    category: 'Travel',
    emoji: '✈️',
    color: '#2980B9',
    description: 'Search and book domestic flights',
    enabled: true,
    spendingLimit: 15000,
  },
  {
    id: 'payments',
    name: 'Payments & Recharges',
    category: 'Utilities',
    emoji: '💳',
    color: '#27AE60',
    description: 'Pay bills and recharge mobile plans',
    enabled: true,
    spendingLimit: 5000,
  },
];

router.get('/', (_req: Request, res: Response) => {
  return res.json({ services: SERVICE_REGISTRY });
});

router.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
