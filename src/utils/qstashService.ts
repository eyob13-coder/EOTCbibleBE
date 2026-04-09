import { Client, Receiver } from '@upstash/qstash';

// Lazy-initialized QStash client
let _client: Client | null = null;
let _receiver: Receiver | null = null;

const getClient = (): Client => {
    if (!_client) {
        const token = process.env.QSTASH_TOKEN;
        if (!token) {
            console.error('❌ QSTASH_TOKEN is not set. QStash features will fail.');
        }
        const baseUrl = process.env.QSTASH_URL;
        const config: any = { token: token || '' };
        if (baseUrl) {
            config.baseUrl = baseUrl;
        }
        _client = new Client(config);
    }
    return _client;
};

const getReceiver = (): Receiver => {
    if (!_receiver) {
        const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
        const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
        if (!currentSigningKey || !nextSigningKey) {
            console.error('❌ QSTASH signing keys are not set. Webhook verification will fail.');
        }
        _receiver = new Receiver({
            currentSigningKey: currentSigningKey || '',
            nextSigningKey: nextSigningKey || '',
        });
    }
    return _receiver;
};

const resolvePublicUrl = (urlOrPath: string): string => {
    if (/^https?:\/\//i.test(urlOrPath)) {
        return urlOrPath;
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
        throw new Error('APP_URL is not configured (required for QStash destinations)');
    }

    const base = appUrl.replace(/\/+$/, '');
    const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
    return `${base}${path}`;
};

/**
 * Publish a notification message to QStash, which will call the webhook endpoint
 */
export const publishNotification = async (payload: {
    type: 'reading-reminder' | 'newsletter';
    subject: string;
    htmlContent?: string;
    textContent?: string;
}): Promise<{ messageId: string }> => {
    const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
    if (!webhookUrl) {
        throw new Error('QSTASH_WEBHOOK_URL is not configured');
    }

    const client = getClient();
    const res = await client.publishJSON({
        url: resolvePublicUrl(`${webhookUrl}/${payload.type}`),
        body: payload,
    });

    console.log(`✅ QStash message published: ${res.messageId}`);
    return { messageId: res.messageId };
};

/**
 * Verify the signature of an incoming QStash webhook request
 */
export const verifyWebhookSignature = async (signature: string, body: string): Promise<boolean> => {
    try {
        const receiver = getReceiver();
        const isValid = await receiver.verify({
            signature,
            body,
        });
        return isValid;
    } catch (error) {
        console.error('❌ QStash signature verification failed:', error);
        return false;
    }
};

/**
 * Helper to ensure a schedule is created only if it doesn't already exist
 */
const ensureSchedule = async (destinationPath: string, cron: string, payload: any, logName: string): Promise<string | null> => {
    const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn(`⚠️  QSTASH_WEBHOOK_URL not set. Skipping ${logName}.`);
        return null;
    }

    const fullUrl = resolvePublicUrl(`${webhookUrl}${destinationPath}`);
    try {
        const client = getClient();
        
        // Fetch existing schedules to prevent duplicates
        const existingSchedules = await client.schedules.list();
        const exists = existingSchedules.find(s => s.destination === fullUrl);
        if (exists) {
            console.log(`ℹ️  QStash ${logName} schedule already active: ${exists.scheduleId}`);
            return exists.scheduleId;
        }

        const schedule = await client.schedules.create({
            destination: fullUrl,
            cron,
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`✅ QStash ${logName} schedule created: ${schedule.scheduleId}`);
        return schedule.scheduleId;
    } catch (error) {
        console.error(`❌ Failed to create QStash ${logName} schedule:`, error);
        return null;
    }
};

/**
 * Create a daily reading plan reminder schedule (runs daily at 8 AM UTC)
 */
export const createDailyReminderSchedule = async () => {
    return ensureSchedule(
        '/reading-reminder',
        '0 8 * * *',
        { type: 'reading-reminder', subject: 'Reading Plan Reminder' },
        'daily reminder'
    );
};

/**
 * Create a daily streak saver schedule (runs daily at 6 PM UTC)
 */
export const createStreakSaverSchedule = async () => {
    return ensureSchedule(
        '/streak-saver',
        '0 18 * * *',
        { type: 'streak-saver' },
        'streak saver'
    );
};

/**
 * Create a weekly summary schedule (runs Sunday at 9 AM UTC)
 */
export const createWeeklySummarySchedule = async () => {
    return ensureSchedule(
        '/weekly-summary',
        '0 9 * * 0',
        { type: 'weekly-summary' },
        'weekly summary'
    );
};

/**
 * Create Verse of the Day schedule (runs daily at 6 AM UTC)
 */
export const createVotdSchedule = async () => {
    return ensureSchedule(
        '/verse-of-the-day',
        '0 6 * * *',
        { type: 'verse-of-the-day' },
        'VOTD'
    );
};

/**
 * Publish a milestone achievement instantly via QStash
 */
export const publishMilestoneNotification = async (userId: string, title: string, message: string): Promise<void> => {
    const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
    if (!webhookUrl) return;
    try {
        const client = getClient();
        await client.publishJSON({
            url: resolvePublicUrl(`${webhookUrl}/milestone`),
            body: { type: 'milestone', userId, title, message },
        });
    } catch (e) {
        console.error('Failed to publish milestone', e);
    }
};


/**
 * Trigger the 3-part Onboarding Drip Campaign using QStash delays
 */
export const publishOnboardingSeries = async (userId: string): Promise<void> => {
    const webhookUrl = process.env.QSTASH_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const client = getClient();
        const url = resolvePublicUrl(`${webhookUrl}/onboarding`);

        // Day 0: Instant Welcome
        await client.publishJSON({
            url,
            body: { userId, day: 0 },
            delay: "0s"
        });

        // Day 3: Feature Highlights
        await client.publishJSON({
            url,
            body: { userId, day: 3 },
            delay: "3d" // Upstash delay syntax!
        });

        // Day 7: Habit Builder
        await client.publishJSON({
            url,
            body: { userId, day: 7 },
            delay: "7d"
        });

        console.log(`✅ Onboarding drip campaign queued for user: ${userId}`);
    } catch (e) {
        console.error('Failed to queue onboarding series', e);
    }
};

export const publishAchievementEmailJob = async (payload: Record<string, unknown>): Promise<{ messageId: string }> => {
    const destinationOverride = process.env.QSTASH_ACHIEVEMENT_WORKER_URL;
    const destination = destinationOverride || '/api/v1/workers/send-achievement-email';

    const fullUrl = resolvePublicUrl(destination);
    
    // QStash cloud cannot reach your local machine's "localhost" without a tunnel (like ngrok).
    // If the URL is localhost, silently mock success to prevent development crashes!
    if (fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1')) {
        console.warn(`⚠️ Skipped QStash publish to localhost: ${fullUrl}`);
        return { messageId: 'mock-local-message-id' };
    }

    const client = getClient();
    const res = await client.publishJSON({
        url: fullUrl,
        body: payload,
    });

    return { messageId: res.messageId };
};

/**
 * List all active QStash schedules
 */
export const listSchedules = async () => {
    try {
        const client = getClient();
        const schedules = await client.schedules.list();
        return schedules;
    } catch (error) {
        console.error('❌ Failed to list QStash schedules:', error);
        return [];
    }
};

/**
 * Delete a QStash schedule by ID
 */
export const deleteSchedule = async (scheduleId: string): Promise<boolean> => {
    try {
        const client = getClient();
        await client.schedules.delete(scheduleId);
        console.log(`✅ QStash schedule deleted: ${scheduleId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to delete QStash schedule:', error);
        return false;
    }
};

/**
 * Verify QStash configuration is valid
 */
export const verifyQStashConnection = async (): Promise<boolean> => {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
        console.warn('⚠️  QSTASH_TOKEN not set. QStash service unavailable.');
        return false;
    }
    console.log('✅ QStash service configured successfully');
    return true;
};

export default {
    publishNotification,
    verifyWebhookSignature,
    createDailyReminderSchedule,
    createStreakSaverSchedule,
    createWeeklySummarySchedule,
    createVotdSchedule,
    publishMilestoneNotification,
    publishOnboardingSeries,
    publishAchievementEmailJob,
    listSchedules,
    deleteSchedule,
    verifyQStashConnection,
};
