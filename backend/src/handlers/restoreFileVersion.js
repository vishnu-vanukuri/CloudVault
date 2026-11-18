import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Restores a specific historical version of a file.
 * In AWS S3, restoring an older version is achieved by copying the older versionId
 * to the current object key. This preserves full audit trail and creates a brand
 * new version that matches the chosen historical snapshot.
 */
export async function handleRestoreFileVersion(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { fileName, versionId } = body;

    if (!fileName || !versionId) {
      return buildResponse(400, { error: 'Bad Request: "fileName" and "versionId" are required.' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${userId}/${safeFileName}`;

    // S3 CopySource syntax: bucket/key?versionId=XYZ
    const copySource = encodeURIComponent(`${BUCKET_NAME}/${objectKey}`) + `?versionId=${versionId}`;

    const command = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      CopySource: `${BUCKET_NAME}/${objectKey}?versionId=${versionId}`,
      ServerSideEncryption: 'AES256',
      MetadataDirective: 'COPY'
    });

    const result = await s3Client.send(command);

    return buildResponse(200, {
      message: `Version ${versionId} successfully restored as the current version.`,
      newVersionId: result.VersionId,
      fileName: safeFileName
    });
  } catch (error) {
    console.error('Error restoring file version:', error);
    return buildResponse(500, { error: 'Failed to restore file version', details: error.message });
  }
}
