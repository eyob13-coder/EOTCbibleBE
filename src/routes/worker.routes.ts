import { Router } from 'express';
import { sendAchievementEmailWorker } from '../controllers/worker.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/workers/send-achievement-email:
 *   post:
 *     summary: QStash worker - send achievement email
 *     tags: [Workers]
 *     description: Called by QStash. Verifies Upstash signature in production.
 *     responses:
 *       200:
 *         description: Email sent
 *       400:
 *         description: Invalid job payload
 *       401:
 *         description: Missing/invalid signature (production)
 */
router.post('/send-achievement-email', sendAchievementEmailWorker);

export default router;

