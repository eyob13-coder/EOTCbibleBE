import type { AchievementTier } from '../../constants/achievements';

const tierColors: Record<AchievementTier, { bg: string; fg: string; border: string }> = {
  bronze: { bg: '#fff4e6', fg: '#7c3e00', border: '#ffcc99' },
  silver: { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' },
  gold: { bg: '#fff7d6', fg: '#6b4e00', border: '#fcd34d' },
  platinum: { bg: '#eef2ff', fg: '#3730a3', border: '#c7d2fe' },
};

export const generateAchievementEmailHTML = (params: {
  name: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementEmoji: string;
  achievementTier: AchievementTier;
  ctaUrl?: string;
}): string => {
  const ctaUrl = params.ctaUrl || 'https://eotcbible.org/dashboard/achievements';
  const emoji = params.achievementEmoji || '🎉';
  const tier = params.achievementTier;
  const colors = tierColors[tier];

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Achievement Unlocked</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background: #f7f7f8; }
        .container { max-width: 620px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 26px rgba(17,24,39,0.10); }
        .header { background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%); color: #fff; padding: 38px 30px; text-align: center; }
        .header .emoji { font-size: 52px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
        .content { padding: 34px 34px 28px; }
        .greeting { font-size: 18px; font-weight: 650; margin: 0 0 14px; }
        .card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 18px; background: #fafafa; }
        .titleRow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .titleRow .title { font-size: 20px; font-weight: 800; margin: 0; color: #111827; }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; border: 1px solid ${colors.border}; background: ${colors.bg}; color: ${colors.fg}; }
        .desc { margin: 0; font-size: 15px; color: #374151; }
        .ctaWrap { text-align: center; padding: 22px 0 6px; }
        .cta { display: inline-block; background: #621b1f; color: #fff !important; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 800; }
        .footer { text-align: center; padding: 18px 28px 26px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">${emoji}</div>
          <h1>Achievement Unlocked!</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello ${escapeHtml(params.name)},</p>
          <div class="card">
            <div class="titleRow">
              <h2 class="title">${escapeHtml(params.achievementTitle)}</h2>
              <span class="badge">${tier}</span>
            </div>
            <p class="desc">${escapeHtml(params.achievementDescription)}</p>
          </div>
          <div class="ctaWrap">
            <a class="cta" href="${ctaUrl}" target="_blank" rel="noopener noreferrer">View Achievements</a>
          </div>
        </div>
        <div class="footer">
          Keep reading — small steps become a lifelong habit.
        </div>
      </div>
    </body>
  </html>
  `;
};

const escapeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

