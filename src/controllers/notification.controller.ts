import { Request, Response } from 'express';
import { User, ReadingPlan, IUser } from '../models';
import { Subscriber } from '../models/subscriber.model';
import { emailService } from '../utils/emailService';
import { verifyWebhookSignature, publishNotification } from '../utils/qstashService';
import {
    generatePremiumReadingReminderHTML,
    generatePremiumReadingReminderText,
    generatePremiumSubscriptionConfirmHTML,
    generatePremiumStreakSaverHTML,
    generatePremiumWeeklySummaryHTML,
    generatePremiumMilestoneHTML,
    generatePremiumVotdHTML,
    generatePremiumWelcomeHTML,
    generatePremiumDay3HTML,
    generatePremiumDay7HTML,
} from '../utils/email-templates/premium-templates';

// ─────────────────────────────────────────────────
// Guest Email Subscription (Newsletter)
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/notifications/subscribe
 * Subscribe a guest email to the newsletter
 */
export const subscribe = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ success: false, message: 'Please enter a valid email address' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if already subscribed
        const existing = await Subscriber.findOne({ email: normalizedEmail });
        if (existing) {
            if (existing.isActive) {
                res.status(409).json({ success: false, message: 'This email is already subscribed' });
                return;
            }
            // Re-activate if previously unsubscribed
            existing.isActive = true;
            existing.unsubscribedAt = null;
            await existing.save();

            res.status(200).json({
                success: true,
                message: 'Welcome back! Your subscription has been re-activated.',
            });
            return;
        }

        // Create new subscriber
        const subscriber = new Subscriber({
            email: normalizedEmail,
            source: 'website',
        });
        await subscriber.save();

        // Send confirmation email
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}`;

            await emailService.sendEmail(
                normalizedEmail,
                '✅ Subscription Confirmed - EOTC Bible',
                generatePremiumSubscriptionConfirmHTML(normalizedEmail, unsubscribeUrl),
            );
            console.log(`✅ Sent subscription confirmation to ${normalizedEmail}`);
        } catch (emailError) {
            console.warn('⚠️ Failed to send subscription confirmation email:', emailError);
            // Don't fail the subscription if confirmation email fails
        }

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to EOTCBible updates!',
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * POST /api/v1/notifications/unsubscribe
 * Unsubscribe a guest email
 */
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const subscriber = await Subscriber.findOne({ email: normalizedEmail });

        if (!subscriber) {
            res.status(404).json({ success: false, message: 'Email not found in subscribers' });
            return;
        }

        if (!subscriber.isActive) {
            res.status(200).json({ success: true, message: 'Already unsubscribed' });
            return;
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed. You will no longer receive emails.',
        });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────
// Authenticated User Notification Toggle
// ─────────────────────────────────────────────────

/**
 * PUT /api/v1/notifications/toggle
 * Toggle notification preference for authenticated user
 */
export const toggleNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            res.status(400).json({
                success: false,
                message: 'The "enabled" field must be a boolean (true or false)',
            });
            return;
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { 'settings.notificationsEnabled': enabled },
            { new: true, select: '-password' },
        );

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
            data: {
                notificationsEnabled: updatedUser.settings.notificationsEnabled,
            },
        });
    } catch (error) {
        console.error('Toggle notification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/v1/notifications/status
 * Get current user's notification preference
 */
export const getNotificationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                notificationsEnabled: user.settings?.notificationsEnabled ?? true,
            },
        });
    } catch (error) {
        console.error('Get notification status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────
// QStash Webhook: Reading Plan Reminders
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/notifications/webhook/reading-reminder
 * Called by QStash daily — finds users with incomplete today's reading and sends reminder emails
 */
export const webhookReadingReminder = async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify QStash signature
        const signature = req.headers['upstash-signature'] as string;
        if (signature) {
            const rawBody = JSON.stringify(req.body);
            const isValid = await verifyWebhookSignature(signature, rawBody);
            if (!isValid) {
                console.warn('⚠️ Invalid QStash webhook signature');
                res.status(401).json({ success: false, message: 'Invalid signature' });
                return;
            }
        } else if (process.env.NODE_ENV === 'production') {
            // In production, always require signature
            res.status(401).json({ success: false, message: 'Missing signature' });
            return;
        }

        console.log('📬 Processing reading plan reminders...');

        // Find all active reading plans
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activePlans = await ReadingPlan.find({ status: 'active' }).populate('userId');

        let emailsSent = 0;
        let skipped = 0;

        for (const plan of activePlans) {
            const user = plan.userId as unknown as IUser;
            if (!user || !user.email) {
                skipped++;
                continue;
            }

            // Check if user has notifications enabled
            if (user.settings?.notificationsEnabled === false) {
                skipped++;
                continue;
            }

            // Find today's reading that is NOT yet completed
            const todayReading = plan.dailyReadings.find((d) => {
                const readingDate = new Date(d.date);
                readingDate.setHours(0, 0, 0, 0);
                return readingDate.getTime() === today.getTime() && !d.isCompleted;
            });

            if (!todayReading) {
                // No pending reading for today
                continue;
            }

            // Format today's readings into a readable string
            const readingsList = todayReading.readings
                .map((r) => `${r.book} ${r.startChapter}${r.endChapter !== r.startChapter ? `-${r.endChapter}` : ''}`)
                .join(', ');

            const completedDays = plan.dailyReadings.filter((d) => d.isCompleted).length;
            const totalDays = plan.durationInDays;

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const unsubscribeUrl = `${frontendUrl}/settings`;

            // Send reminder email
            try {
                await emailService.sendEmail(
                    user.email,
                    `📖 Reading Reminder: ${plan.name}`,
                    generatePremiumReadingReminderHTML(
                        user.name,
                        plan.name,
                        readingsList,
                        completedDays,
                        totalDays,
                        unsubscribeUrl,
                    ),
                    generatePremiumReadingReminderText(
                        user.name,
                        plan.name,
                        readingsList,
                        completedDays,
                        totalDays,
                    ),
                );
                emailsSent++;
            } catch (emailError) {
                console.error(`❌ Failed to send reminder to ${user.email}:`, emailError);
            }
        }

        console.log(`✅ Reading reminders processed: ${emailsSent} emails sent, ${skipped} skipped`);

        res.status(200).json({
            success: true,
            message: 'Reading reminders processed',
            data: { emailsSent, skipped },
        });
    } catch (error) {
        console.error('❌ Webhook reading reminder error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────
// Manual Trigger (Admin)
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/notifications/send
 * Manually trigger a notification via QStash (for admin use)
 */
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { type, subject } = req.body;

        if (!type || !subject) {
            res.status(400).json({
                success: false,
                message: 'type and subject are required',
            });
            return;
        }

        const result = await publishNotification({
            type: type as 'reading-reminder' | 'newsletter',
            subject,
        });

        res.status(200).json({
            success: true,
            message: 'Notification queued via QStash',
            data: { messageId: result.messageId },
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─────────────────────────────────────────────────
// Extended Notice Webhooks
// ─────────────────────────────────────────────────

/**
 * POST /api/v1/notifications/webhook/streak-saver
 */
export const webhookStreakSaver = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📬 Processing streak savers...');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Find users with active streak (>0) but who haven't read today
        const usersToRemind = await User.find({
            'streak.current': { $gt: 0 },
            'streak.lastDate': { $lt: todayStart },
            'settings.notificationsEnabled': true
        });

        let sent = 0;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        for (const user of usersToRemind) {
            try {
                await emailService.sendEmail(
                    user.email,
                    '🔥 Save your reading streak!',
                    generatePremiumStreakSaverHTML(user.name, user.streak.current, `${frontendUrl}/settings`)
                );
                sent++;
            } catch (error) {
                console.error(`Failed to send streak saver to ${user.email}:`, error);
            }
        }
        res.status(200).json({ success: true, message: 'Streak savers processed', sent });
    } catch (error) {
        console.error('Streak saver webhook error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * POST /api/v1/notifications/webhook/weekly-summary
 */
export const webhookWeeklySummary = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📬 Processing weekly summaries...');
        const users = await User.find({ 'settings.notificationsEnabled': true }).limit(100);
        let sent = 0;

        for (const user of users) {
            try {
                // Mock stats - in production, calculate from Progress model
                const chaptersRead = user.streak.current * 2;
                const notesCount = Math.floor(Math.random() * 10);
                const streakDays = user.streak.current;
                const weeklyGoal = 7;

                await emailService.sendEmail(
                    user.email,
                    '📊 Your Weekly Bible Progress',
                    generatePremiumWeeklySummaryHTML(user.name, chaptersRead, notesCount, streakDays, weeklyGoal)
                );
                sent++;
            } catch(e) {
                console.error('Failed to send weekly summary:', e);
            }
        }
        res.status(200).json({ success: true, message: 'Weekly summaries sent', sent });
    } catch (e) {
        console.error('Weekly summary error:', e);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * POST /api/v1/notifications/webhook/verse-of-the-day
 */
export const webhookVotd = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📬 Processing Verse of the Day...');
        const subscribers = await Subscriber.find({ isActive: true });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        let sent = 0;
        
        const verseText = "For God so loved the world, that he gave his only begotten Son...";
        const verseRef = "John 3:16";

        for (const sub of subscribers) {
             try {
                await emailService.sendEmail(
                    sub.email,
                    '📖 Verse of the Day',
                    generatePremiumVotdHTML(verseText, verseRef, `${frontendUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`)
                );
                sent++;
             } catch(error) {
                 console.error(`Failed to send VOTD to ${sub.email}:`, error);
             }
        }
        res.status(200).json({ success: true, message: 'VOTD sent', sent });
    } catch (error) {
        console.error('VOTD webhook error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * POST /api/v1/notifications/webhook/milestone
 */
export const webhookMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📬 Processing milestone...');
        const { userId, title, message } = req.body;
        const user = await User.findById(userId);
        if (user && user.settings?.notificationsEnabled) {
             await emailService.sendEmail(
                 user.email,
                 '🏆 Achievement Unlocked!',
                 generatePremiumMilestoneHTML(user.name, title, message)
             );
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Milestone webhook error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * POST /api/v1/notifications/webhook/onboarding
 * Handles the 3-part drip campaign (day 0, 3, 7)
 */
export const webhookOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, day } = req.body;
        console.log(`📬 Processing onboarding Day ${day} for user ${userId}...`);
        
        const user = await User.findById(userId);
        // Only send if user still exists and hasn't toggled off basic notifications
        if (user && user.settings?.notificationsEnabled) {
             let subject = '';
             let html = '';
             
             if (day === 0) {
                 subject = 'Welcome to EOTC Bible! 📖';
                 html = generatePremiumWelcomeHTML(user.name);
             } else if (day === 3) {
                 subject = 'Did you know about this feature? 💡';
                 html = generatePremiumDay3HTML(user.name);
             } else if (day === 7) {
                 subject = 'Checking in on your journey 🌱';
                 html = generatePremiumDay7HTML(user.name);
             }

             if (subject && html) {
                 await emailService.sendEmail(user.email, subject, html);
             }
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Onboarding webhook error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
};
