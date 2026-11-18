import { handleGetPresignedUploadUrl } from './handlers/getPresignedUploadUrl.js';
import { handleListUserFiles } from './handlers/listUserFiles.js';
import { handleGetPresignedDownloadUrl } from './handlers/getPresignedDownloadUrl.js';
import { handleDeleteFile } from './handlers/deleteFile.js';
import { handleListFileVersions } from './handlers/listFileVersions.js';
import { handleRestoreFileVersion } from './handlers/restoreFileVersion.js';
import { handleGetStorageStats } from './handlers/getStorageStats.js';
import { buildResponse } from './utils/response.js';

/**
 * CloudVault Unified Serverless API Router
 * Dispatches API Gateway REST requests to appropriate business logic handlers.
 */
export async function handler(event, context) {
  // Prevent Lambda waiting for empty Node event loop
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path || '';

  console.log(`[CloudVault API] ${httpMethod} ${path}`, {
    authorizerSub: event?.requestContext?.authorizer?.claims?.sub,
    sourceIp: event?.requestContext?.identity?.sourceIp
  });

  // Handle CORS pre-flight OPTIONS request
  if (httpMethod === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS OK' });
  }

  try {
    // Route matching
    if (path.endsWith('/files/upload-url') && (httpMethod === 'POST')) {
      return await handleGetPresignedUploadUrl(event);
    }

    if (path.endsWith('/files/download-url') && (httpMethod === 'GET' || httpMethod === 'POST')) {
      return await handleGetPresignedDownloadUrl(event);
    }

    if (path.endsWith('/files/versions') && (httpMethod === 'GET' || httpMethod === 'POST')) {
      return await handleListFileVersions(event);
    }

    if (path.endsWith('/files/restore') && (httpMethod === 'POST')) {
      return await handleRestoreFileVersion(event);
    }

    if (path.endsWith('/files/delete') && (httpMethod === 'POST' || httpMethod === 'DELETE')) {
      return await handleDeleteFile(event);
    }

    if (path.endsWith('/files') && httpMethod === 'GET') {
      return await handleListUserFiles(event);
    }

    if (path.endsWith('/files') && httpMethod === 'DELETE') {
      return await handleDeleteFile(event);
    }

    if (path.endsWith('/dashboard/stats') && httpMethod === 'GET') {
      return await handleGetStorageStats(event);
    }

    // Health check route
    if (path.endsWith('/health') || path === '/' || path === '') {
      return buildResponse(200, {
        status: 'ONLINE',
        system: 'CloudVault AWS Serverless Engine',
        timestamp: new Date().toISOString()
      });
    }

    return buildResponse(404, {
      error: 'Not Found',
      message: `No handler registered for ${httpMethod} ${path}`
    });
  } catch (error) {
    console.error('[CloudVault API Fatal Error]:', error);
    return buildResponse(500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
