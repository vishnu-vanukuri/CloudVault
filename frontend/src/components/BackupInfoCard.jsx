import React from 'react';
import { ShieldCheck, RefreshCw, Archive, Activity, Lock, Cpu, CheckCircle2 } from 'lucide-react';

export default function BackupInfoCard() {
  const highlights = [
    {
      title: 'Presigned URL Direct S3 Transfer',
      desc: 'Browser uploads directly to private S3 bucket. Lambda execution stays <200ms with zero RAM file buffering.',
      icon: Cpu,
      color: 'text-vault-400 bg-vault-500/10 border-vault-500/20'
    },
    {
      title: 'S3 Automated Versioning',
      desc: 'Accidental file deletions and ransomware overwrites are fully mitigated. Older snapshots can be restored with 1 click.',
      icon: RefreshCw,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Automated Lifecycle Archival',
      desc: 'Lifecycle rules automatically transition non-current versions to S3 Glacier after 30 days, slashing storage costs.',
      icon: Archive,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Zero-Trust Multi-Tenant Isolation',
      desc: 'Cognito JWT subject ID (`sub`) scopes all S3 keys (`uploads/{sub}/*`). Users can never access or list another tenant’s files.',
      icon: Lock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'CloudWatch & CloudTrail Auditing',
      desc: 'API Gateway latencies, Lambda invocation logs, S3 bucket byte metrics, and management audit trails recorded in real-time.',
      icon: Activity,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Enterprise Encryption & Compliance',
      desc: 'Enforces AES-256 Server-Side Encryption (SSE-S3) on all objects at rest and TLS 1.3 in transit.',
      icon: ShieldCheck,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 p-6 shadow-xl mb-8">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-lg text-white tracking-tight">
              Cloud Architecture & Security Governance
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-vault-500/15 text-vault-400 border border-vault-500/30 uppercase tracking-wider">
              HCL Interview Focus
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engineered adhering strictly to AWS Well-Architected Framework pillars: Security, Cost Optimization & Reliability.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-3 mb-2.5">
                <div className={`p-2 rounded-xl border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">{item.title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
