import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Trash2, CheckCircle, AlertTriangle, FileCode, Clock, Download } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export default function VersionHistoryModal({ fileName, isOpen, onClose, onVersionRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && fileName) {
      loadVersions();
    }
  }, [isOpen, fileName]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.listFileVersions(fileName);
      setVersions(data.versions || []);
    } catch (err) {
      setError(err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage('');
      const res = await apiService.restoreFileVersion(fileName, versionId);
      setSuccessMessage(res.message || 'Version successfully restored!');
      await loadVersions();
      if (onVersionRestored) onVersionRestored();
    } catch (err) {
      setError(err.message || 'Failed to restore version');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadVersion = async (versionId) => {
    try {
      setActionLoading(true);
      const res = await apiService.getPresignedDownloadUrl(fileName, versionId);
      if (res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.download = res.fileName || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm(`Permanently delete version ${versionId}? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await apiService.deleteFile(fileName, versionId);
      await loadVersions();
      if (onVersionRestored) onVersionRestored();
    } catch (err) {
      setError(err.message || 'Failed to delete version');
    } finally {
      setActionLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Version History & Recovery</h3>
              <p className="text-xs text-slate-400 max-w-[340px] truncate">
                File: <span className="font-mono text-purple-300 font-semibold">{fileName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Versions Timeline List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading Amazon S3 version metadata...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No historical versions recorded for this file yet.
            </div>
          ) : (
            versions.map((v, index) => (
              <div
                key={v.versionId || index}
                className={`p-4 rounded-xl border transition ${
                  v.isLatest
                    ? 'bg-slate-800/80 border-vault-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  
                  {/* Left: Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        Version ID: {v.versionId ? v.versionId.substring(0, 16) + '...' : 'null'}
                      </span>
                      {v.isLatest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Current HEAD
                        </span>
                      )}
                      {v.isDeleteMarker && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Delete Marker
                        </span>
                      )}
                      {v.storageClass && v.storageClass !== 'STANDARD' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          {v.storageClass}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {formatDate(v.lastModified)}
                      </span>
                      <span>&bull;</span>
                      <span>Size: {formatSize(v.size)}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2">
                    {!v.isDeleteMarker && (
                      <button
                        onClick={() => handleDownloadVersion(v.versionId)}
                        disabled={actionLoading}
                        className="p-1.5 text-slate-400 hover:text-vault-300 hover:bg-vault-500/10 rounded-lg border border-transparent hover:border-vault-500/30 transition"
                        title="Download this specific historical version"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {!v.isLatest && !v.isDeleteMarker && (
                      <button
                        onClick={() => handleRestore(v.versionId)}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-vault-300 hover:text-white bg-vault-500/10 hover:bg-vault-600 border border-vault-500/30 rounded-lg transition"
                        title="Restore this version to be the current file"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVersion(v.versionId)}
                      disabled={actionLoading}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Permanently remove this version"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Amazon S3 Versioning active.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
