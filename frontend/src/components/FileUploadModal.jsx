import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileText, ArrowUpRight } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(5);
      setStatusMessage('Requesting secure Presigned S3 URL from API Gateway & Lambda...');

      // 1. Get Presigned PUT URL
      const { uploadUrl } = await apiService.getPresignedUploadUrl(file.name, file.type);

      setStatusMessage('Presigned URL acquired. Uploading directly to Amazon S3...');
      setProgress(15);

      // 2. Direct browser-to-S3 binary PUT upload
      await apiService.uploadFileToS3(uploadUrl, file, (percent) => {
        // Map 0-100% to 15-95%
        const mapped = Math.round(15 + (percent * 0.8));
        setProgress(mapped);
      });

      setProgress(100);
      setStatusMessage('Upload complete! Object encrypted with AES-256 and versioned.');

      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setProgress(0);
        setStatusMessage('');
        onUploadSuccess();
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to complete upload');
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-vault-500/10 text-vault-400 border border-vault-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Upload File to CloudVault</h3>
              <p className="text-xs text-slate-400">Direct S3 Multi-Part / Presigned Transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              file
                ? 'border-vault-500/60 bg-vault-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <FileText className="w-8 h-8 text-vault-400" />
                <div className="text-left">
                  <div className="font-semibold text-sm text-white max-w-[260px] truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatSize(file.size)} &bull; {file.type || 'binary/stream'}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">
                  Click to browse or drag & drop file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Protected with SSE-256 Encryption & S3 Automated Versioning
                </p>
              </div>
            )}
          </div>

          {/* Progress & Status */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{statusMessage}</span>
                <span className="text-vault-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-vault-500 to-vault-300 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Educational Note */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-start space-x-2">
            <ArrowUpRight className="w-4 h-4 text-aws-orange flex-shrink-0 mt-0.5" />
            <span>
              <strong>Interview Highlight:</strong> The file transfers directly between your browser and Amazon S3 via a temporary Presigned URL. It never transits through Lambda RAM, avoiding compute bottlenecks and AWS payload limits.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow transition"
          >
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>

      </div>
    </div>
  );
}
