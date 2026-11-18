import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Lists all active files stored under the authenticated user's prefix: uploads/{userId}/
 * Filters out folder placeholders and computes metadata for the frontend.
 */
export async function handleListUserFiles(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    const prefix = `uploads/${userId}/`;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    const files = contents
      .filter(item => item.Key !== prefix && !item.Key.endsWith('/'))
      .map(item => {
        const fileName = item.Key.replace(prefix, '');
        return {
          key: item.Key,
          fileName,
          size: item.Size,
          lastModified: item.LastModified,
          storageClass: item.StorageClass || 'STANDARD',
          etag: item.ETag?.replace(/"/g, '')
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return buildResponse(200, {
      files,
      count: files.length,
      prefix
    });
  } catch (error) {
    console.error('Error listing user files:', error);
    return buildResponse(500, { error: 'Failed to list files', details: error.message });
  }
}
