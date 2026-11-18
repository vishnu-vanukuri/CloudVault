import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';

/**
 * AWS SDK v3 S3 Client
 * Uses default credential provider chain (Lambda execution role in cloud,
 * or local credentials in dev).
 */
export const s3Client = new S3Client({ region });
export const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || '';
