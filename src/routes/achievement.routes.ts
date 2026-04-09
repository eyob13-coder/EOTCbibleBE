import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { notifyAchievements, getUnlockedAchievements } from '../controllers/achievement.controller';

const router = Router();

router.get('/', protect, getUnlockedAchievements);

/**
 * @swagger
 * /api/v1/achievements/notify:
 *   post:
 *     summary: Notify user of newly unlocked achievements (deduped)
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - achievementIds
 *             properties:
 *               achievementIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["first_step","streak_7"]
 *     responses:
 *       200:
 *         description: Achievements enqueued for email notification
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/notify', protect, notifyAchievements);

export default router;

