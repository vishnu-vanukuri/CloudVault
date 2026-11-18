import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Generates an S3 Presigned GET URL for secure, time-limited file download.
 * Adds Content-Disposition header so the browser prompts a file download.
 */
export async function handleGetPresignedDownloadUrl(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    // Support query param or POST body
    let fileName = event.queryStringParameters?.fileName;
    let versionId = event.queryStringParameters?.versionId;

    if (!fileName && event.body) {
      const parsed = JSON.parse(event.body);
      fileName = parsed.fileName;
      versionId = parsed.versionId;
    }

    if (!fileName) {
      return buildResponse(400, { error: 'Bad Request: "fileName" is required.' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${userId}/${safeFileName}`;

    const commandInput = {
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`
    };

    if (versionId) {
      commandInput.VersionId = versionId;
    }

    const command = new GetObjectCommand(commandInput);
    // Presigned download URL valid for 5 minutes (300 seconds)
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return buildResponse(200, {
      downloadUrl,
      fileName: safeFileName,
      expiresIn: 300
    });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    return buildResponse(500, { error: 'Failed to generate download URL', details: error.message });
  }
}
