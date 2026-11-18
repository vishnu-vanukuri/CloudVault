import React, { useState } from 'react';
import { User, Lock, Mail, KeyRound, X, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { authService } from '../services/authService.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signIn(email, password);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      if (err.message?.includes('UserNotConfirmedException')) {
        setInfo('Your email is not verified yet. Please enter the verification code sent to your email.');
        setTab('confirm');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await authService.signUp(email, password);
      setInfo('Account created! Enter the 6-digit confirmation code sent to your email.');
      setTab('confirm');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await authService.confirmSignUp(email, confirmCode);
      setInfo('Email verified successfully! You can now log in.');
      setTab('signin');
    } catch (err) {
      setError(err.message || 'Invalid confirmation code');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const demoEmail = 'demo-candidate@hcl-interview.aws';
      const user = await authService.signIn(demoEmail, 'CloudVault@2026');
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-vault-500/10 text-vault-400 border border-vault-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {tab === 'signin' && 'Sign In to CloudVault'}
                {tab === 'signup' && 'Create CloudVault Account'}
                {tab === 'confirm' && 'Verify Cognito Email'}
              </h3>
              <p className="text-xs text-slate-400">AWS Cognito Secure JWT Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {tab !== 'confirm' && (
          <div className="flex border-b border-slate-800 mt-4">
            <button
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition ${
                tab === 'signin'
                  ? 'border-vault-500 text-vault-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition ${
                tab === 'signup'
                  ? 'border-vault-500 text-vault-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mt-4 p-3 rounded-xl bg-vault-500/10 border border-vault-500/30 flex items-start space-x-2 text-vault-300 text-xs">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="mt-4">
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 rounded-xl shadow transition"
              >
                {loading ? 'Authenticating with Cognito...' : 'Sign In'}
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (Min 8 chars, 1 uppercase, 1 number)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. CloudVault#2026"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 rounded-xl shadow transition"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          )}

          {tab === 'confirm' && (
            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter 6-digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Check your inbox for code from AWS Cognito.</p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-xs font-bold text-slate-950 bg-vault-400 hover:bg-vault-300 rounded-xl transition"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={handleQuickDemoLogin}
              type="button"
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Quick Demo Sign In (Interview Sandbox)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
