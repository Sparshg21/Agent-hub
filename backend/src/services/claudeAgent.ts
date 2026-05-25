/**
 * Claude Agent — the brain of AgentHub.
 * Uses Claude's tool-calling API to understand user intent and route to services.
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { PendingAction, ChatResponse } from '../types';
import * as registry from './serviceRegistry';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_restaurants',
    description:
      'Search for restaurants on Swiggy or Zomato. Use when user wants to order food.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Food type or restaurant name (e.g. "biryani", "pizza", "KFC")',
        },
        platform: {
          type: 'string',
          enum: ['swiggy', 'zomato', 'any'],
          description: 'Which platform to search on',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'place_food_order',
    description:
      'Place a food order on Swiggy or Zomato. Only call after user confirms. Returns a PendingAction for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        restaurantId: { type: 'string', description: 'ID of the restaurant' },
        restaurantName: { type: 'string', description: 'Name of the restaurant' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              menuItemId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
            },
            required: ['menuItemId', 'name', 'quantity', 'price'],
          },
        },
        platform: { type: 'string', enum: ['swiggy', 'zomato'] },
        estimatedTotal: { type: 'number', description: 'Total cost in INR' },
      },
      required: ['restaurantId', 'restaurantName', 'items', 'platform', 'estimatedTotal'],
    },
  },
  {
    name: 'search_grocery_products',
    description:
      'Search for grocery or quick-commerce products on Blinkit or Zepto.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Product name or category (e.g. "milk", "chips", "energy drink")',
        },
        platform: {
          type: 'string',
          enum: ['blinkit', 'zepto', 'any'],
          description: 'Which platform to search on',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'place_grocery_order',
    description:
      'Place a grocery/quick-commerce order on Blinkit or Zepto. Returns a PendingAction for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
            },
            required: ['productId', 'name', 'quantity', 'price'],
          },
        },
        platform: { type: 'string', enum: ['blinkit', 'zepto'] },
        estimatedTotal: { type: 'number' },
      },
      required: ['items', 'platform', 'estimatedTotal'],
    },
  },
  {
    name: 'search_flights',
    description:
      'Search for available flights between two cities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        origin: { type: 'string', description: 'Origin city or airport code (e.g. "Delhi", "BOM")' },
        destination: { type: 'string', description: 'Destination city or airport code' },
        date: { type: 'string', description: 'Travel date (e.g. "next Friday", "2024-12-25")' },
        travelClass: {
          type: 'string',
          enum: ['economy', 'business', 'first'],
          description: 'Seat class',
        },
      },
      required: ['origin', 'destination', 'date'],
    },
  },
  {
    name: 'book_flight',
    description:
      'Book a specific flight. Returns a PendingAction for user confirmation before booking.',
    input_schema: {
      type: 'object' as const,
      properties: {
        flightId: { type: 'string' },
        airline: { type: 'string' },
        flightNo: { type: 'string' },
        route: { type: 'string', description: 'e.g. "Delhi → Mumbai"' },
        departure: { type: 'string' },
        arrival: { type: 'string' },
        price: { type: 'number' },
        travelClass: { type: 'string' },
        passengerName: { type: 'string' },
      },
      required: ['flightId', 'airline', 'flightNo', 'route', 'price', 'passengerName'],
    },
  },
  {
    name: 'pay_bill',
    description: 'Pay a utility bill or subscription. Returns a PendingAction for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        billerName: { type: 'string', description: 'e.g. "Tata Power", "Airtel Postpaid"' },
        accountNumber: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['billerName', 'accountNumber', 'amount'],
    },
  },
  {
    name: 'recharge_phone',
    description: 'Recharge a mobile phone plan. Returns a PendingAction for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        operator: { type: 'string', description: 'e.g. "Jio", "Airtel", "Vi"' },
        phoneNumber: { type: 'string' },
        planAmount: { type: 'number', description: 'Recharge amount in INR' },
      },
      required: ['operator', 'phoneNumber', 'planAmount'],
    },
  },
];

// ─── In-Memory Action Store ───────────────────────────────────────────────────

const pendingActions = new Map<string, PendingAction>();

export function getPendingAction(actionId: string): PendingAction | undefined {
  return pendingActions.get(actionId);
}

export function getAllActions(): PendingAction[] {
  return Array.from(pendingActions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─── Tool Execution ───────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<{ content: string; pendingAction?: PendingAction }> {
  switch (toolName) {
    case 'search_restaurants': {
      const results = await registry.searchRestaurants(
        toolInput.query as string,
        toolInput.platform as 'swiggy' | 'zomato' | 'any' | undefined
      );
      return {
        content: JSON.stringify({ restaurants: results }),
      };
    }

    case 'place_food_order': {
      const action: PendingAction = {
        id: uuidv4(),
        type: 'food_order',
        service: toolInput.platform as 'swiggy' | 'zomato',
        summary: `Order from ${toolInput.restaurantName} on ${toolInput.platform}`,
        details: toolInput,
        estimatedCost: toolInput.estimatedTotal as number,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
      };
      pendingActions.set(action.id, action);
      return {
        content: JSON.stringify({ actionId: action.id, requiresConfirmation: true }),
        pendingAction: action,
      };
    }

    case 'search_grocery_products': {
      const results = await registry.searchProducts(
        toolInput.query as string,
        toolInput.platform as 'blinkit' | 'zepto' | 'any' | undefined
      );
      return {
        content: JSON.stringify({ products: results }),
      };
    }

    case 'place_grocery_order': {
      const action: PendingAction = {
        id: uuidv4(),
        type: 'grocery_order',
        service: toolInput.platform as 'blinkit' | 'zepto',
        summary: `Grocery order on ${toolInput.platform}`,
        details: toolInput,
        estimatedCost: toolInput.estimatedTotal as number,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
      };
      pendingActions.set(action.id, action);
      return {
        content: JSON.stringify({ actionId: action.id, requiresConfirmation: true }),
        pendingAction: action,
      };
    }

    case 'search_flights': {
      const results = await registry.searchFlights(
        toolInput.origin as string,
        toolInput.destination as string,
        toolInput.date as string,
        (toolInput.travelClass as 'economy' | 'business' | 'first') || 'economy'
      );
      return {
        content: JSON.stringify({ flights: results }),
      };
    }

    case 'book_flight': {
      const action: PendingAction = {
        id: uuidv4(),
        type: 'flight_booking',
        service: 'flights',
        summary: `${toolInput.airline} ${toolInput.flightNo} — ${toolInput.route}`,
        details: toolInput,
        estimatedCost: toolInput.price as number,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
      };
      pendingActions.set(action.id, action);
      return {
        content: JSON.stringify({ actionId: action.id, requiresConfirmation: true }),
        pendingAction: action,
      };
    }

    case 'pay_bill': {
      const action: PendingAction = {
        id: uuidv4(),
        type: 'bill_payment',
        service: 'payments',
        summary: `Pay ₹${toolInput.amount} to ${toolInput.billerName}`,
        details: toolInput,
        estimatedCost: toolInput.amount as number,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
      };
      pendingActions.set(action.id, action);
      return {
        content: JSON.stringify({ actionId: action.id, requiresConfirmation: true }),
        pendingAction: action,
      };
    }

    case 'recharge_phone': {
      const action: PendingAction = {
        id: uuidv4(),
        type: 'recharge',
        service: 'payments',
        summary: `₹${toolInput.planAmount} recharge for ${toolInput.phoneNumber} (${toolInput.operator})`,
        details: toolInput,
        estimatedCost: toolInput.planAmount as number,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
      };
      pendingActions.set(action.id, action);
      return {
        content: JSON.stringify({ actionId: action.id, requiresConfirmation: true }),
        pendingAction: action,
      };
    }

    default:
      return { content: JSON.stringify({ error: 'Unknown tool' }) };
  }
}

// ─── Execute Confirmed Action ─────────────────────────────────────────────────

export async function executeConfirmedAction(actionId: string): Promise<{
  success: boolean;
  result?: unknown;
  message: string;
}> {
  const action = pendingActions.get(actionId);
  if (!action) {
    return { success: false, message: 'Action not found' };
  }

  action.status = 'executing';
  pendingActions.set(actionId, action);

  try {
    let result: unknown;
    const d = action.details;

    switch (action.type) {
      case 'food_order': {
        result = await registry.placeFoodOrder(
          d.restaurantId as string,
          d.items as Array<{ menuItemId: string; quantity: number }>,
          d.platform as 'swiggy' | 'zomato',
          'Home, New Delhi 110001',
          'UPI'
        );
        break;
      }
      case 'grocery_order': {
        result = await registry.placeGroceryOrder(
          d.items as Array<{ productId: string; quantity: number }>,
          d.platform as 'blinkit' | 'zepto',
          'Home, New Delhi 110001',
          'UPI'
        );
        break;
      }
      case 'flight_booking': {
        result = await registry.bookFlight(
          d.flightId as string,
          d.passengerName as string,
          'user@example.com',
          '+91 9999999999',
          'UPI'
        );
        break;
      }
      case 'bill_payment': {
        result = await registry.payBill(
          d.billerName as string,
          d.accountNumber as string,
          d.amount as number,
          'UPI'
        );
        break;
      }
      case 'recharge': {
        result = await registry.rechargePlan(
          d.operator as string,
          d.phoneNumber as string,
          d.planAmount as number,
          'UPI'
        );
        break;
      }
    }

    action.status = 'completed';
    action.completedAt = new Date().toISOString();
    action.result = result as Record<string, unknown>;
    pendingActions.set(actionId, action);

    return { success: true, result, message: 'Action completed successfully' };
  } catch (err) {
    action.status = 'failed';
    action.error = err instanceof Error ? err.message : 'Unknown error';
    pendingActions.set(actionId, action);
    return { success: false, message: 'Action failed: ' + action.error };
  }
}

// ─── Cancel Action ────────────────────────────────────────────────────────────

export function cancelAction(actionId: string): boolean {
  const action = pendingActions.get(actionId);
  if (!action || action.status !== 'pending_confirmation') return false;
  action.status = 'cancelled';
  pendingActions.set(actionId, action);
  return true;
}

// ─── Main Chat Handler ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are AgentHub, a powerful AI assistant that helps users get things done in the real world through voice commands.

You can help with:
- 🍔 Food ordering (Swiggy, Zomato) — search restaurants, browse menus, place orders
- 🛒 Grocery/Quick commerce (Blinkit, Zepto) — search products, place orders
- ✈️ Flight booking — search flights, book tickets
- 💳 Bill payments and mobile recharges

Your personality:
- Friendly, efficient, and proactive
- Always confirm the action summary before executing any order or booking
- Format currency as ₹ (Indian Rupees)
- Be concise — users are speaking to you, so keep responses short and natural
- When showing search results, summarize the top options clearly
- Ask for missing information (dates, quantities) naturally in conversation

IMPORTANT RULES:
1. Always use tools to search before placing any order
2. For ANY order/booking/payment, use the appropriate "place_*" or "book_*" tool which creates a pending action for user confirmation — NEVER execute without confirmation
3. After creating a pending action, tell the user what you're about to do and ask them to confirm
4. Be specific about costs — always mention ₹ amounts
5. If user says "yes", "confirm", "go ahead", "ok", "sure", "haan" — they are confirming the last pending action
6. Keep responses conversational and brief (2-4 sentences max)
7. Use emojis sparingly to enhance readability`;

export async function processMessage(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  let pendingActionResult: PendingAction | undefined;
  let finalText = '';

  // Agentic loop — keep going until Claude stops using tools
  let continueLoop = true;
  let currentMessages = messages;

  while (continueLoop) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages,
    });

    if (response.stop_reason === 'end_turn') {
      // Extract final text response
      for (const block of response.content) {
        if (block.type === 'text') {
          finalText += block.text;
        }
      }
      continueLoop = false;
    } else if (response.stop_reason === 'tool_use') {
      // Process tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let assistantContent = response.content;

      for (const block of response.content) {
        if (block.type === 'text') {
          finalText += block.text;
        } else if (block.type === 'tool_use') {
          const toolResult = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );

          if (toolResult.pendingAction) {
            pendingActionResult = toolResult.pendingAction;
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: toolResult.content,
          });
        }
      }

      // Add assistant message and tool results to continue the loop
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: toolResults },
      ];
    } else {
      continueLoop = false;
    }
  }

  return {
    message: finalText || "I'm here to help! What would you like to do?",
    pendingAction: pendingActionResult,
    actionId: pendingActionResult?.id,
  };
}
