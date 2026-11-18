import { ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Lists all previous and current versions of a file from Amazon S3.
 * Essential for ransomware recovery, audit history, and point-in-time restore.
 */
export async function handleListFileVersions(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    let fileName = event.queryStringParameters?.fileName;
    if (!fileName && event.body) {
      const parsed = JSON.parse(event.body);
      fileName = parsed.fileName;
    }

    if (!fileName) {
      return buildResponse(400, { error: 'Bad Request: "fileName" is required.' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${userId}/${safeFileName}`;

    const command = new ListObjectVersionsCommand({
      Bucket: BUCKET_NAME,
      Prefix: objectKey
    });

    const response = await s3Client.send(command);

    // Collect versions
    const versions = (response.Versions || [])
      .filter(v => v.Key === objectKey)
      .map(v => ({
        versionId: v.VersionId,
        isLatest: v.IsLatest,
        lastModified: v.LastModified,
        size: v.Size,
        storageClass: v.StorageClass || 'STANDARD',
        isDeleteMarker: false
      }));

    // Collect delete markers
    const deleteMarkers = (response.DeleteMarkers || [])
      .filter(dm => dm.Key === objectKey)
      .map(dm => ({
        versionId: dm.VersionId,
        isLatest: dm.IsLatest,
        lastModified: dm.LastModified,
        size: 0,
        isDeleteMarker: true
      }));

    const allHistory = [...versions, ...deleteMarkers].sort(
      (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
    );

    return buildResponse(200, {
      fileName: safeFileName,
      versions: allHistory,
      totalVersions: allHistory.length
    });
  } catch (error) {
    console.error('Error listing file versions:', error);
    return buildResponse(500, { error: 'Failed to list versions', details: error.message });
  }
}
