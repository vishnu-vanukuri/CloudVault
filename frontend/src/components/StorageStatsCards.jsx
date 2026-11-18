import React from 'react';
import { HardDrive, Layers, ShieldCheck, Clock, Archive, Sparkles } from 'lucide-react';

export default function StorageStatsCards({ stats, backupPolicies, loading }) {
  const totalFormatted = stats?.totalSizeFormatted || '0 B';
  const standardFormatted = stats?.standardSizeFormatted || '0 B';
  const glacierFormatted = stats?.glacierSizeFormatted || '0 B';
  const activeCount = stats?.activeFilesCount ?? 0;
  const versionsCount = stats?.historicalVersionsCount ?? 0;
  const totalObjects = stats?.totalObjectsCount ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* 1. Storage Consumption */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 border border-slate-800 shadow-sm hover:border-vault-500/40 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            S3 Storage Used
          </span>
          <div className="p-2 rounded-xl bg-vault-500/10 text-vault-400 border border-vault-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-white tracking-tight mb-2">
          {loading ? '...' : totalFormatted}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>
            Standard: {loading ? '...' : standardFormatted}
          </span>
          <span className="flex items-center text-sky-400">
            <Archive className="w-3 h-3 mr-1" />
            Glacier: {loading ? '...' : glacierFormatted}
          </span>
        </div>
      </div>

      {/* 2. S3 Versioning & Backup Health */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 border border-slate-800 shadow-sm hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Files & Versions
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-white tracking-tight mb-2">
          {loading ? '...' : `${activeCount} Files`}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="text-emerald-400 font-medium">
            + {versionsCount} Previous Revisions
          </span>
          <span className="text-[11px] text-slate-500">
            Total {totalObjects} objects
          </span>
        </div>
      </div>

      {/* 3. Security & Cloud Encryption */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 border border-slate-800 shadow-sm hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Security & Encryption
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-white tracking-tight mb-1 flex items-center">
          <span>SSE-256 (AES)</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Block Public Access: <span className="text-emerald-400 font-semibold">100% Private</span>
        </p>
      </div>

      {/* 4. Automated Archival & Lifecycle */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 border border-slate-800 shadow-sm hover:border-vault-500/40 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Lifecycle Policy
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-bold text-white tracking-tight mb-1 flex items-center">
          <span>Glacier Tiering</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            30 Days
          </span>
        </div>
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Auto-transfers older versions to Glacier cold storage
        </p>
      </div>

    </div>
  );
}
