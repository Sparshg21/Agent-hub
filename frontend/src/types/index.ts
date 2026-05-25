export type ServiceName = 'swiggy' | 'zomato' | 'blinkit' | 'zepto' | 'flights' | 'payments';

export type ActionStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PendingAction {
  id: string;
  type: string;
  service: ServiceName;
  summary: string;
  details: Record<string, unknown>;
  estimatedCost: number;
  status: ActionStatus;
  createdAt: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pendingAction?: PendingAction;
  isTyping?: boolean;
}

export interface Service {
  id: ServiceName;
  name: string;
  category: string;
  emoji: string;
  color: string;
  description: string;
  enabled: boolean;
  spendingLimit: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  platform: 'swiggy' | 'zomato';
  imageEmoji: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  class: string;
  seatsLeft: number;
}
