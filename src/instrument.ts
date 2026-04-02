// Import Sentry as early as possible
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV !== 'test') {
    Sentry.init({
        dsn:
            process.env.SENTRY_DSN ||
            'https://4a54e88b48bc778c826cd15899b2db04@o4509321567141889.ingest.us.sentry.io/4510846502240256',
        environment: process.env.NODE_ENV || 'development',
        // Setting this option to true will send default PII data to Sentry.
        // For example, automatic IP address collection on events
        sendDefaultPii: true,
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of transactions for development (reduce in production)
    });

    // eslint-disable-next-line no-console
    console.log('✅ Sentry initialized successfully');
}
