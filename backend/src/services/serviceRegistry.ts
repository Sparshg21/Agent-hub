/**
 * Service Registry — mock implementations of external service APIs.
 * Each function simulates a real API call with realistic data and delays.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Restaurant,
  MenuItem,
  GroceryProduct,
  Flight,
  OrderResult,
  BookingResult,
} from '../types';
import {
  RESTAURANTS,
  MENU_ITEMS,
  GROCERY_PRODUCTS,
  FLIGHTS,
  CITY_CODES,
} from './mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Food Delivery ─────────────────────────────────────────────────────────────

export async function searchRestaurants(
  query: string,
  platform?: 'swiggy' | 'zomato' | 'any'
): Promise<Restaurant[]> {
  await delay(400);
  const q = query.toLowerCase();
  return RESTAURANTS.filter((r) => {
    const matchesPlatform = !platform || platform === 'any' || r.platform === platform;
    const matchesQuery =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q);
    return matchesPlatform && matchesQuery;
  }).slice(0, 5);
}

export async function getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
  await delay(300);
  return MENU_ITEMS[restaurantId] || [];
}

export async function placeFoodOrder(
  restaurantId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
  platform: 'swiggy' | 'zomato',
  deliveryAddress: string,
  paymentMethod: string
): Promise<OrderResult> {
  await delay(600);
  const restaurant = RESTAURANTS.find((r) => r.id === restaurantId);
  const menuItems = MENU_ITEMS[restaurantId] || [];

  let total = 0;
  for (const item of items) {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (menuItem) {
      total += menuItem.price * item.quantity;
    }
  }
  total += restaurant?.deliveryFee || 0;

  return {
    orderId: `${platform.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    status: 'confirmed',
    estimatedTime: restaurant?.deliveryTime || '30-40 min',
    trackingUrl: `https://${platform}.com/track/${uuidv4()}`,
    amount: total,
    paymentStatus: 'paid',
  };
}

// ─── Quick Commerce (Grocery) ──────────────────────────────────────────────────

export async function searchProducts(
  query: string,
  platform?: 'blinkit' | 'zepto' | 'any'
): Promise<GroceryProduct[]> {
  await delay(350);
  const q = query.toLowerCase();
  return GROCERY_PRODUCTS.filter((p) => {
    const matchesPlatform = !platform || platform === 'any' || p.platform === platform;
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    return matchesPlatform && matchesQuery;
  }).slice(0, 6);
}

export async function placeGroceryOrder(
  items: Array<{ productId: string; quantity: number }>,
  platform: 'blinkit' | 'zepto',
  deliveryAddress: string,
  paymentMethod: string
): Promise<OrderResult> {
  await delay(500);

  let total = 0;
  for (const item of items) {
    const product = GROCERY_PRODUCTS.find((p) => p.id === item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  const firstProduct = GROCERY_PRODUCTS.find((p) =>
    items.some((i) => i.productId === p.id)
  );

  return {
    orderId: `${platform.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    status: 'confirmed',
    estimatedTime: firstProduct?.deliveryTime || '10 min',
    trackingUrl: `https://${platform}.com/track/${uuidv4()}`,
    amount: total,
    paymentStatus: 'paid',
  };
}

// ─── Flights ──────────────────────────────────────────────────────────────────

export async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  travelClass: 'economy' | 'business' | 'first' = 'economy'
): Promise<Flight[]> {
  await delay(800);

  const originCode = CITY_CODES[origin.toLowerCase()] || origin.toUpperCase();
  const destCode = CITY_CODES[destination.toLowerCase()] || destination.toUpperCase();

  const matches = FLIGHTS.filter(
    (f) =>
      f.origin === originCode &&
      f.destination === destCode &&
      (travelClass === 'economy' || f.class === travelClass)
  );

  // If no exact match, return all flights for demo purposes
  if (matches.length === 0) {
    return FLIGHTS.filter((f) => travelClass === 'economy' || f.class === travelClass).slice(0, 3);
  }

  return matches;
}

export async function bookFlight(
  flightId: string,
  passengerName: string,
  passengerEmail: string,
  passengerPhone: string,
  paymentMethod: string
): Promise<BookingResult> {
  await delay(1000);

  const flight = FLIGHTS.find((f) => f.id === flightId);

  return {
    bookingId: `BK${Date.now().toString(36).toUpperCase()}`,
    pnr: Math.random().toString(36).substring(2, 8).toUpperCase(),
    status: 'confirmed',
    amount: flight?.price || 4999,
    downloadUrl: `https://agenthub.app/tickets/${uuidv4()}`,
  };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function payBill(
  billerName: string,
  accountNumber: string,
  amount: number,
  paymentMethod: string
): Promise<{ transactionId: string; status: string; amount: number }> {
  await delay(700);
  return {
    transactionId: `TXN${Date.now().toString(36).toUpperCase()}`,
    status: 'success',
    amount,
  };
}

export async function rechargePlan(
  operator: string,
  phoneNumber: string,
  planAmount: number,
  paymentMethod: string
): Promise<{ transactionId: string; status: string; validityDays: number }> {
  await delay(500);
  return {
    transactionId: `RCH${Date.now().toString(36).toUpperCase()}`,
    status: 'success',
    validityDays: planAmount >= 299 ? 84 : 28,
  };
}
