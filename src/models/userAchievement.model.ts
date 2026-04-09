import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  notifiedAt?: Date | null;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    achievementId: {
      type: String,
      required: [true, 'Achievement ID is required'],
      trim: true,
    },
    // Set once the QStash job is successfully enqueued (or the email is dispatched).
    // Optional to allow safe retries if enqueue fails.
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Never send duplicate notifications per user per achievement.
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);

