import { Router, Request, Response } from 'express';
import {
  processMessage,
  executeConfirmedAction,
  cancelAction,
  getPendingAction,
  getAllActions,
} from '../services/claudeAgent';
import { ChatRequest, ConfirmActionRequest } from '../types';

const router = Router();

// ─── POST /api/chat ───────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processMessage(message, (conversationHistory as Array<{ role: 'user' | 'assistant'; content: string }>));
    return res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

// ─── POST /api/chat/confirm ───────────────────────────────────────────────────

router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { actionId }: ConfirmActionRequest = req.body;

    if (!actionId) {
      return res.status(400).json({ error: 'actionId is required' });
    }

    const result = await executeConfirmedAction(actionId);
    return res.json(result);
  } catch (err) {
    console.error('Confirm error:', err);
    return res.status(500).json({ error: 'Failed to execute action' });
  }
});

// ─── POST /api/chat/cancel ────────────────────────────────────────────────────

router.post('/cancel', (req: Request, res: Response) => {
  const { actionId } = req.body;

  if (!actionId) {
    return res.status(400).json({ error: 'actionId is required' });
  }

  const success = cancelAction(actionId);
  return res.json({ success, message: success ? 'Action cancelled' : 'Could not cancel action' });
});

// ─── GET /api/chat/actions ────────────────────────────────────────────────────

router.get('/actions', (_req: Request, res: Response) => {
  const actions = getAllActions();
  return res.json({ actions });
});

// ─── GET /api/chat/actions/:id ────────────────────────────────────────────────

router.get('/actions/:id', (req: Request, res: Response) => {
  const action = getPendingAction(req.params.id);
  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }
  return res.json({ action });
});

export default router;
