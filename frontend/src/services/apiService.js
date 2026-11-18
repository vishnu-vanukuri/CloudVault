import { getAwsConfig } from './awsConfig.js';
import { authService } from './authService.js';
import { mockApi } from './mockAwsService.js';

/**
 * CloudVault API Gateway Client & S3 Direct Transfer Engine
 */

async function callApi(endpoint, options = {}) {
  const config = getAwsConfig();
  if (config.demoMode || !config.apiEndpoint) {
    throw new Error('API called in Demo Mode or without endpoint');
  }

  const idToken = authService.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    ...(options.headers || {})
  };

  const url = `${config.apiEndpoint.replace(/\/$/, '')}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return data;
}

export const apiService = {
  /**
   * List user files
   */
  async listFiles() {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.listFiles();
    }
    return callApi('/files', { method: 'GET' });
  },

  /**
   * Request an S3 presigned PUT URL from API Gateway/Lambda
   */
  async getPresignedUploadUrl(fileName, fileType) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.getPresignedUploadUrl(fileName, fileType);
    }
    return callApi('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType })
    });
  },

  /**
   * Upload binary file directly to S3 Presigned URL via XMLHttpRequest with progress tracking
   */
  async uploadFileToS3(uploadUrl, file, onProgress) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.uploadFileToS3(uploadUrl, file, onProgress);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ status: xhr.status, message: 'Upload completed' });
        } else {
          reject(new Error(`S3 upload failed with HTTP status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during S3 direct upload. Verify S3 bucket CORS configuration.'));
      };

      xhr.send(file);
    });
  },

  /**
   * Get an S3 presigned GET URL to download file
   */
  async getPresignedDownloadUrl(fileName, versionId) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.getPresignedDownloadUrl(fileName, versionId);
    }

    const params = new URLSearchParams({ fileName });
    if (versionId) params.append('versionId', versionId);

    return callApi(`/files/download-url?${params.toString()}`, { method: 'GET' });
  },

  /**
   * Delete file or mark with S3 Delete Marker
   */
  async deleteFile(fileName, versionId) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.deleteFile(fileName, versionId);
    }

    return callApi('/files/delete', {
      method: 'POST',
      body: JSON.stringify({ fileName, versionId })
    });
  },

  /**
   * List all versions of a specific file
   */
  async listFileVersions(fileName) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.listFileVersions(fileName);
    }

    return callApi(`/files/versions?fileName=${encodeURIComponent(fileName)}`, { method: 'GET' });
  },

  /**
   * Restore a historical version to HEAD
   */
  async restoreFileVersion(fileName, versionId) {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.restoreFileVersion(fileName, versionId);
    }

    return callApi('/files/restore', {
      method: 'POST',
      body: JSON.stringify({ fileName, versionId })
    });
  },

  /**
   * Fetch storage stats and backup tier distribution
   */
  async getStorageStats() {
    const config = getAwsConfig();
    if (config.demoMode || !config.apiEndpoint) {
      return mockApi.getStorageStats();
    }

    return callApi('/dashboard/stats', { method: 'GET' });
  }
};
