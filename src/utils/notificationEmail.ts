/**
 * Premium Email Notification Templates for EOTC Bible
 * Production-ready, visually stunning templates
 * Primary color: #621b1f (Deep Burgundy)
 */

// ─────────────────────────────────────────────────
// Base Styles - Shared Across All Templates
// ─────────────────────────────────────────────────

const baseStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  }
  .container {
    max-width: 620px;
    margin: 20px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(98,27,31,0.15);
  }
  .header {
    background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: shimmer 3s infinite;
  }
  @keyframes shimmer {
    0% { transform: translate(-50%, -50%); }
    50% { transform: translate(-30%, -30%); }
    100% { transform: translate(-50%, -50%); }
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .header-icon {
    font-size: 48px;
    margin-bottom: 10px;
    position: relative;
    z-index: 1;
  }
  .content {
    padding: 40px 35px;
    background: #ffffff;
  }
  .greeting {
    font-size: 20px;
    color: #333;
    margin-bottom: 20px;
    font-weight: 600;
  }
  .brand-name {
    color: #621b1f;
    font-weight: 700;
  }
  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%);
    color: #ffffff;
    padding: 16px 36px;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
    box-shadow: 0 4px 12px rgba(98,27,31,0.3);
  }
  .footer {
    text-align: center;
    padding: 30px;
    color: #888;
    font-size: 13px;
    background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%);
    border-top: 1px solid #e9ecef;
  }
  .footer a { color: #621b1f; text-decoration: none; }
`;

// ─────────────────────────────────────────────────
// Reading Plan Reminder Email Template
// ─────────────────────────────────────────────────

export const generateReadingReminderHTML = (
  userName: string,
  planName: string,
  todayReadings: string,
  completedDays: number,
  totalDays: number,
  unsubscribeUrl: string
): string => {
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reading Reminder - EOTC Bible</title>
      <style>
        ${baseStyles}
        .reading-card {
          background: linear-gradient(135deg, #fdf7f7 0%, #fff5f5 100%);
          border: 2px solid #621b1f;
          border-radius: 16px;
          padding: 30px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(98,27,31,0.1);
        }
        .reading-card h3 {
          color: #621b1f;
          margin: 0 0 20px 0;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .reading-text {
          font-size: 18px;
          color: #444;
          line-height: 1.8;
          font-weight: 500;
        }
        .progress-container {
          background: linear-gradient(135deg, #f0f0f0 0%, #e9ecef 100%);
          border-radius: 12px;
          height: 24px;
          margin: 25px 0;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .progress-bar {
          background: linear-gradient(90deg, #621b1f 0%, #a83240 50%, #621b1f 100%);
          height: 100%;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: progressShine 2s infinite;
        }
        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .progress-text {
          text-align: center;
          color: #621b1f;
          font-weight: 700;
          font-size: 15px;
          margin-top: 10px;
        }
        .stats-row {
          display: flex;
          justify-content: space-around;
          margin: 25px 0;
        }
        .stat-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          min-width: 100px;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #621b1f;
        }
        .stat-label {
          font-size: 13px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 5px;
        }
        .verse-box {
          background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%);
          color: white;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
          font-style: italic;
        }
        .verse-box p { margin: 0; font-size: 16px; }
        .verse-ref { margin-top: 15px; font-weight: 600; font-size: 14px; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">📖</div>
          <h1>Daily Reading Reminder</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <p>Your spiritual journey awaits! You have pending readings in your plan <strong>"${planName}"</strong>. Keep your streak alive!</p>

          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">${completedDays}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${totalDays - completedDays}</div>
              <div class="stat-label">Remaining</div>
            </div>
          </div>

          <div class="progress-container">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-text">${progressPercent}% Complete - ${completedDays} of ${totalDays} days</div>

          <div class="reading-card">
            <h3>📜 Today's Reading</h3>
            <div class="reading-text">${todayReadings}</div>
          </div>

          <div class="verse-box">
            <p>"Your word is a lamp for my feet, a light on my path."</p>
            <div class="verse-ref">— Psalm 119:105</div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Continue Reading</a>
          </div>

          <p style="text-align: center; color: #888; font-size: 14px; margin-top: 25px;">
            <a href="${unsubscribeUrl}" style="color: #621b1f;">Turn off reading reminders</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateReadingReminderText = (
  userName: string,
  planName: string,
  todayReadings: string,
  completedDays: number,
  totalDays: number
): string => {
  return `Reading Plan Reminder - EOTC Bible\n\nHello ${userName},\n\nYou have pending readings in "${planName}".\n\nToday's Reading: ${todayReadings}\n\nProgress: ${completedDays}/${totalDays} days completed\n\nBest regards,\nThe EOTC Bible Team`;
};

// ─────────────────────────────────────────────────
// Newsletter / Subscription Confirmation Email Template
// ─────────────────────────────────────────────────

export const generateSubscriptionConfirmHTML = (email: string, unsubscribeUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed - EOTC Bible</title>
      <style>
        ${baseStyles}
        .confirm-box {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 3px solid #4caf50;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 30px 0;
        }
        .confirm-icon { font-size: 64px; margin-bottom: 20px; }
        .confirm-box h2 { color: #2e7d32; margin: 0 0 15px 0; font-size: 26px; }
        .confirm-box p { color: #1b5e20; font-size: 16px; margin: 0; line-height: 1.7; }
        .benefits-list { background: #f8f9fa; border-radius: 16px; padding: 30px; margin: 30px 0; }
        .benefits-list h4 { color: #621b1f; margin: 0 0 20px 0; text-align: center; font-size: 18px; }
        .benefit-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 10px; }
        .benefit-icon { font-size: 24px; margin-right: 15px; }
        .benefit-text { color: #555; font-size: 15px; }
        .email-display { background: #f0f7ff; border: 1px solid #bbdefb; border-radius: 10px; padding: 15px; margin: 20px 0; text-align: center; font-family: monospace; color: #1976d2; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">✅</div>
          <h1>Subscription Confirmed!</h1>
        </div>
        <div class="content">
          <div class="greeting">Thank you for subscribing!</div>
          <p>You're now part of the <span class="brand-name">EOTC Bible</span> community.</p>

          <div class="confirm-box">
            <div class="confirm-icon">✓</div>
            <h2>You're In!</h2>
            <p>Your subscription is active.</p>
          </div>

          <div class="email-display">${email}</div>

          <div class="benefits-list">
            <h4>What You'll Receive</h4>
            <div class="benefit-item">
              <div class="benefit-icon">📬</div>
              <div class="benefit-text">Weekly digests with spiritual insights</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">🎁</div>
              <div class="benefit-text">Exclusive access to new features</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">📖</div>
              <div class="benefit-text">Curated Bible study resources</div>
            </div>
          </div>

          <p style="text-align: center; color: #888; font-size: 13px; margin-top: 30px;">
            <a href="${unsubscribeUrl}" style="color: #621b1f;">Unsubscribe anytime</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Streak Saver Email Template
// ─────────────────────────────────────────────────

export const generateStreakSaverHTML = (
  userName: string,
  streakCount: number,
  unsubscribeUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Save Your Streak - EOTC Bible</title>
      <style>
        ${baseStyles}
        .streak-display {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 30px 0;
          box-shadow: 0 8px 24px rgba(255,107,53,0.3);
        }
        .streak-icon { font-size: 64px; margin-bottom: 15px; }
        .streak-number { font-size: 72px; font-weight: 900; color: white; text-shadow: 0 4px 8px rgba(0,0,0,0.2); line-height: 1; }
        .streak-label { font-size: 20px; color: white; opacity: 0.95; margin-top: 10px; }
        .urgency-box { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 2px solid #ff9800; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
        .urgency-box h3 { color: #e65100; margin: 0 0 10px 0; font-size: 18px; }
        .urgency-box p { color: #bf360c; margin: 0; font-size: 15px; }
        .tip-box { background: #f0f7ff; border-left: 4px solid #2196f3; border-radius: 12px; padding: 20px; margin: 25px 0; }
        .tip-box h4 { color: #1976d2; margin: 0 0 10px 0; font-size: 15px; }
        .tip-box p { color: #555; margin: 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🔥</div>
          <h1>Don't Lose Your Streak!</h1>
        </div>
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          <p style="font-size: 18px; color: #555;">Your reading streak is on the line! Complete today's reading to keep your momentum.</p>

          <div class="streak-display">
            <div class="streak-icon">🔥</div>
            <div class="streak-number">${streakCount}</div>
            <div class="streak-label">Day Streak</div>
          </div>

          <div class="urgency-box">
            <h3>⚠️ Act Now!</h3>
            <p>Your streak will reset at midnight if you don't complete today's reading.</p>
          </div>

          <div class="tip-box">
            <h4>💡 Quick Tip</h4>
            <p>Even reading just one chapter counts! The goal is consistency.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Read Now & Save Streak</a>
          </div>

          <p style="text-align: center; color: #888; font-size: 14px;">
            <a href="${unsubscribeUrl}" style="color: #621b1f;">Disable streak reminders</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Milestone/Achievement Email Template
// ─────────────────────────────────────────────────

export const generateMilestoneHTML = (
  userName: string,
  title: string,
  message: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Achievement Unlocked - EOTC Bible</title>
      <style>
        ${baseStyles}
        .trophy-container { text-align: center; margin: 30px 0; }
        .trophy-icon { font-size: 80px; animation: bounce 1s ease infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .achievement-title { font-size: 28px; font-weight: 800; color: #621b1f; margin: 20px 0 10px 0; }
        .achievement-badge { display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%); color: #333; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 15px 0; box-shadow: 0 4px 12px rgba(255,215,0,0.4); }
        .message-box { background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%); border-radius: 16px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #2196f3; }
        .message-box p { font-size: 18px; color: #333; margin: 0; line-height: 1.8; }
        .confetti { font-size: 24px; margin: 0 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🏆</div>
          <h1>Achievement Unlocked!</h1>
        </div>
        <div class="content">
          <div class="greeting">Congratulations ${userName}!</div>

          <div class="trophy-container">
            <div class="trophy-icon">🏆</div>
            <div class="achievement-title">${title}</div>
            <div class="achievement-badge">✨ Milestone Reached ✨</div>
          </div>

          <div class="message-box">
            <p>${message}</p>
          </div>

          <p style="text-align: center; font-size: 16px; color: #555;">
            <span class="confetti">🎉</span>
            Keep up the amazing work!
            <span class="confetti">🎊</span>
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">View Your Progress</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Weekly Summary Email Template
// ─────────────────────────────────────────────────

export const generateWeeklySummaryHTML = (
  userName: string,
  chaptersRead: number,
  notesCount: number,
  streakDays: number,
  weeklyGoal: number
): string => {
  const goalProgress = weeklyGoal > 0 ? Math.round((chaptersRead / weeklyGoal) * 100) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Summary - EOTC Bible</title>
      <style>
        ${baseStyles}
        .summary-header { text-align: center; padding: 20px; background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%); border-radius: 16px; margin: 25px 0; }
        .summary-header h2 { color: #1976d2; margin: 0; font-size: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 2px solid #e9ecef; border-radius: 16px; padding: 25px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .stat-card.highlight { border-color: #621b1f; background: linear-gradient(135deg, #fdf7f7 0%, #fff5f5 100%); }
        .stat-icon { font-size: 32px; margin-bottom: 10px; }
        .stat-value { font-size: 36px; font-weight: 800; color: #621b1f; }
        .stat-label { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
        .goal-section { background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%); color: white; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
        .goal-section h3 { margin: 0 0 20px 0; font-size: 18px; opacity: 0.95; }
        .goal-bar { background: rgba(255,255,255,0.3); border-radius: 12px; height: 20px; margin: 15px 0; overflow: hidden; }
        .goal-fill { background: linear-gradient(90deg, #ffd700 0%, #ffb700 100%); height: 100%; border-radius: 12px; }
        .goal-text { font-size: 14px; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">📊</div>
          <h1>Weekly Progress Report</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <p>Here's your spiritual growth summary for the past 7 days!</p>

          <div class="stats-grid">
            <div class="stat-card highlight">
              <div class="stat-icon">📖</div>
              <div class="stat-value">${chaptersRead}</div>
              <div class="stat-label">Chapters Read</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value">${streakDays}</div>
              <div class="stat-label">Day Streak</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📝</div>
              <div class="stat-value">${notesCount}</div>
              <div class="stat-label">Notes Added</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">${goalProgress}%</div>
              <div class="stat-label">Weekly Goal</div>
            </div>
          </div>

          <div class="goal-section">
            <h3>🎯 Weekly Goal Progress</h3>
            <div class="goal-bar">
              <div class="goal-fill" style="width: ${goalProgress}%"></div>
            </div>
            <div class="goal-text">${chaptersRead} of ${weeklyGoal} chapters</div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Continue Your Journey</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Verse of the Day Email Template
// ─────────────────────────────────────────────────

export const generateVotdHTML = (
  verseText: string,
  verseRef: string,
  unsubscribeUrl: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verse of the Day - EOTC Bible</title>
      <style>
        ${baseStyles}
        .verse-container {
          background: linear-gradient(135deg, #fdf7f7 0%, #fff5f5 100%);
          border: 3px solid #621b1f;
          border-radius: 20px;
          padding: 40px;
          margin: 30px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .verse-container::before {
          content: '"';
          position: absolute;
          top: 10px;
          left: 20px;
          font-size: 80px;
          color: rgba(98,27,31,0.1);
          font-family: Georgia, serif;
        }
        .verse-text {
          font-size: 22px;
          font-weight: 500;
          color: #333;
          line-height: 1.8;
          margin: 20px 0;
          font-style: italic;
          position: relative;
          z-index: 1;
        }
        .verse-ref {
          font-size: 18px;
          font-weight: 700;
          color: #621b1f;
          margin-top: 20px;
        }
        .reflection-box {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 25px;
          margin: 25px 0;
          border: 1px solid #e9ecef;
        }
        .reflection-box h4 { color: #621b1f; margin: 0 0 15px 0; font-size: 16px; }
        .reflection-box p { color: #555; margin: 0; font-size: 15px; line-height: 1.7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">📖</div>
          <h1>Verse of the Day</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello,</div>
          <p style="color: #666; font-size: 16px;">Start your day with God's Word.</p>

          <div class="verse-container">
            <div class="verse-text">${verseText}</div>
            <div class="verse-ref">— ${verseRef}</div>
          </div>

          <div class="reflection-box">
            <h4>💭 Today's Reflection</h4>
            <p>Take a moment to meditate on this verse. How does it apply to your life today?</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/read-online" class="cta-button">Read More Verses</a>
          </div>

          <p style="text-align: center; color: #888; font-size: 13px;">
            <a href="${unsubscribeUrl}" style="color: #621b1f;">Unsubscribe</a> from daily verses
          </p>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Welcome Email Template (Onboarding Day 0)
// ─────────────────────────────────────────────────

export const generateWelcomeHTML = (userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to EOTC Bible!</title>
      <style>
        ${baseStyles}
        .welcome-banner {
          background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin: 30px 0;
          color: white;
        }
        .welcome-banner h2 { margin: 0 0 15px 0; font-size: 32px; }
        .welcome-banner p { margin: 0; font-size: 18px; opacity: 0.95; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
        .feature-card { background: linear-gradient(135deg, #fdf7f7 0%, #fff5f5 100%); border: 2px solid #e9ecef; border-radius: 16px; padding: 25px; text-align: center; }
        .feature-icon { font-size: 36px; margin-bottom: 15px; }
        .feature-title { font-weight: 700; color: #621b1f; margin-bottom: 10px; font-size: 16px; }
        .feature-desc { color: #666; font-size: 14px; margin: 0; line-height: 1.6; }
        .quick-start { background: #f0f7ff; border-left: 4px solid #2196f3; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .quick-start h4 { color: #1976d2; margin: 0 0 15px 0; font-size: 16px; }
        .quick-start ol { margin: 0; padding-left: 25px; color: #555; }
        .quick-start li { margin: 10px 0; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🎉</div>
          <h1>Welcome to the Family!</h1>
        </div>
        <div class="content">
          <div class="greeting">Dear ${userName},</div>
          <p>We are overjoyed to welcome you to <span class="brand-name">EOTC Bible</span>!</p>

          <div class="welcome-banner">
            <h2>📖 Your Journey Starts Here</h2>
            <p>Join thousands of believers growing deeper in their faith every day.</p>
          </div>

          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">📚</div>
              <div class="feature-title">Reading Plans</div>
              <div class="feature-desc">Structured plans to guide your daily reading</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔖</div>
              <div class="feature-title">Bookmarks</div>
              <div class="feature-desc">Save your favorite verses</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📝</div>
              <div class="feature-title">Notes</div>
              <div class="feature-desc">Capture insights and reflections</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔥</div>
              <div class="feature-title">Streaks</div>
              <div class="feature-desc">Build consistent reading habits</div>
            </div>
          </div>

          <div class="quick-start">
            <h4>🚀 Quick Start Guide</h4>
            <ol>
              <li>Choose a reading plan that fits your schedule</li>
              <li>Set aside a few minutes each day for reading</li>
              <li>Bookmark verses that speak to your heart</li>
              <li>Join our community of faithful readers</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Start Your First Plan</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Day 3 Onboarding Email Template
// ─────────────────────────────────────────────────

export const generateDay3HTML = (userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Discover This Feature - EOTC Bible</title>
      <style>
        ${baseStyles}
        .feature-showcase { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 2px solid #4caf50; border-radius: 20px; padding: 35px; margin: 30px 0; text-align: center; }
        .feature-showcase h3 { color: #2e7d32; margin: 0 0 20px 0; font-size: 22px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .feature-showcase p { color: #1b5e20; font-size: 16px; margin: 0 0 20px 0; line-height: 1.7; }
        .step-list { background: white; border-radius: 16px; padding: 25px; margin: 20px 0; text-align: left; }
        .step-item { display: flex; align-items: flex-start; margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 12px; }
        .step-number { background: #4caf50; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; margin-right: 15px; }
        .step-text { color: #555; font-size: 15px; line-height: 1.6; }
        .tip-banner { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 4px solid #ff9800; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .tip-banner h4 { color: #e65100; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .tip-banner p { color: #bf360c; margin: 0; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">💡</div>
          <h1>Discover This Feature!</h1>
        </div>
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          <p>You've been with us for a few days! We wanted to share one of our most powerful features.</p>

          <div class="feature-showcase">
            <h3>✨ Personal Highlights & Notes</h3>
            <p>Transform your Bible reading by capturing insights as they come to you!</p>

            <div class="step-list">
              <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-text">Open any chapter in the Bible reader</div>
              </div>
              <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-text">Click on any verse to highlight it</div>
              </div>
              <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-text">Add your personal notes and reflections</div>
              </div>
              <div class="step-item">
                <div class="step-number">4</div>
                <div class="step-text">Access all your highlights anytime</div>
              </div>
            </div>
          </div>

          <div class="tip-banner">
            <h4>🎯 Pro Tip</h4>
            <p>Use different highlight colors for different themes: promises, commands, and prayers. It's a game-changer!</p>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/read-online/John/1" class="cta-button">Try It Now</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─────────────────────────────────────────────────
// Day 7 Onboarding Email Template
// ─────────────────────────────────────────────────

export const generateDay7HTML = (userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>One Week With You! - EOTC Bible</title>
      <style>
        ${baseStyles}
        .week-banner { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); border-radius: 20px; padding: 40px; text-align: center; margin: 30px 0; color: white; }
        .week-banner h2 { margin: 0 0 15px 0; font-size: 28px; }
        .week-banner p { margin: 0; font-size: 17px; opacity: 0.95; }
        .encouragement-box { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border: 2px solid #9c27b0; border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
        .encouragement-box h3 { color: #6a1b9a; margin: 0 0 15px 0; font-size: 20px; }
        .encouragement-box p { color: #4a148c; font-size: 16px; line-height: 1.8; margin: 0; }
        .verse-card { background: white; border: 2px solid #e1bee7; border-radius: 16px; padding: 30px; margin: 25px 0; text-align: center; box-shadow: 0 4px 12px rgba(156,39,176,0.1); }
        .verse-card p { font-size: 18px; font-style: italic; color: #6a1b9a; margin: 0 0 15px 0; line-height: 1.7; }
        .verse-card cite { color: #888; font-size: 15px; }
        .milestone-badges { display: flex; justify-content: space-around; margin: 30px 0; flex-wrap: wrap; gap: 15px; }
        .badge { text-align: center; padding: 15px; background: white; border-radius: 12px; border: 2px solid #e1bee7; min-width: 100px; }
        .badge-icon { font-size: 32px; margin-bottom: 8px; }
        .badge-label { font-size: 13px; color: #888; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🌱</div>
          <h1>One Week Down!</h1>
        </div>
        <div class="content">
          <div class="greeting">Dear ${userName},</div>
          <p>Can you believe it's already been a week? We wanted to celebrate this milestone with you!</p>

          <div class="week-banner">
            <h2>🎉 Happy 1 Week!</h2>
            <p>You've taken your first step into a lifetime of spiritual growth.</p>
          </div>

          <div class="encouragement-box">
            <h3>💜 A Note of Encouragement</h3>
            <p>
              Whether you've read every day or missed a few, <strong>you're doing great</strong>.
              What matters most is not perfection—it's persistence.
            </p>
          </div>

          <div class="verse-card">
            <p>"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."</p>
            <cite>— Galatians 6:9</cite>
          </div>

          <div class="milestone-badges">
            <div class="badge">
              <div class="badge-icon">📅</div>
              <div class="badge-label">7 Days</div>
            </div>
            <div class="badge">
              <div class="badge-icon">🌟</div>
              <div class="badge-label">Started Strong</div>
            </div>
            <div class="badge">
              <div class="badge-icon">🏃</div>
              <div class="badge-label">Keep Going</div>
            </div>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Continue Your Journey</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Export all templates
export default {
  generateReadingReminderHTML,
  generateReadingReminderText,
  generateSubscriptionConfirmHTML,
  generateStreakSaverHTML,
  generateMilestoneHTML,
  generateWeeklySummaryHTML,
  generateVotdHTML,
  generateWelcomeHTML,
  generateDay3HTML,
  generateDay7HTML,
};
