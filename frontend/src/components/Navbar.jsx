import React from 'react';
import { Cloud, Shield, Settings, LogOut, User, Zap, Database } from 'lucide-react';

export default function Navbar({
  user,
  onSignOut,
  onOpenAuth,
  onOpenConfig,
  isDemoMode,
  isConfigured
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-vault-600 via-vault-500 to-aws-orange p-0.5 shadow-lg shadow-vault-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-vault-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">CloudVault</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange border border-aws-orange/30">
                AWS Serverless
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Secure Cloud Storage & Automated Backup System
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-3">
          
          {/* Mode Badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all">
            {isDemoMode ? (
              <span className="flex items-center text-amber-400 border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5 mr-1" />
                Demo Mode (Mock AWS SDK)
              </span>
            ) : isConfigured ? (
              <span className="flex items-center text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <Database className="w-3.5 h-3.5 mr-1" />
                Live AWS Connected
              </span>
            ) : (
              <span className="flex items-center text-sky-400 border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
                <Shield className="w-3.5 h-3.5 mr-1" />
                AWS Setup Pending
              </span>
            )}
          </div>

          {/* Config / AWS Settings Button */}
          <button
            onClick={onOpenConfig}
            title="Configure AWS Credentials & Region"
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">AWS Config</span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                <div className="w-6 h-6 rounded-full bg-vault-600/30 border border-vault-500/40 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-vault-300" />
                </div>
                <span className="text-xs text-slate-200 font-medium max-w-[140px] truncate">
                  {user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 rounded-lg shadow-md transition"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
