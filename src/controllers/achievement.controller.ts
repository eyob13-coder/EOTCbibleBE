import { Request, Response } from 'express';
import { UserAchievement } from '../models';
import { getAchievementMetadata } from '../constants/achievements';
import { publishAchievementEmailJob } from '../utils/qstashService';

const normalizeAchievementIds = (achievementIds: unknown): string[] | null => {
  if (!Array.isArray(achievementIds)) return null;

  const cleaned = achievementIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (cleaned.length === 0) return null;

  return Array.from(new Set(cleaned));
};

export const notifyAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const achievementIds = normalizeAchievementIds(req.body?.achievementIds);
    if (!achievementIds) {
      res.status(400).json({ success: false, message: 'achievementIds must be a non-empty array of strings' });
      return;
    }

    // Ensure backend metadata matches incoming IDs (fail fast on mismatch).
    const unknownIds = achievementIds.filter((id) => !getAchievementMetadata(id));
    if (unknownIds.length > 0) {
      res.status(400).json({
        success: false,
        message: `Unknown achievementIds: ${unknownIds.join(', ')}`,
      });
      return;
    }

    const alreadyNotified = await UserAchievement.find({
      userId: user._id,
      achievementId: { $in: achievementIds },
    }).select('achievementId');

    const alreadySet = new Set(alreadyNotified.map((r) => r.achievementId));
    const toProcess = achievementIds.filter((id) => !alreadySet.has(id));

    if (toProcess.length === 0) {
      res.status(200).json({ success: true, notified: [] });
      return;
    }

    const notified: string[] = [];

    for (const achievementId of toProcess) {
      // Acquire the unique "send lock" via insert. This prevents duplicates across concurrent requests.
      try {
        await UserAchievement.create({ userId: user._id, achievementId });
      } catch (err: any) {
        // Duplicate key => already processed by another request; skip.
        if (err?.code === 11000) continue;
        throw err;
      }

      const metadata = getAchievementMetadata(achievementId)!;
      const payload = {
        userId: String(user._id),
        email: user.email,
        name: user.name,
        achievementId,
        achievementTitle: metadata.title,
        achievementDescription: metadata.description,
        achievementEmoji: metadata.emoji,
        achievementTier: metadata.tier,
      };

      try {
        await publishAchievementEmailJob(payload);
        await UserAchievement.updateOne(
          { userId: user._id, achievementId },
          { $set: { notifiedAt: new Date() } },
        );
        notified.push(achievementId);
      } catch (publishError) {
        // Allow retry: remove the lock row if enqueue failed.
        await UserAchievement.deleteOne({ userId: user._id, achievementId });
        throw publishError;
      }
    }

    res.status(200).json({ success: true, notified });
  } catch (error) {
    console.error('Error notifying achievements:', error);
    res.status(500).json({ success: false, message: 'Internal server error while notifying achievements' });
  }
};

export const getUnlockedAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user?._id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const unlocked = await UserAchievement.find({ userId: user._id }).select('achievementId');
    const unlockedIds = unlocked.map((u) => u.achievementId);

    res.status(200).json({ success: true, unlockedIds });
  } catch (error) {
    console.error('Error fetching unlocked achievements:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching unlocked achievements' });
  }
};

