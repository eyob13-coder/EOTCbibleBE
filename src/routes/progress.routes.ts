import { Router } from 'express';
import {
    logReading,
    getProgress,
    getBookProgress,
    syncVerseProgress
} from '../controllers/progress.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All progress routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/progress/log-reading:
 *   post:
 *     summary: Log reading progress and update streak
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - chapter
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: Book identifier
 *                 example: "Genesis"
 *               chapter:
 *                 type: number
 *                 minimum: 1
 *                 description: Chapter number (must be positive)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Reading progress logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reading progress logged successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       $ref: '#/components/schemas/Progress'
 *                     streak:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                           description: Current reading streak
 *                           example: 5
 *                         longest:
 *                           type: number
 *                           description: Longest reading streak
 *                           example: 10
 *                         lastDate:
 *                           type: string
 *                           format: date
 *                           description: Last reading date
 *                           example: "2024-01-15"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/log-reading', logReading);

/**
 * @swagger
 * /api/v1/progress/sync-verses:
 *   post:
 *     summary: Batch sync verse-level reading progress from reading tracker
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - readings
 *             properties:
 *               readings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bookId
 *                     - chapter
 *                     - verse
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       description: Book identifier
 *                       example: "Genesis"
 *                     chapter:
 *                       type: number
 *                       description: Chapter number
 *                       example: 1
 *                     verse:
 *                       type: number
 *                       description: Verse number
 *                       example: 1
 *                     readDuration:
 *                       type: number
 *                       description: Time spent reading in milliseconds
 *                       example: 5000
 *                     timestamp:
 *                       type: number
 *                       description: Unix timestamp when verse was read
 *                       example: 1704067200000
 *     responses:
 *       200:
 *         description: Verses synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Synced 5 new verses successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     versesSynced:
 *                       type: number
 *                       description: Number of new verses synced
 *                       example: 5
 *                     totalVersesRead:
 *                       type: number
 *                       description: Total verses read across all books
 *                       example: 150
 *                     streakUpdated:
 *                       type: boolean
 *                       description: Whether the streak was updated
 *                       example: true
 *       400:
 *         description: Bad request - invalid readings format
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/sync-verses', syncVerseProgress);

/**
 * @swagger
 * /api/v1/progress:
 *   get:
 *     summary: Get user's overall reading progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progress retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       $ref: '#/components/schemas/Progress'
 *                     streak:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                           description: Current reading streak
 *                           example: 5
 *                         longest:
 *                           type: number
 *                           description: Longest reading streak
 *                           example: 10
 *                         lastDate:
 *                           type: string
 *                           format: date
 *                           description: Last reading date
 *                           example: "2024-01-15"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getProgress);

/**
 * @swagger
 * /api/v1/progress/{bookId}:
 *   get:
 *     summary: Get progress for a specific book
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book identifier
 *         example: "Genesis"
 *     responses:
 *       200:
 *         description: Book progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book progress retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       description: Book identifier
 *                       example: "Genesis"
 *                     chaptersRead:
 *                       type: object
 *                       description: Map of chapter numbers to verses read
 *                       example: {"1": [1, 2, 3], "2": [1, 2]}
 *                     totalChaptersRead:
 *                       type: number
 *                       description: Total number of chapters read
 *                       example: 2
 *       400:
 *         description: Bad request - invalid bookId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:bookId', getBookProgress);

export default router;
