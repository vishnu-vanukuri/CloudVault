import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Deletes a file.
 * In a Version-Enabled S3 bucket:
 * 1. Deleting without versionId inserts a "Delete Marker" (soft delete - can be restored!).
 * 2. Deleting with versionId permanently removes that specific historical snapshot.
 */
export async function handleDeleteFile(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { fileName, versionId } = body;

    if (!fileName) {
      return buildResponse(400, { error: 'Bad Request: "fileName" is required.' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${userId}/${safeFileName}`;

    const commandInput = {
      Bucket: BUCKET_NAME,
      Key: objectKey
    };

    if (versionId) {
      commandInput.VersionId = versionId;
    }

    const command = new DeleteObjectCommand(commandInput);
    const result = await s3Client.send(command);

    return buildResponse(200, {
      message: versionId ? `Version ${versionId} deleted permanently.` : `File marked deleted. (Soft-delete protected by S3 Versioning)`,
      deleteMarker: result.DeleteMarker || false,
      versionId: result.VersionId
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return buildResponse(500, { error: 'Failed to delete file', details: error.message });
  }
}
