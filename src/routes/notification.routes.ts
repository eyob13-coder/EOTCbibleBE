import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    subscribe,
    unsubscribe,
    toggleNotification,
    getNotificationStatus,
    webhookReadingReminder,
    webhookStreakSaver,
    webhookWeeklySummary,
    webhookVotd,
    webhookMilestone,
    webhookOnboarding,
    sendNotification,
} from '../controllers/notification.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications/subscribe:
 *   post:
 *     summary: Subscribe to newsletter (guest)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Subscribed successfully
 *       409:
 *         description: Already subscribed
 */
router.post('/subscribe', subscribe);

/**
 * @swagger
 * /api/v1/notifications/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */
router.post('/unsubscribe', unsubscribe);

/**
 * @swagger
 * /api/v1/notifications/toggle:
 *   put:
 *     summary: Toggle notification preference (authenticated user)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preference updated
 */
router.put('/toggle', authenticateToken, toggleNotification);

/**
 * @swagger
 * /api/v1/notifications/status:
 *   get:
 *     summary: Get notification preference (authenticated user)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification status
 */
router.get('/status', authenticateToken, getNotificationStatus);

/**
 * @swagger
 * /api/v1/notifications/webhook/reading-reminder:
 *   post:
 *     summary: QStash webhook - process reading plan reminders
 *     tags: [Notifications]
 *     description: Called by QStash daily cron. Verifies signature in production.
 *     responses:
 *       200:
 *         description: Reminders processed
 */
router.post('/webhook/reading-reminder', webhookReadingReminder);

/**
 * @swagger
 * /api/v1/notifications/webhook/streak-saver:
 *   post:
 *     summary: QStash webhook - process streak savers
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Reminders processed
 */
router.post('/webhook/streak-saver', webhookStreakSaver);

/**
 * @swagger
 * /api/v1/notifications/webhook/weekly-summary:
 *   post:
 *     summary: QStash webhook - process weekly summaries
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Summaries processed
 */
router.post('/webhook/weekly-summary', webhookWeeklySummary);

/**
 * @swagger
 * /api/v1/notifications/webhook/verse-of-the-day:
 *   post:
 *     summary: QStash webhook - process verse of the day
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: VOTD processed
 */
router.post('/webhook/verse-of-the-day', webhookVotd);

/**
 * @swagger
 * /api/v1/notifications/webhook/milestone:
 *   post:
 *     summary: QStash webhook - process milestone notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Milestone sent
 */
router.post('/webhook/milestone', webhookMilestone);

/**
 * @swagger
 * /api/v1/notifications/webhook/onboarding:
 *   post:
 *     summary: QStash webhook - process onboarding drip campaign
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Onboarding processed
 */
router.post('/webhook/onboarding', webhookOnboarding);

/**
 * @swagger
 * /api/v1/notifications/send:
 *   post:
 *     summary: Manually trigger notification via QStash
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, subject]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [reading-reminder, newsletter]
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification queued
 */
router.post('/send', authenticateToken, sendNotification);

export default router;
