import React, { useState } from 'react';
import { X, Settings, CheckCircle2, AlertCircle, RefreshCw, Zap, Server, Shield } from 'lucide-react';
import { getAwsConfig, saveAwsConfig } from '../services/awsConfig.js';

export default function ConfigDrawer({ isOpen, onClose, onConfigSaved }) {
  const current = getAwsConfig();
  const [region, setRegion] = useState(current.region || 'us-east-1');
  const [userPoolId, setUserPoolId] = useState(current.userPoolId || '');
  const [clientId, setClientId] = useState(current.clientId || '');
  const [apiEndpoint, setApiEndpoint] = useState(current.apiEndpoint || '');
  const [demoMode, setDemoMode] = useState(Boolean(current.demoMode));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAwsConfig({
      region,
      userPoolId,
      clientId,
      apiEndpoint,
      demoMode
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onConfigSaved();
      onClose();
    }, 600);
  };

  const handleTestConnection = async () => {
    if (!apiEndpoint) {
      setTestResult({ success: false, message: 'Please provide an API Endpoint URL first.' });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const start = Date.now();
      const cleanUrl = apiEndpoint.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/health`);
      const latency = Date.now() - start;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: true,
          message: `Connected successfully! (${latency}ms) - Server: ${data.system || 'Online'}`
        });
      } else {
        setTestResult({
          success: false,
          message: `API Gateway returned HTTP ${res.status}: ${res.statusText}`
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message}. Check CORS or endpoint URL.`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-vault-500/10 text-vault-400 border border-vault-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AWS Stack Settings</h3>
              <p className="text-xs text-slate-400">Configure CloudVault Serverless Endpoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200">Interactive Demo Mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-2">
            Simulates AWS S3 Presigned URLs, Versioning, and Cognito offline without incurring any AWS charges or needing live credentials.
          </p>
        </div>

        {/* AWS Live Configuration Fields */}
        <div className="mt-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              AWS Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cognito User Pool ID
            </label>
            <input
              type="text"
              value={userPoolId}
              onChange={(e) => setUserPoolId(e.target.value)}
              placeholder="e.g. us-east-1_abc123XYZ"
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cognito App Client ID (no secret)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 7k8p9m0n1o2p3q4r5s6t"
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              API Gateway Endpoint URL
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev"
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-vault-500 font-mono"
            />
          </div>

          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={testing || !apiEndpoint}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Server className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-vault-400' : ''}`} />
            <span>{testing ? 'Pinging /health...' : 'Test API Gateway Connection'}</span>
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {saveSuccess && (
            <div className="text-center text-xs text-emerald-400 font-semibold mb-2">
              Settings updated successfully!
            </div>
          )}
          <button
            onClick={handleSave}
            className="w-full py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-vault-400 to-vault-300 hover:brightness-110 rounded-xl shadow transition"
          >
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
