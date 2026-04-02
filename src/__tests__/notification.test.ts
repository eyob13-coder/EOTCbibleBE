import request from 'supertest';
import app from '../index';
import * as jwt from 'jsonwebtoken';
import { BlacklistedToken, User, ReadingPlan, Subscriber } from '../models';
import { Subscriber as SubscriberModel } from '../models/subscriber.model';
import { emailService } from '../utils/emailService';
import { publishNotification } from '../utils/qstashService';

// Mock models and services
jest.mock('../models', () => {
    const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        settings: { notificationsEnabled: true },
        streak: { current: 5, lastDate: new Date(Date.now() - 86400000) }
    };

    return {
        User: {
            findById: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            }),
            findByIdAndUpdate: jest.fn(),
            find: jest.fn(),
        },
        ReadingPlan: {
            find: jest.fn().mockReturnThis(),
            populate: jest.fn(),
        },
        Subscriber: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true),
        })),
        BlacklistedToken: {
            isBlacklisted: jest.fn().mockResolvedValue(false),
        },
    };
});

// Add static methods to Subscriber mock from '../models'
(Subscriber as unknown as { findOne: jest.Mock; find: jest.Mock }).findOne = jest.fn();
(Subscriber as unknown as { findOne: jest.Mock; find: jest.Mock }).find = jest.fn();

// Mock '../models/subscriber.model' since the controller imports Subscriber from there directly
jest.mock('../models/subscriber.model', () => ({
    Subscriber: Object.assign(
        jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true),
        })),
        {
            findOne: jest.fn(),
            find: jest.fn(),
        }
    ),
}));

jest.mock('../utils/emailService', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue({ success: true }),
        verifyConnection: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../utils/qstashService', () => ({
    verifyWebhookSignature: jest.fn().mockResolvedValue(true),
    publishNotification: jest.fn().mockResolvedValue({ messageId: 'msg_123' }),
    verifyQStashConnection: jest.fn().mockResolvedValue(true),
    createDailyReminderSchedule: jest.fn().mockResolvedValue(true),
    createStreakSaverSchedule: jest.fn().mockResolvedValue(true),
    createWeeklySummarySchedule: jest.fn().mockResolvedValue(true),
    createVotdSchedule: jest.fn().mockResolvedValue(true),
}));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Notification Routes', () => {
    let authToken: string;
    const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        settings: { notificationsEnabled: true },
        streak: { current: 5, lastDate: new Date(Date.now() - 86400000) }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        authToken = jwt.sign({ userId: mockUser._id, email: mockUser.email }, JWT_SECRET);
        
        // Mock authenticateToken middleware by mocking User.findById
        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        (User.findById as jest.Mock).mockReturnValue({
            select: mockSelect
        });

        // Re-setup BlacklistedToken mock (cleared by clearAllMocks)
        (BlacklistedToken.isBlacklisted as jest.Mock).mockResolvedValue(false);
    });

    describe('POST /api/v1/notifications/subscribe', () => {
        it('should subscribe a new email', async () => {
            (SubscriberModel.findOne as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/notifications/subscribe')
                .send({ email: 'guest@example.com' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(emailService.sendEmail).toHaveBeenCalled();
        });

        it('should return 400 for invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/notifications/subscribe')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/notifications/unsubscribe', () => {
        it('should unsubscribe an email', async () => {
            const mockSub = { email: 'guest@example.com', isActive: true, save: jest.fn().mockResolvedValue(true) };
            (SubscriberModel.findOne as jest.Mock).mockResolvedValue(mockSub);

            const response = await request(app)
                .post('/api/v1/notifications/unsubscribe')
                .send({ email: 'guest@example.com' });

            expect(response.status).toBe(200);
            expect(mockSub.isActive).toBe(false);
            expect(mockSub.save).toHaveBeenCalled();
        });
    });

    describe('PUT /api/v1/notifications/toggle', () => {
        it('should toggle notifications for user', async () => {
            (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                ...mockUser,
                settings: { notificationsEnabled: false }
            });

            const response = await request(app)
                .put('/api/v1/notifications/toggle')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ enabled: false });

            expect(response.status).toBe(200);
            expect(response.body.data.notificationsEnabled).toBe(false);
        });
    });

    describe('QStash Webhooks', () => {
        it('should process reading-reminder webhook', async () => {
            const mockPlan = {
                name: 'Plan 1',
                userId: mockUser,
                durationInDays: 30,
                dailyReadings: [{
                    date: new Date().toISOString(),
                    isCompleted: false,
                    readings: [{ book: 'John', startChapter: 1, endChapter: 1 }]
                }]
            };
            
            const mockPopulate = jest.fn().mockResolvedValue([mockPlan]);
            (ReadingPlan.find as jest.Mock).mockReturnValue({
                populate: mockPopulate
            });

            const response = await request(app)
                .post('/api/v1/notifications/webhook/reading-reminder')
                .set('upstash-signature', 'valid-sig')
                .send({});

            expect(response.status).toBe(200);
            expect(emailService.sendEmail).toHaveBeenCalled();
        });

        it('should process streak-saver webhook', async () => {
             (User.find as jest.Mock).mockResolvedValue([mockUser]);

             const response = await request(app)
                .post('/api/v1/notifications/webhook/streak-saver')
                .send({});

             expect(response.status).toBe(200);
             expect(emailService.sendEmail).toHaveBeenCalled();
        });

        it('should process weekly-summary webhook', async () => {
            (User.find as jest.Mock).mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockUser])
            });

            const response = await request(app)
                .post('/api/v1/notifications/webhook/weekly-summary')
                .send({});

            expect(response.status).toBe(200);
            expect(emailService.sendEmail).toHaveBeenCalled();
        });

        it('should process verse-of-the-day webhook', async () => {
            (SubscriberModel.find as jest.Mock).mockResolvedValue([{ email: 'sub@example.com', isActive: true }]);

            const response = await request(app)
                .post('/api/v1/notifications/webhook/verse-of-the-day')
                .send({});

            expect(response.status).toBe(200);
            expect(emailService.sendEmail).toHaveBeenCalled();
        });
    });

    describe('POST /api/v1/notifications/send', () => {
        it('should queue a manual notification', async () => {
            const response = await request(app)
                .post('/api/v1/notifications/send')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ type: 'newsletter', subject: 'Total News' });

            expect(response.status).toBe(200);
            expect(publishNotification).toHaveBeenCalledWith({
                type: 'newsletter',
                subject: 'Total News'
            });
            expect(response.body.data.messageId).toBe('msg_123');
        });
    });
});

