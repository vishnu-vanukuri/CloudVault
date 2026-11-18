import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  FileArchive,
  FileCode2,
  File,
  Download,
  Trash2,
  History,
  Search,
  ExternalLink,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { apiService } from '../services/apiService.js';

export default function FileTable({
  files,
  loading,
  onRefresh,
  onOpenUpload,
  onViewVersions,
  onFileDeleted
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-vault-400" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'yaml', 'yml', 'html', 'css', 'sql'].includes(ext)) {
      return <FileCode2 className="w-5 h-5 text-emerald-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const handleDownload = async (fileName) => {
    try {
      setActionLoading(true);
      const res = await apiService.getPresignedDownloadUrl(fileName);
      if (res.downloadUrl) {
        // Trigger browser download via presigned GET link or Object URL
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

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Delete "${fileName}"? (S3 Versioning will preserve previous snapshots)`)) {
      return;
    }

    try {
      setActionLoading(true);
      await apiService.deleteFile(fileName);
      if (onFileDeleted) onFileDeleted();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
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
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filtered = files.filter(f =>
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      
      {/* Table Action Bar */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files by name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-vault-500 transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition"
            title="Refresh File List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-vault-400' : ''}`} />
          </button>
          
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4 rotate-180" />
            <span>Upload New File</span>
          </button>
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">File Name</th>
              <th className="px-6 py-3.5">Storage Class</th>
              <th className="px-6 py-3.5">Size</th>
              <th className="px-6 py-3.5">Last Modified</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-vault-400" />
                    <span>Synchronizing with Amazon S3...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-semibold mb-1">No files stored yet</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Upload your first document or asset using S3 Presigned URLs.
                  </p>
                  <button
                    onClick={onOpenUpload}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-vault-400 hover:bg-vault-300 rounded-lg transition"
                  >
                    Upload File Now
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((file) => (
                <tr
                  key={file.key || file.fileName}
                  className="hover:bg-slate-800/40 transition group"
                >
                  {/* File Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                        {getFileIcon(file.fileName)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 group-hover:text-vault-300 transition">
                          {file.fileName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          uploads/{file.fileName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Storage Class */}
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                      {file.storageClass || 'STANDARD'}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                    {formatSize(file.size)}
                  </td>

                  {/* Modified */}
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {formatDate(file.lastModified)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      
                      {/* Versions */}
                      <button
                        onClick={() => onViewVersions(file.fileName)}
                        className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg border border-transparent hover:border-purple-500/30 transition"
                        title="View S3 Version History & Restore"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleDownload(file.fileName)}
                        disabled={actionLoading}
                        className="p-2 text-slate-400 hover:text-vault-300 hover:bg-vault-500/10 rounded-lg border border-transparent hover:border-vault-500/30 transition"
                        title="Download via S3 Presigned URL"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(file.fileName)}
                        disabled={actionLoading}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition"
                        title="Delete file (Soft delete protected by Versioning)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
