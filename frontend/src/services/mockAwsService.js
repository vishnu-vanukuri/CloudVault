/**
 * CloudVault Interactive Mock AWS Engine
 * Provides realistic offline emulation of AWS Cognito, API Gateway, S3 Versioning & Lifecycle.
 * Perfect for local testing, demoing during an interview without internet, or verifying UI workflows.
 */

const MOCK_STORAGE_KEY = 'cloudvault_mock_storage_db';

// In-memory store for actual file Blobs in Demo Mode
const mockBlobStorage = new Map();

function getMockDb() {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Pre-populated demo files showcasing versions & S3 storage classes
  const initial = {
    files: [
      {
        fileName: 'quarterly_financial_report.pdf',
        size: 1048576 * 2.4, // 2.4 MB
        lastModified: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        storageClass: 'STANDARD',
        versions: [
          {
            versionId: 'v_qfr_latest_9a8b',
            isLatest: true,
            size: 1048576 * 2.4,
            lastModified: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
            storageClass: 'STANDARD',
            isDeleteMarker: false
          },
          {
            versionId: 'v_qfr_prev_4d3c',
            isLatest: false,
            size: 1048576 * 2.1,
            lastModified: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
            storageClass: 'STANDARD',
            isDeleteMarker: false
          },
          {
            versionId: 'v_qfr_initial_1f0e',
            isLatest: false,
            size: 1048576 * 1.8,
            lastModified: new Date(Date.now() - 3600 * 1000 * 24 * 35).toISOString(),
            storageClass: 'GLACIER', // Moved to Glacier by lifecycle rule (> 30 days)
            isDeleteMarker: false
          }
        ]
      },
      {
        fileName: 'hcl_interview_architecture.png',
        size: 1024 * 840, // 840 KB
        lastModified: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        storageClass: 'STANDARD',
        versions: [
          {
            versionId: 'v_arch_latest_3311',
            isLatest: true,
            size: 1024 * 840,
            lastModified: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
            storageClass: 'STANDARD',
            isDeleteMarker: false
          }
        ]
      },
      {
        fileName: 'backup_database_dump.sql.gz',
        size: 1048576 * 14.8, // 14.8 MB
        lastModified: new Date(Date.now() - 3600 * 1000 * 24 * 12).toISOString(),
        storageClass: 'STANDARD',
        versions: [
          {
            versionId: 'v_db_latest_7722',
            isLatest: true,
            size: 1048576 * 14.8,
            lastModified: new Date(Date.now() - 3600 * 1000 * 24 * 12).toISOString(),
            storageClass: 'STANDARD',
            isDeleteMarker: false
          },
          {
            versionId: 'v_db_archived_6611',
            isLatest: false,
            size: 1048576 * 13.9,
            lastModified: new Date(Date.now() - 3600 * 1000 * 24 * 45).toISOString(),
            storageClass: 'GLACIER',
            isDeleteMarker: false
          }
        ]
      }
    ]
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveMockDb(db) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}

export const mockAuth = {
  async signUp(email) {
    await new Promise(r => setTimeout(r, 600));
    return { UserConfirmed: false, CodeDeliveryDetails: { Destination: email } };
  },
  async confirmSignUp() {
    await new Promise(r => setTimeout(r, 500));
    return { success: true };
  },
  async signIn(email) {
    await new Promise(r => setTimeout(r, 700));
    return {
      email,
      idToken: `mock-jwt-token-for-${email}`,
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600 * 1000
    };
  }
};

export const mockApi = {
  async listFiles() {
    await new Promise(r => setTimeout(r, 400));
    const db = getMockDb();
    const files = db.files.map(f => ({
      key: `uploads/mock-user/${f.fileName}`,
      fileName: f.fileName,
      size: f.size,
      lastModified: f.lastModified,
      storageClass: f.storageClass,
      versionCount: f.versions.length
    }));
    return { files, count: files.length };
  },

  async getPresignedUploadUrl(fileName) {
    await new Promise(r => setTimeout(r, 300));
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return {
      uploadUrl: `https://mock-cloudvault-bucket.s3.amazonaws.com/uploads/mock-user/${safeName}?mockPresignedSignature=true`,
      key: `uploads/mock-user/${safeName}`,
      fileName: safeName,
      expiresIn: 900
    };
  },

  async uploadFileToS3(uploadUrl, file, onProgress) {
    // Simulate real presigned upload with progress updates
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          // Persist file into mock DB with S3 versioning simulation
          const db = getMockDb();
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const existing = db.files.find(f => f.fileName === safeName);
          const newVersionId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

          const newVersion = {
            versionId: newVersionId,
            isLatest: true,
            size: file.size,
            lastModified: new Date().toISOString(),
            storageClass: 'STANDARD',
            isDeleteMarker: false
          };

          if (existing) {
            existing.versions.forEach(v => { v.isLatest = false; });
            existing.versions.unshift(newVersion);
            existing.size = file.size;
            existing.lastModified = newVersion.lastModified;
          } else {
            db.files.unshift({
              fileName: safeName,
              size: file.size,
              lastModified: newVersion.lastModified,
              storageClass: 'STANDARD',
              versions: [newVersion]
            });
          }
          // Store binary blob in memory for instant local download in Demo Mode
          mockBlobStorage.set(safeName, file);
          mockBlobStorage.set(`${safeName}_${newVersionId}`, file);

          saveMockDb(db);
          resolve({ status: 200, message: 'Uploaded successfully via Mock S3 Presigned URL' });
        }
      }, 150);
    });
  },

  async getPresignedDownloadUrl(fileName, versionId) {
    await new Promise(r => setTimeout(r, 200));
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Retrieve actual stored file blob if uploaded in this session
    let blob = versionId
      ? mockBlobStorage.get(`${safeName}_${versionId}`)
      : mockBlobStorage.get(safeName);

    // If not found in memory (e.g. initial pre-seeded sample files), create simulated payload
    if (!blob) {
      const simulatedText = [
        `============================================================`,
        ` CLOUDVAULT SECURE STORAGE - DEMO SIMULATION RETRIEVAL`,
        `============================================================`,
        `File Name      : ${fileName}`,
        `Version ID     : ${versionId || 'Latest (HEAD)'}`,
        `Storage Class  : S3 Standard`,
        `Encryption     : AES-256 (SSE-S3)`,
        `Tenant Prefix  : uploads/mock-user/${safeName}`,
        `Downloaded At  : ${new Date().toISOString()}`,
        `============================================================\n`,
        `This file was retrieved from the CloudVault offline simulator.`,
        `When connected to live AWS, this URL downloads directly from`,
        `your private Amazon S3 bucket via an S3 Presigned GET URL.`
      ].join('\n');

      blob = new Blob([simulatedText], { type: 'text/plain;charset=utf-8' });
    }

    const downloadUrl = URL.createObjectURL(blob);
    return {
      downloadUrl,
      fileName: safeName,
      expiresIn: 300
    };
  },

  async deleteFile(fileName, versionId) {
    await new Promise(r => setTimeout(r, 400));
    const db = getMockDb();
    const index = db.files.findIndex(f => f.fileName === fileName);
    if (index === -1) return { message: 'File not found' };

    if (versionId) {
      // Delete specific version permanently
      db.files[index].versions = db.files[index].versions.filter(v => v.versionId !== versionId);
      if (db.files[index].versions.length === 0) {
        db.files.splice(index, 1);
      }
      saveMockDb(db);
      return { message: `Version ${versionId} permanently deleted.` };
    } else {
      // Soft delete: remove from main list
      db.files.splice(index, 1);
      saveMockDb(db);
      return { message: 'File marked deleted (S3 Delete Marker created).' };
    }
  },

  async listFileVersions(fileName) {
    await new Promise(r => setTimeout(r, 300));
    const db = getMockDb();
    const file = db.files.find(f => f.fileName === fileName);
    if (!file) {
      return { fileName, versions: [], totalVersions: 0 };
    }
    return {
      fileName,
      versions: file.versions,
      totalVersions: file.versions.length
    };
  },

  async restoreFileVersion(fileName, versionId) {
    await new Promise(r => setTimeout(r, 500));
    const db = getMockDb();
    const file = db.files.find(f => f.fileName === fileName);
    if (!file) throw new Error('File not found');

    const target = file.versions.find(v => v.versionId === versionId);
    if (!target) throw new Error('Target version not found');

    const restoredVersionId = `v_restored_${Date.now().toString(36)}`;
    file.versions.forEach(v => { v.isLatest = false; });
    const restoredVersion = {
      versionId: restoredVersionId,
      isLatest: true,
      size: target.size,
      lastModified: new Date().toISOString(),
      storageClass: 'STANDARD',
      isDeleteMarker: false
    };
    file.versions.unshift(restoredVersion);
    file.size = target.size;
    file.lastModified = restoredVersion.lastModified;

    saveMockDb(db);
    return {
      message: `Version ${versionId} successfully restored as current version.`,
      newVersionId: restoredVersionId
    };
  },

  async getStorageStats() {
    await new Promise(r => setTimeout(r, 350));
    const db = getMockDb();
    let totalSizeBytes = 0;
    let standardSizeBytes = 0;
    let glacierSizeBytes = 0;
    let totalVersions = 0;

    db.files.forEach(f => {
      f.versions.forEach(v => {
        totalSizeBytes += v.size;
        totalVersions++;
        if (v.storageClass === 'GLACIER') {
          glacierSizeBytes += v.size;
        } else {
          standardSizeBytes += v.size;
        }
      });
    });

    return {
      storageStats: {
        totalSizeBytes,
        totalSizeFormatted: formatBytes(totalSizeBytes),
        standardSizeBytes,
        standardSizeFormatted: formatBytes(standardSizeBytes),
        glacierSizeBytes,
        glacierSizeFormatted: formatBytes(glacierSizeBytes),
        activeFilesCount: db.files.length,
        historicalVersionsCount: Math.max(0, totalVersions - db.files.length),
        totalObjectsCount: totalVersions,
        storageClassDistribution: {
          STANDARD: db.files.reduce((acc, f) => acc + f.versions.filter(v => v.storageClass === 'STANDARD').length, 0),
          GLACIER: db.files.reduce((acc, f) => acc + f.versions.filter(v => v.storageClass === 'GLACIER').length, 0)
        }
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
    };
  }
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
