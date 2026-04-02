import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Subscriber
export interface ISubscriber extends Document {
    email: string;
    isActive: boolean;
    subscribedAt: Date;
    unsubscribedAt?: Date | null;
    source: 'website' | 'api';
}

// Subscriber schema for guest newsletter subscriptions
const subscriberSchema = new Schema<ISubscriber>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Please enter a valid email address']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: {
        type: Date,
        default: null
    },
    source: {
        type: String,
        enum: ['website', 'api'],
        default: 'website'
    }
}, {
    timestamps: true
});

// Index for querying active subscribers
subscriberSchema.index({ isActive: 1 });

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
