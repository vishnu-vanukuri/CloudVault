import { ListObjectVersionsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../utils/s3Client.js';
import { buildResponse, getUserIdFromEvent } from '../utils/response.js';

/**
 * Calculates user-specific storage metrics and backup statistics.
 * Aggregates current files, previous version sizes, and backup health indicators.
 */
export async function handleGetStorageStats(event) {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return buildResponse(401, { error: 'Unauthorized: Missing or invalid user identity.' });
    }

    const prefix = `uploads/${userId}/`;

    // 1. Fetch all versions to calculate total footprint (current + non-current)
    const versionsCommand = new ListObjectVersionsCommand({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });

    const versionsResponse = await s3Client.send(versionsCommand);
    const allVersions = versionsResponse.Versions || [];
    const deleteMarkers = versionsResponse.DeleteMarkers || [];

    let totalSizeBytes = 0;
    let standardSizeBytes = 0;
    let glacierSizeBytes = 0;
    const storageClassCounts = {};

    for (const v of allVersions) {
      const size = v.Size || 0;
      totalSizeBytes += size;

      const sc = v.StorageClass || 'STANDARD';
      storageClassCounts[sc] = (storageClassCounts[sc] || 0) + 1;

      if (sc.includes('GLACIER') || sc.includes('DEEP_ARCHIVE')) {
        glacierSizeBytes += size;
      } else {
        standardSizeBytes += size;
      }
    }

    // 2. Count active current files
    const activeFilesCount = allVersions.filter(v => v.IsLatest).length;
    const historicalVersionsCount = allVersions.length - activeFilesCount;

    return buildResponse(200, {
      userId,
      storageStats: {
        totalSizeBytes,
        totalSizeFormatted: formatBytes(totalSizeBytes),
        standardSizeBytes,
        standardSizeFormatted: formatBytes(standardSizeBytes),
        glacierSizeBytes,
        glacierSizeFormatted: formatBytes(glacierSizeBytes),
        activeFilesCount,
        historicalVersionsCount,
        deleteMarkersCount: deleteMarkers.length,
        totalObjectsCount: allVersions.length + deleteMarkers.length,
        storageClassDistribution: storageClassCounts
      },
      backupPolicies: {
        versioning: 'ENABLED',
        encryption: 'SSE-S3 (AES-256)',
        publicAccess: 'BLOCKED (All 4 settings active)',
        lifecycleRules: [
          {
            target: 'Non-current file versions',
            action: 'Transition to S3 Glacier Flexible Retrieval',
            afterDays: 30
          },
          {
            target: 'Expired Object Delete Markers',
            action: 'Automated cleanup and removal',
            afterDays: 90
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return buildResponse(500, { error: 'Failed to calculate storage stats', details: error.message });
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
