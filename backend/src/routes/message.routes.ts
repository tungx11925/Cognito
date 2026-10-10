import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { messageController } from '../controllers/message.controller';
import {
  startConversationSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
} from '../schemas/message.schema';

const router = Router();

// 1. Global unread count badge
router.get('/unread-count', authenticate, (req, res, next) =>
  messageController.getUnreadCount(req, res, next)
);

// 3. Conversations List & Creation
router.get('/conversations', authenticate, (req, res, next) =>
  messageController.getConversations(req, res, next)
);

router.post(
  '/conversations',
  authenticate,
  rateLimiter(60000, 30),
  validate(startConversationSchema),
  (req, res, next) => messageController.startConversation(req, res, next)
);

// 4. Conversation Details
router.get('/conversations/:id', authenticate, (req, res, next) =>
  messageController.getConversationDetails(req, res, next)
);

// 5. Messages inside Conversation
router.get(
  '/conversations/:id/messages',
  authenticate,
  validate(getMessagesQuerySchema),
  (req, res, next) => messageController.getMessages(req, res, next)
);

router.post(
  '/conversations/:id/messages',
  authenticate,
  rateLimiter(60000, 60),
  validate(sendMessageSchema),
  (req, res, next) => messageController.sendMessage(req, res, next)
);

// 6. Mark Conversation As Read
router.post('/conversations/:id/read', authenticate, (req, res, next) =>
  messageController.markAsRead(req, res, next)
);

export default router;
