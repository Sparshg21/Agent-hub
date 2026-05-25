// ─── Core Domain Types ───────────────────────────────────────────────────────

export type ServiceName =
  | 'swiggy'
  | 'zomato'
  | 'blinkit'
  | 'zepto'
  | 'flights'
  | 'payments'
  | 'calendar';

export type ActionStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MessageRole = 'user' | 'assistant' | 'system';

// ─── User Settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  spendingLimits: Record<ServiceName, number>; // max spend per action (INR)
  enabledServices: Record<ServiceName, boolean>;
  confirmationThreshold: number; // INR — above this always ask
  savedAddresses: Address[];
  savedPaymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  label: string; // "Home", "Office", etc.
  line1: string;
  city: string;
  pincode: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  type: 'upi' | 'card' | 'wallet' | 'cod';
  masked?: string;
}

// ─── Action / Task Types ──────────────────────────────────────────────────────

export interface PendingAction {
  id: string;
  type: string;           // 'food_order' | 'grocery_order' | 'flight_booking' etc.
  service: ServiceName;
  summary: string;        // Human-readable description
  details: Record<string, unknown>;
  estimatedCost: number;  // INR
  status: ActionStatus;
  createdAt: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

// ─── Service Response Types ───────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;   // "25-35 min"
  deliveryFee: number;
  minOrder: number;
  platform: 'swiggy' | 'zomato';
  imageEmoji: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isPopular: boolean;
}

export interface GroceryProduct {
  id: string;
  name: string;
  brand: string;
  unit: string;          // "500g", "1L", etc.
  price: number;
  originalPrice: number;
  platform: 'blinkit' | 'zepto';
  deliveryTime: string;  // "10 min"
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
  class: 'economy' | 'business' | 'first';
  seatsLeft: number;
  imageEmoji: string;
}

export interface OrderResult {
  orderId: string;
  status: string;
  estimatedTime: string;
  trackingUrl?: string;
  amount: number;
  paymentStatus: string;
}

export interface BookingResult {
  bookingId: string;
  pnr: string;
  status: string;
  amount: number;
  downloadUrl?: string;
}

// ─── Chat / Message Types ─────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  pendingAction?: PendingAction;
  searchResults?: SearchResult[];
}

export interface SearchResult {
  type: 'restaurants' | 'products' | 'flights';
  items: (Restaurant | GroceryProduct | Flight)[];
}

// ─── API Request/Response ─────────────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  sessionId: string;
  conversationHistory?: Array<{ role: MessageRole; content: string }>;
}

export interface ChatResponse {
  message: string;
  pendingAction?: PendingAction;
  searchResults?: SearchResult;
  actionId?: string;
}

export interface ConfirmActionRequest {
  actionId: string;
  sessionId: string;
}

export interface ConfirmActionResponse {
  success: boolean;
  result?: OrderResult | BookingResult;
  message: string;
}
