import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Generates an S3 Presigned URL for uploading files directly from the browser.
 * This ensures the backend Lambda never touches file binaries, saving memory,
 * execution time, and preventing Lambda 6MB payload limits.
 */
export async function handleGetPresignedUploadUrl(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { fileName, fileType } = body;

    if (!fileName) {
      return buildResponse(400, { error: 'Bad Request: "fileName" is required.' });
    }

    // Sanitize fileName to prevent directory traversal
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${userId}/${safeFileName}`;

    // S3 PutObject command with server-side encryption (SSE-S3)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType || 'application/octet-stream',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'uploaded-by': userId,
        'original-name': fileName
      }
    });

    // Generate Presigned URL valid for 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return buildResponse(200, {
      uploadUrl,
      key: objectKey,
      fileName: safeFileName,
      expiresIn: 900
    });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    return buildResponse(500, { error: 'Failed to generate upload URL', details: error.message });
  }
}
