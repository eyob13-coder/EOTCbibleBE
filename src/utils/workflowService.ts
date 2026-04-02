import { User, ReadingPlan, IUser } from '../models';
import { Subscriber } from '../models/subscriber.model';
import { emailService } from './emailService';
import {
  generatePremiumReadingReminderHTML,
  generatePremiumStreakSaverHTML,
  generatePremiumMilestoneHTML,
  generatePremiumWeeklySummaryHTML,
  generatePremiumVotdHTML,
  generatePremiumWelcomeHTML,
  generatePremiumDay3HTML,
  generatePremiumDay7HTML,
  generatePremiumSubscriptionConfirmHTML,
} from './email-templates/premium-templates';
import { Client } from '@upstash/qstash';

export interface WorkflowConfig {
  batchSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitPerSecond: number;
}

const defaultConfig: WorkflowConfig = {
  batchSize: 50,
  retryAttempts: 3,
  retryDelayMs: 1000,
  rateLimitPerSecond: 10,
};

export interface WorkflowResult {
  success: boolean;
  emailsSent: number;
  emailsFailed: number;
  skipped: number;
  errors: WorkflowError[];
  duration: number;
}

export interface WorkflowError {
  email: string;
  error: string;
  timestamp: Date;
}

export interface WorkflowStats {
  totalUsers: number;
  enabledUsers: number;
  emailsSent: number;
  emailsFailed: number;
  averageSendTime: number;
}

type RateLimiter = {
  acquire: () => Promise<void>;
};

const createRateLimiter = (rateLimitPerSecond: number): RateLimiter => {
  let tokens = rateLimitPerSecond;
  let lastRefill = Date.now();

  const acquire = async (): Promise<void> => {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000;
    tokens = Math.min(rateLimitPerSecond, tokens + elapsed * rateLimitPerSecond);
    lastRefill = now;

    if (tokens < 1) {
      const waitTime = (1 - tokens) / rateLimitPerSecond * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return acquire();
    }

    tokens--;
  };

  return { acquire };
};

const rateLimiter = createRateLimiter(defaultConfig.rateLimitPerSecond);
let qstashClient: Client | null = null;

const getQstashClient = (): Client | null => {
  if (!qstashClient) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) return null;
    qstashClient = new Client({ token });
  }
  return qstashClient;
};

export const sendReadingReminders = async (): Promise<WorkflowResult> => {
  console.log('📖 Starting reading reminder workflow...');
  const startTime = Date.now();
  const result: WorkflowResult = {
    success: true,
    emailsSent: 0,
    emailsFailed: 0,
    skipped: 0,
    errors: [],
    duration: 0,
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activePlans = await ReadingPlan.find({ status: 'active' }).populate('userId');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const plan of activePlans) {
      const user = plan.userId as unknown as IUser;
      if (!user || !user.email) {
        result.skipped++;
        continue;
      }

      if (user.settings?.notificationsEnabled === false) {
        result.skipped++;
        continue;
      }

      const todayReading = plan.dailyReadings.find((d) => {
        const readingDate = new Date(d.date);
        readingDate.setHours(0, 0, 0, 0);
        return readingDate.getTime() === today.getTime() && !d.isCompleted;
      });

      if (!todayReading) {
        continue;
      }

      const readingsList = todayReading.readings
        .map((r) => `${r.book} ${r.startChapter}${r.endChapter !== r.startChapter ? `-${r.endChapter}` : ''}`)
        .join(', ');

      const completedDays = plan.dailyReadings.filter((d) => d.isCompleted).length;
      const unsubscribeUrl = `${frontendUrl}/settings`;

      await rateLimiter.acquire();

      try {
        await emailService.sendEmail(
          user.email,
          `📖 Reading Reminder: ${plan.name}`,
          generatePremiumReadingReminderHTML(user.name, plan.name, readingsList, completedDays, plan.durationInDays, unsubscribeUrl)
        );
        result.emailsSent++;
        console.log(`✅ Sent reading reminder to ${user.email}`);
      } catch (emailError) {
        result.emailsFailed++;
        result.errors.push({
          email: user.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          timestamp: new Date(),
        });
        console.error(`❌ Failed to send to ${user.email}:`, emailError);
      }
    }

    result.success = result.emailsFailed === 0;
  } catch (error) {
    result.success = false;
    console.error('❌ Reading reminder workflow error:', error);
  }

  result.duration = Date.now() - startTime;
  console.log(`✅ Reading reminder workflow completed: ${result.emailsSent} sent, ${result.emailsFailed} failed in ${result.duration}ms`);

  return result;
};

export const sendStreakSavers = async (): Promise<WorkflowResult> => {
  console.log('🔥 Starting streak saver workflow...');
  const startTime = Date.now();
  const result: WorkflowResult = {
    success: true,
    emailsSent: 0,
    emailsFailed: 0,
    skipped: 0,
    errors: [],
    duration: 0,
  };

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const usersToRemind = await User.find({
      'streak.current': { $gt: 0 },
      'streak.lastDate': { $lt: todayStart },
      'settings.notificationsEnabled': true,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const user of usersToRemind) {
      await rateLimiter.acquire();

      try {
        await emailService.sendEmail(
          user.email,
          '🔥 Save Your Reading Streak!',
          generatePremiumStreakSaverHTML(user.name, user.streak.current, `${frontendUrl}/settings`)
        );
        result.emailsSent++;
        console.log(`✅ Sent streak saver to ${user.email}`);
      } catch (emailError) {
        result.emailsFailed++;
        result.errors.push({
          email: user.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    result.success = result.emailsFailed === 0;
  } catch (error) {
    result.success = false;
    console.error('❌ Streak saver workflow error:', error);
  }

  result.duration = Date.now() - startTime;
  console.log(`✅ Streak saver workflow completed: ${result.emailsSent} sent in ${result.duration}ms`);

  return result;
};

export const sendWeeklySummaries = async (): Promise<WorkflowResult> => {
  console.log('📊 Starting weekly summary workflow...');
  const startTime = Date.now();
  const result: WorkflowResult = {
    success: true,
    emailsSent: 0,
    emailsFailed: 0,
    skipped: 0,
    errors: [],
    duration: 0,
  };

  try {
    const users = await User.find({ 'settings.notificationsEnabled': true }).limit(100);

    for (const user of users) {
      await rateLimiter.acquire();

      const chaptersRead = user.streak.current * 2;
      const notesCount = Math.floor(Math.random() * 10);
      const weeklyGoal = 7;

      try {
        await emailService.sendEmail(
          user.email,
          '📊 Your Weekly Bible Progress',
          generatePremiumWeeklySummaryHTML(user.name, chaptersRead, notesCount, user.streak.current, weeklyGoal)
        );
        result.emailsSent++;
      } catch (emailError) {
        result.emailsFailed++;
        result.errors.push({
          email: user.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    result.success = result.emailsFailed === 0;
  } catch (error) {
    result.success = false;
    console.error('❌ Weekly summary workflow error:', error);
  }

  result.duration = Date.now() - startTime;
  console.log(`✅ Weekly summary workflow completed: ${result.emailsSent} sent in ${result.duration}ms`);

  return result;
};

export const sendVerseOfTheDay = async (verseText: string, verseRef: string): Promise<WorkflowResult> => {
  console.log('📖 Starting verse of the day workflow...');
  const startTime = Date.now();
  const result: WorkflowResult = {
    success: true,
    emailsSent: 0,
    emailsFailed: 0,
    skipped: 0,
    errors: [],
    duration: 0,
  };

  try {
    const subscribers = await Subscriber.find({ isActive: true });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const sub of subscribers) {
      await rateLimiter.acquire();

      try {
        await emailService.sendEmail(
          sub.email,
          '📖 Verse of the Day',
          generatePremiumVotdHTML(verseText, verseRef, `${frontendUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`)
        );
        result.emailsSent++;
      } catch (emailError) {
        result.emailsFailed++;
        result.errors.push({
          email: sub.email,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    result.success = result.emailsFailed === 0;
  } catch (error) {
    result.success = false;
    console.error('❌ Verse of the day workflow error:', error);
  }

  result.duration = Date.now() - startTime;
  console.log(`✅ Verse of the day workflow completed: ${result.emailsSent} sent in ${result.duration}ms`);

  return result;
};

export const sendOnboardingEmail = async (userId: string, day: 0 | 3 | 7): Promise<boolean> => {
  console.log(`📧 Sending onboarding day ${day} email to user ${userId}...`);

  try {
    const user = await User.findById(userId);
    if (!user || !user.email || user.settings?.notificationsEnabled === false) {
      console.log('⊘ User not found or notifications disabled');
      return false;
    }

    let subject = '';
    let html = '';

    switch (day) {
      case 0:
        subject = '🎉 Welcome to EOTC Bible!';
        html = generatePremiumWelcomeHTML(user.name);
        break;
      case 3:
        subject = '💡 Discover This Feature!';
        html = generatePremiumDay3HTML(user.name);
        break;
      case 7:
        subject = '🌱 One Week With You!';
        html = generatePremiumDay7HTML(user.name);
        break;
    }

    if (!html) return false;

    await emailService.sendEmail(user.email, subject, html);
    console.log(`✅ Sent onboarding day ${day} email to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Onboarding email error:', error);
    return false;
  }
};

export const sendMilestoneNotification = async (userId: string, title: string, message: string): Promise<boolean> => {
  console.log(`🏆 Sending milestone notification to user ${userId}...`);

  try {
    const user = await User.findById(userId);
    if (!user || !user.email || user.settings?.notificationsEnabled === false) {
      return false;
    }

    await emailService.sendEmail(
      user.email,
      '🏆 Achievement Unlocked!',
      generatePremiumMilestoneHTML(user.name, title, message)
    );

    console.log(`✅ Sent milestone notification to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Milestone notification error:', error);
    return false;
  }
};

export const sendSubscriptionConfirmation = async (email: string): Promise<boolean> => {
  console.log(`📬 Sending subscription confirmation to ${email}...`);

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

    await emailService.sendEmail(
      email,
      '✅ Subscription Confirmed',
      generatePremiumSubscriptionConfirmHTML(email, unsubscribeUrl)
    );

    console.log(`✅ Sent subscription confirmation to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Subscription confirmation error:', error);
    return false;
  }
};

export const getWorkflowStats = async (): Promise<WorkflowStats> => {
  const totalUsers = await User.countDocuments();
  const enabledUsers = await User.countDocuments({ 'settings.notificationsEnabled': true });

  return {
    totalUsers,
    enabledUsers,
    emailsSent: 0,
    emailsFailed: 0,
    averageSendTime: 0,
  };
};

export const triggerQstashWorkflow = async (endpoint: string, payload: Record<string, unknown>): Promise<{ success: boolean; messageId?: string }> => {
  const client = getQstashClient();
  if (!client) {
    console.error('❌ QStash client not initialized');
    return { success: false };
  }

  const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ QSTASH_WEBHOOK_URL not configured');
    return { success: false };
  }

  try {
    const result = await client.publishJSON({
      url: `${webhookUrl}${endpoint}`,
      body: payload,
    });

    console.log(`✅ QStash workflow triggered: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ QStash workflow trigger error:', error);
    return { success: false };
  }
};

export const workflowService = {
  sendReadingReminders,
  sendStreakSavers,
  sendWeeklySummaries,
  sendVerseOfTheDay,
  sendOnboardingEmail,
  sendMilestoneNotification,
  sendSubscriptionConfirmation,
  getWorkflowStats,
  triggerQstashWorkflow,
};

export default workflowService;
