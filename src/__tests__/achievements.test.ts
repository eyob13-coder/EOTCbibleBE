import request from 'supertest';
import app from '../index';
import jwt from 'jsonwebtoken';
import { User, UserAchievement } from '../models';
import { publishAchievementEmailJob } from '../utils/qstashService';

jest.mock('../utils/qstashService', () => {
  const actual = jest.requireActual('../utils/qstashService');
  return {
    ...actual,
    publishAchievementEmailJob: jest.fn().mockResolvedValue({ messageId: 'msg_ach_123' }),
    verifyWebhookSignature: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('../utils/emailService', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    verifyConnection: jest.fn().mockResolvedValue(true),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Achievements Notifications', () => {
  let authToken: string;
  let testUser: any;
  let testCounter = 0;

  beforeAll(async () => {
    await User.deleteMany({});
    await UserAchievement.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await UserAchievement.deleteMany({});
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await UserAchievement.deleteMany({});

    testCounter++;
    testUser = new User({
      name: 'Achievement Test User',
      email: `ach-test-${testCounter}@example.com`,
      password: 'Password123!',
      streak: { current: 0, longest: 0, lastDate: null },
    });
    await testUser.save();

    authToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email, name: testUser.name },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/v1/achievements/notify')
      .send({ achievementIds: ['first_step'] })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('returns 400 for missing/empty achievementIds', async () => {
    await request(app)
      .post('/api/v1/achievements/notify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    await request(app)
      .post('/api/v1/achievements/notify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ achievementIds: [] })
      .expect(400);
  });

  it('enqueues emails for new achievements and dedupes repeats', async () => {
    const first = await request(app)
      .post('/api/v1/achievements/notify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ achievementIds: ['first_step', 'streak_7'] })
      .expect(200);

    expect(first.body.success).toBe(true);
    expect(first.body.notified.sort()).toEqual(['first_step', 'streak_7'].sort());
    expect(publishAchievementEmailJob).toHaveBeenCalledTimes(2);

    const second = await request(app)
      .post('/api/v1/achievements/notify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ achievementIds: ['first_step', 'streak_7'] })
      .expect(200);

    expect(second.body.success).toBe(true);
    expect(second.body.notified).toEqual([]);
    expect(publishAchievementEmailJob).toHaveBeenCalledTimes(2);

    const rows = await UserAchievement.find({ userId: testUser._id });
    expect(rows).toHaveLength(2);
  });

  it('worker endpoint requires signature in production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .post('/api/v1/workers/send-achievement-email')
      .send({
        userId: 'x',
        email: 'user@example.com',
        name: 'User',
        achievementId: 'streak_7',
        achievementTitle: 'Weekly Warrior',
        achievementDescription: 'Maintain a 7-day reading streak',
        achievementEmoji: '',
        achievementTier: 'bronze',
      })
      .expect(401);

    expect(response.body.success).toBe(false);

    process.env.NODE_ENV = prev;
  });
});

