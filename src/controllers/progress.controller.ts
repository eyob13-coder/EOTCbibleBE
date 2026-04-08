import { Request, Response } from 'express';
import { Progress, User } from '../models';
import cache from '../utils/cache';
import { publishMilestoneNotification } from '../utils/qstashService';

interface VerseReadEvent {
    bookId: string;
    chapter: number;
    verse: number;
    readDuration: number | undefined;
    timestamp: number | undefined;
}

const MAX_READINGS_PER_SYNC = Number(process.env.READING_SYNC_MAX_EVENTS ?? 500);
const MIN_VERSE_READ_MS = Number(process.env.READING_MIN_VERSE_MS ?? 2500);

// Log reading progress and update streak
export const logReading = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId, chapter, verses } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Validate required fields
        if (!bookId || chapter === undefined || chapter === null) {
            res.status(400).json({
                success: false,
                message: 'bookId and chapter are required'
            });
            return;
        }

        // Basic sanitation for Map keys (Mongo forbids '.' and '$' in field names, and we reserve ':' as delimiter)
        if (typeof bookId !== 'string' || bookId.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'bookId must be a non-empty string'
            });
            return;
        }
        const normalizedBookId = bookId.trim();
        if (normalizedBookId.length > 64 || /[.$:]/.test(normalizedBookId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid bookId'
            });
            return;
        }

        // Validate chapter is a positive number
        if (typeof chapter !== 'number' || chapter < 1) {
            res.status(400).json({
                success: false,
                message: 'chapter must be a positive number'
            });
            return;
        }

        // Find or create progress document
        let progress = await Progress.findOne({ userId });
        if (!progress) {
            progress = new Progress({ userId, chaptersRead: new Map() });
        }

        // Add chapter to chaptersRead with verse-level tracking
        const key = `${normalizedBookId}:${chapter}`;
        if (!progress.chaptersRead.has(key)) {
            progress.chaptersRead.set(key, []);
        }

        // If verses array is provided, add specific verses
        const existingVerses = progress.chaptersRead.get(key) || [];
        if (Array.isArray(verses)) {
            const sanitizedVerses = Array.from(
                new Set(
                    verses
                        .filter((v: unknown): v is number => Number.isInteger(v as number))
                        .map((v: number) => Math.trunc(v))
                        .filter((v: number) => v > 0)
                )
            );

            if (sanitizedVerses.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'verses must be an array of positive integers'
                });
                return;
            }

            // If chapter was previously marked as fully read (legacy marker 0), keep it as-is.
            if (!existingVerses.includes(0)) {
                for (const verse of sanitizedVerses) {
                    if (!existingVerses.includes(verse)) {
                        existingVerses.push(verse);
                    }
                }
                progress.chaptersRead.set(key, existingVerses);
            }
        } else if (verses === undefined || verses === null) {
            // Legacy behavior: mark entire chapter as read
            // Add a marker to indicate full chapter read
            if (!existingVerses.includes(0)) {
                existingVerses.push(0);
                progress.chaptersRead.set(key, existingVerses);
            }
        }

        // Find user document for streak updates
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Get today's date (start of day for comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get last reading date (start of day for comparison)
        const lastDate = user.streak.lastDate ? new Date(user.streak.lastDate) : null;
        const lastDateStart = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()) : null;

        // Calculate yesterday (start of day)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Update streak logic
        if (!lastDateStart) {
            // First time reading - start streak at 1
            user.streak.current = 1;
            user.streak.longest = Math.max(user.streak.longest, 1);
        } else if (lastDateStart.getTime() === today.getTime()) {
            // Already read today - don't change streak
            // This prevents multiple reads on same day from affecting streak
        } else if (lastDateStart.getTime() === yesterday.getTime()) {
            // Read yesterday - increment streak
            user.streak.current += 1;
            user.streak.longest = Math.max(user.streak.longest, user.streak.current);
        } else if (lastDateStart.getTime() < yesterday.getTime()) {
            // Read before yesterday - reset streak to 1
            user.streak.current = 1;
            user.streak.longest = Math.max(user.streak.longest, 1);
        }

        // Update lastDate to today
        user.streak.lastDate = today;

        // Check for streak milestone
        const milestoneDays = [7, 30, 50, 100, 365];
        if (lastDateStart && lastDateStart.getTime() === yesterday.getTime() && milestoneDays.includes(user.streak.current)) {
            // Give them a milestone!
            await publishMilestoneNotification(
                String(user._id),
                `${user.streak.current}-Day Reading Streak!`,
                `You have read your bible for ${user.streak.current} consecutive days! Amazing dedication!`
            );
        }

        // Save both documents
        await Promise.all([
            progress.save(),
            user.save()
        ]);

        // Invalidate all progress caches for this user
        await cache.deleteCacheByPattern(`progress:${userId}:*`);
        await cache.deleteCache(`progress:${userId}`);

        res.status(200).json({
            success: true,
            message: 'Reading progress logged successfully',
            data: {
                progress: {
                    userId: progress.userId,
                    chaptersRead: Object.fromEntries(progress.chaptersRead),
                    totalChaptersRead: progress.totalChaptersRead,
                    totalVersesRead: progress.totalVersesRead,
                    versesReadInChapter: verses ? existingVerses.length : undefined
                },
                streak: {
                    current: user.streak.current,
                    longest: user.streak.longest,
                    lastDate: user.streak.lastDate
                }
            }
        });

    } catch (error) {
        console.error('Error logging reading progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while logging reading progress'
        });
    }
};

// Batch sync verse-level reading progress from reading tracker
export const syncVerseProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { readings } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!Array.isArray(readings) || readings.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No readings to sync'
            });
            return;
        }

        if (readings.length > MAX_READINGS_PER_SYNC) {
            res.status(400).json({
                success: false,
                message: `Too many readings in one request (max ${MAX_READINGS_PER_SYNC})`
            });
            return;
        }

        // Validate + sanitize readings structure
        const sanitizedReadings: VerseReadEvent[] = [];
        for (const reading of readings as VerseReadEvent[]) {
            const bookId = typeof reading?.bookId === 'string' ? reading.bookId.trim() : '';
            const chapter = typeof reading?.chapter === 'number' ? Math.trunc(reading.chapter) : NaN;
            const verse = typeof reading?.verse === 'number' ? Math.trunc(reading.verse) : NaN;
            const readDuration = typeof reading?.readDuration === 'number' ? Math.trunc(reading.readDuration) : undefined;
            const timestamp = typeof reading?.timestamp === 'number' ? Math.trunc(reading.timestamp) : undefined;

            if (!bookId || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid reading format. Each reading must have bookId (string), chapter (>=1), and verse (>=1)'
                });
                return;
            }

            if (bookId.length > 64 || /[.$:]/.test(bookId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid bookId'
                });
                return;
            }

            // Enforce a minimum per-verse read duration when provided; ignore events below the threshold.
            if (readDuration !== undefined && readDuration < MIN_VERSE_READ_MS) {
                continue;
            }

            // Cap per-verse duration to reduce abuse / bad client clocks (e.g. 10 minutes).
            if (readDuration !== undefined && readDuration > 10 * 60 * 1000) {
                continue;
            }

            // Optional timestamp sanity (ignore obviously bad values, but don't reject the whole batch).
            const now = Date.now();
            if (timestamp !== undefined) {
                const tooFarInFuture = timestamp > now + 5 * 60 * 1000;
                const tooOld = timestamp < now - 365 * 24 * 60 * 60 * 1000;
                if (tooFarInFuture || tooOld) {
                    sanitizedReadings.push({ bookId, chapter, verse, readDuration, timestamp: now });
                    continue;
                }
            }

            sanitizedReadings.push({ bookId, chapter, verse, readDuration, timestamp });
        }

        if (sanitizedReadings.length === 0) {
            res.status(200).json({
                success: true,
                message: 'No valid readings to sync'
            });
            return;
        }

        // Find or create progress document
        let progress = await Progress.findOne({ userId });
        if (!progress) {
            progress = new Progress({ userId, chaptersRead: new Map() });
        }

        // Group readings by chapter
        const readingsByChapter = new Map<string, number[]>();
        for (const reading of sanitizedReadings) {
            const key = `${reading.bookId}:${reading.chapter}`;
            if (!readingsByChapter.has(key)) {
                readingsByChapter.set(key, []);
            }
            readingsByChapter.get(key)!.push(reading.verse);
        }

        // Add all verses to progress
        let newVersesCount = 0;
        for (const [key, verses] of readingsByChapter.entries()) {
            if (!progress.chaptersRead.has(key)) {
                progress.chaptersRead.set(key, []);
            }
            const existingVerses = progress.chaptersRead.get(key)!;
            // If chapter was previously marked as fully read (legacy marker 0), skip verse-level additions.
            if (existingVerses.includes(0)) {
                continue;
            }
            for (const verse of verses) {
                if (!existingVerses.includes(verse)) {
                    existingVerses.push(verse);
                    newVersesCount++;
                }
            }
            progress.chaptersRead.set(key, existingVerses);
        }

        // Update user streak if new verses were read
        let streakUpdated = false;
        let user: any = null;
        if (newVersesCount > 0) {
            user = await User.findById(userId);
            if (user) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const lastDate = user.streak.lastDate ? new Date(user.streak.lastDate) : null;
                const lastDateStart = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()) : null;
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (!lastDateStart) {
                    user.streak.current = 1;
                    user.streak.longest = Math.max(user.streak.longest, 1);
                    streakUpdated = true;
                } else if (lastDateStart.getTime() === today.getTime()) {
                    // Already read today
                    streakUpdated = false;
                } else if (lastDateStart.getTime() === yesterday.getTime()) {
                    user.streak.current += 1;
                    user.streak.longest = Math.max(user.streak.longest, user.streak.current);
                    streakUpdated = true;
                } else if (lastDateStart.getTime() < yesterday.getTime()) {
                    user.streak.current = 1;
                    user.streak.longest = Math.max(user.streak.longest, 1);
                    streakUpdated = true;
                }

                if (streakUpdated) {
                    user.streak.lastDate = today;

                    // Check for streak milestone
                    const milestoneDays = [7, 30, 50, 100, 365];
                    if (lastDateStart && lastDateStart.getTime() === yesterday.getTime() && milestoneDays.includes(user.streak.current)) {
                        await publishMilestoneNotification(
                            String(user._id),
                            `${user.streak.current}-Day Reading Streak!`,
                            `You have read your bible for ${user.streak.current} consecutive days! Amazing dedication!`
                        );
                    }
                }

                await user.save();
            }
        }

        await progress.save();

        // Invalidate caches
        await cache.deleteCacheByPattern(`progress:${userId}:*`);
        await cache.deleteCache(`progress:${userId}`);

        res.status(200).json({
            success: true,
            message: `Synced ${newVersesCount} new verses successfully`,
            data: {
                versesSynced: newVersesCount,
                totalChaptersRead: progress.totalChaptersRead,
                totalVersesRead: progress.totalVersesRead,
                streakUpdated,
                streak: streakUpdated && user ? {
                    current: user.streak.current,
                    longest: user.streak.longest,
                    lastDate: user.streak.lastDate
                } : undefined
            }
        });

    } catch (error) {
        console.error('Error syncing verse progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while syncing verse progress'
        });
    }
};

// Get user's reading progress
export const getProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Try cache first
        const cacheKey = `progress:${userId}`;
        const cachedProgress = await cache.getCache<any>(cacheKey);
        if (cachedProgress) {
            res.status(200).json({
                success: true,
                message: 'Progress retrieved successfully (from cache)',
                data: cachedProgress
            });
            return;
        }

        const progress = await Progress.findOne({ userId });
        const user = await User.findById(userId).select('streak');

        if (!progress) {
            const emptyData = {
                progress: {
                    userId,
                    chaptersRead: {},
                    totalChaptersRead: 0,
                    totalVersesRead: 0
                },
                streak: user?.streak || {
                    current: 0,
                    longest: 0,
                    lastDate: null
                }
            };

            // Cache empty result too
            await cache.setCache(cacheKey, emptyData, 900);

            res.status(200).json({
                success: true,
                message: 'No progress found',
                data: emptyData
            });
            return;
        }

        const progressData = {
            progress: {
                userId: progress.userId,
                chaptersRead: Object.fromEntries(progress.chaptersRead),
                totalChaptersRead: progress.totalChaptersRead,
                totalVersesRead: progress.totalVersesRead
            },
            streak: user?.streak || {
                current: 0,
                longest: 0,
                lastDate: null
            }
        };

        // Cache for 15 minutes
        await cache.setCache(cacheKey, progressData, 900);

        res.status(200).json({
            success: true,
            message: 'Progress retrieved successfully',
            data: progressData
        });

    } catch (error) {
        console.error('Error retrieving progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving progress'
        });
    }
};

// Get progress for a specific book
export const getBookProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!bookId || bookId.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'bookId is required'
            });
            return;
        }

        // Try cache first
        const cacheKey = `progress:${userId}:book:${bookId}`;
        const cachedBookProgress = await cache.getCache<any>(cacheKey);
        if (cachedBookProgress) {
            res.status(200).json({
                success: true,
                message: 'Book progress retrieved successfully (from cache)',
                data: cachedBookProgress
            });
            return;
        }

        const progress = await Progress.findOne({ userId });

        if (!progress) {
            const emptyData = {
                bookId,
                chaptersRead: {},
                totalChaptersRead: 0,
                totalVersesRead: 0
            };
            await cache.setCache(cacheKey, emptyData, 900);

            res.status(200).json({
                success: true,
                message: 'No progress found for this book',
                data: emptyData
            });
            return;
        }

        const bookChapters = progress.getChaptersForBook(bookId);
        const totalChaptersRead = Object.keys(bookChapters).length;
        const totalVersesRead = Object.values(bookChapters).reduce(
            (total, verses: number[]) => total + verses.filter((v) => v > 0).length,
            0
        );

        const bookProgressData = {
            bookId,
            chaptersRead: bookChapters,
            totalChaptersRead,
            totalVersesRead
        };

        // Cache for 15 minutes
        await cache.setCache(cacheKey, bookProgressData, 900);

        res.status(200).json({
            success: true,
            message: 'Book progress retrieved successfully',
            data: bookProgressData
        });

    } catch (error) {
        console.error('Error retrieving book progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving book progress'
        });
    }
};
