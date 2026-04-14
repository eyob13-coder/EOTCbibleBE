import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../utils/qstashService';
import { emailService } from '../utils/emailService';
import { generateAchievementEmailHTML } from '../utils/email-templates/achievement-email';
import type { AchievementTier } from '../constants/achievements';

interface AchievementEmailJobBody {
  userId: string;
  email: string;
  name: string;
  achievementId: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementEmoji: string;
  achievementTier: AchievementTier;
}

const isValidTier = (tier: unknown): tier is AchievementTier => {
  return tier === 'bronze' || tier === 'silver' || tier === 'gold' || tier === 'platinum';
};

export const sendAchievementEmailWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['upstash-signature'] as string | undefined;
    if (signature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = await verifyWebhookSignature(signature, rawBody);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid signature' });
        return;
      }
    } else if (process.env.NODE_ENV === 'production') {
      res.status(401).json({ success: false, message: 'Missing signature' });
      return;
    }

    const body = req.body as Partial<AchievementEmailJobBody>;

    if (
      !body?.email ||
      !body?.name ||
      !body?.achievementId ||
      !body?.achievementTitle ||
      !body?.achievementDescription ||
      !isValidTier(body?.achievementTier)
    ) {
      res.status(400).json({ success: false, message: 'Invalid job payload' });
      return;
    }

    const subject = `🎉 You unlocked: ${body.achievementTitle}!`;
    const html = generateAchievementEmailHTML({
      name: body.name,
      achievementTitle: body.achievementTitle,
      achievementDescription: body.achievementDescription,
      achievementEmoji: body.achievementEmoji || '',
      achievementTier: body.achievementTier,
      ctaUrl: 'https://nehemiah-osc.org/dashboard/achievements',
    });

    await emailService.sendEmail(body.email, subject, html);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending achievement email (worker):', error);
    res.status(500).json({ success: false, message: 'Internal server error while sending achievement email' });
  }
};

