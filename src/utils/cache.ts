import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({
    url: redisUrl
});

let isConnected = false;

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => {
    isConnected = true;
    console.log('✅ Redis connected successfully');
});

const connectRedis = async () => {
    if (!isConnected) {
        try {
            await client.connect();
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error);
        }
    }
};

// Initialize connection
connectRedis();

/**
 * Get data from cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!isConnected) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
};

/**
 * Set data to cache with optional TTL (in seconds)
 */
export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    if (!isConnected) return;
    try {
        const stringValue = JSON.stringify(value);
        await client.set(key, stringValue, {
            EX: ttl
        });
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
};

/**
 * Delete data from cache
 */
export const deleteCache = async (key: string): Promise<void> => {
    if (!isConnected) return;
    try {
        await client.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
    }
};

/**
 * Delete multiple keys matching a pattern
 * Use with caution in production on large datasets
 */
export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
    if (!isConnected) return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (error) {
        console.error(`Error deleting cache by pattern ${pattern}:`, error);
    }
};

export default {
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern
};
