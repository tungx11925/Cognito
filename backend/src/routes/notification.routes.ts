import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// Capability ticket for SSE stream (clean URL, zero JWT in query)
router.post('/stream-ticket', authenticate, (req, res, next) =>
  notificationController.createStreamTicket(req, res, next)
);

// Unified Real-time SSE Stream (supports capability ticket, httpOnly cookie)
router.get('/stream', (req, res) =>
  notificationController.streamNotifications(req, res)
);

// Notifications collection endpoints
router.get('/', authenticate, (req, res, next) =>
  notificationController.getNotifications(req, res, next)
);

router.get('/unread-count', authenticate, (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

router.patch('/read-all', authenticate, (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

router.patch('/:id/read', authenticate, (req, res, next) =>
  notificationController.markAsRead(req, res, next)
);

router.delete('/:id', authenticate, (req, res, next) =>
  notificationController.deleteNotification(req, res, next)
);

export default router;
