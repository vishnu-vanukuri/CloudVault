import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import StorageStatsCards from './components/StorageStatsCards.jsx';
import FileTable from './components/FileTable.jsx';
import BackupInfoCard from './components/BackupInfoCard.jsx';
import FileUploadModal from './components/FileUploadModal.jsx';
import VersionHistoryModal from './components/VersionHistoryModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import ConfigDrawer from './components/ConfigDrawer.jsx';

import { authService } from './services/authService.js';
import { apiService } from './services/apiService.js';
import { getAwsConfig, isConfigured } from './services/awsConfig.js';


export default function App() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [backupPolicies, setBackupPolicies] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [versionTargetFile, setVersionTargetFile] = useState(null);

  const [awsState, setAwsState] = useState({
    configured: isConfigured(),
    demoMode: getAwsConfig().demoMode
  });

  useEffect(() => {
    // Check initial auth state
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    refreshConfigState();
    loadDashboardData();
  }, []);

  const refreshConfigState = () => {
    const cfg = getAwsConfig();
    setAwsState({
      configured: isConfigured(),
      demoMode: Boolean(cfg.demoMode)
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [filesRes, statsRes] = await Promise.allSettled([
        apiService.listFiles(),
        apiService.getStorageStats()
      ]);

      if (filesRes.status === 'fulfilled') {
        setFiles(filesRes.value.files || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.storageStats || null);
        setBackupPolicies(statsRes.value.backupPolicies || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    setUser(null);
    loadDashboardData();
  };

  const handleAuthSuccess = (newUser) => {
    setUser(newUser);
    loadDashboardData();
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Navigation */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        isDemoMode={awsState.demoMode}
        isConfigured={awsState.configured}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Storage & Backup Stats Cards */}
        <StorageStatsCards
          stats={stats}
          backupPolicies={backupPolicies}
          loading={loading}
        />

        {/* 2. Files Management Table */}
        <FileTable
          files={files}
          loading={loading}
          onRefresh={loadDashboardData}
          onOpenUpload={() => setIsUploadOpen(true)}
          onViewVersions={(fileName) => setVersionTargetFile(fileName)}
          onFileDeleted={loadDashboardData}
        />

        {/* 3. Security & Cloud Governance Architecture Card */}
        <BackupInfoCard />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CloudVault &copy; 2026 &bull; Secure Cloud Storage and Automated Backup System
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Amazon S3</span>
            <span>&bull;</span>
            <span>AWS Lambda</span>
            <span>&bull;</span>
            <span>Amazon Cognito</span>
            <span>&bull;</span>
            <span>API Gateway</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadDashboardData}
      />

      <VersionHistoryModal
        fileName={versionTargetFile}
        isOpen={Boolean(versionTargetFile)}
        onClose={() => setVersionTargetFile(null)}
        onVersionRestored={loadDashboardData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigSaved={() => {
          refreshConfigState();
          loadDashboardData();
        }}
      />

    </div>
  );
}
