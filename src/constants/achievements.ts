export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementType = 'special' | 'streak' | 'chapters' | 'books';

export interface AchievementMetadata {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: AchievementTier;
  type: AchievementType;
}

const streakDescription = (days: number) => `Maintain a ${days}-day reading streak.`;
const chaptersDescription = (count: number) => `Read ${count} chapters.`;
const bookDescription = (bookName: string) => `Complete the book of ${bookName}.`;

export const ACHIEVEMENTS_MAP: Record<string, AchievementMetadata> = {
  first_step: {
    id: 'first_step',
    title: 'First Step',
    description: 'Start your journey by reading for the first time.',
    emoji: '📖',
    type: 'special',
    tier: 'bronze',
  },
  streak_3: {
    id: 'streak_3',
    title: 'First Flame',
    description: streakDescription(3),
    emoji: '🔥',
    type: 'streak',
    tier: 'bronze',
  },
  streak_7: {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: streakDescription(7),
    emoji: '',
    type: 'streak',
    tier: 'bronze',
  },
  streak_14: {
    id: 'streak_14',
    title: 'Faithful Fortnight',
    description: streakDescription(14),
    emoji: '',
    type: 'streak',
    tier: 'silver',
  },
  streak_30: {
    id: 'streak_30',
    title: 'Monthly Disciple',
    description: streakDescription(30),
    emoji: '🌟',
    type: 'streak',
    tier: 'silver',
  },
  streak_60: {
    id: 'streak_60',
    title: 'Iron Reader',
    description: streakDescription(60),
    emoji: '🏅',
    type: 'streak',
    tier: 'gold',
  },
  streak_100: {
    id: 'streak_100',
    title: 'Centurion',
    description: streakDescription(100),
    emoji: '💯',
    type: 'streak',
    tier: 'gold',
  },
  streak_365: {
    id: 'streak_365',
    title: 'Year of the Word',
    description: streakDescription(365),
    emoji: '👑',
    type: 'streak',
    tier: 'platinum',
  },
  chapters_10: {
    id: 'chapters_10',
    title: 'Devoted Reader',
    description: chaptersDescription(10),
    emoji: '📚',
    type: 'chapters',
    tier: 'bronze',
  },
  chapters_25: {
    id: 'chapters_25',
    title: 'Chapter Champion',
    description: chaptersDescription(25),
    emoji: '🎯',
    type: 'chapters',
    tier: 'bronze',
  },
  chapters_50: {
    id: 'chapters_50',
    title: 'Halfway Pilgrim',
    description: chaptersDescription(50),
    emoji: '🏃',
    type: 'chapters',
    tier: 'silver',
  },
  chapters_100: {
    id: 'chapters_100',
    title: 'Century Reader',
    description: chaptersDescription(100),
    emoji: '💪',
    type: 'chapters',
    tier: 'silver',
  },
  chapters_250: {
    id: 'chapters_250',
    title: 'Bible Scholar',
    description: chaptersDescription(250),
    emoji: '🎓',
    type: 'chapters',
    tier: 'gold',
  },
  chapters_500: {
    id: 'chapters_500',
    title: 'Wisdom Seeker',
    description: chaptersDescription(500),
    emoji: '🔮',
    type: 'chapters',
    tier: 'gold',
  },
  chapters_1000: {
    id: 'chapters_1000',
    title: 'Living Word',
    description: chaptersDescription(1000),
    emoji: '',
    type: 'chapters',
    tier: 'platinum',
  },
  book_genesis: {
    id: 'book_genesis',
    title: 'In the Beginning',
    description: bookDescription('Genesis'),
    emoji: '🌱',
    type: 'books',
    tier: 'silver',
  },
  book_psalms: {
    id: 'book_psalms',
    title: 'Psalms of David',
    description: bookDescription('Psalms'),
    emoji: '🎵',
    type: 'books',
    tier: 'gold',
  },
  book_proverbs: {
    id: 'book_proverbs',
    title: 'Wisdom of Proverbs',
    description: bookDescription('Proverbs'),
    emoji: '💡',
    type: 'books',
    tier: 'bronze',
  },
  book_isaiah: {
    id: 'book_isaiah',
    title: 'Voice of the Prophet',
    description: bookDescription('Isaiah'),
    emoji: '🕊',
    type: 'books',
    tier: 'gold',
  },
  book_enoch: {
    id: 'book_enoch',
    title: 'Ancient Scribe',
    description: bookDescription('Enoch'),
    emoji: '📜',
    type: 'books',
    tier: 'silver',
  },
  book_matthew: {
    id: 'book_matthew',
    title: 'Good News',
    description: bookDescription('Matthew'),
    emoji: '',
    type: 'books',
    tier: 'silver',
  },
  book_john: {
    id: 'book_john',
    title: 'In the Beginning Was the Word',
    description: bookDescription('John'),
    emoji: '🌊',
    type: 'books',
    tier: 'silver',
  },
  book_acts: {
    id: 'book_acts',
    title: 'Acts of Faith',
    description: bookDescription('Acts'),
    emoji: '',
    type: 'books',
    tier: 'silver',
  },
  book_revelation: {
    id: 'book_revelation',
    title: 'The Final Word',
    description: bookDescription('Revelation'),
    emoji: '',
    type: 'books',
    tier: 'gold',
  },
  nt_complete: {
    id: 'nt_complete',
    title: 'New Covenant',
    description: 'Complete the New Testament.',
    emoji: '🕊',
    type: 'books',
    tier: 'platinum',
  },
  ot_complete: {
    id: 'ot_complete',
    title: 'Ancient Covenant',
    description: 'Complete the Old Testament.',
    emoji: '📜',
    type: 'books',
    tier: 'platinum',
  },
};

export const getAchievementMetadata = (achievementId: string): AchievementMetadata | null => {
  return ACHIEVEMENTS_MAP[achievementId] ?? null;
};

