import React, { useState } from 'react';
import {
  RotateCw,
  Maximize2,
  Minimize2,
  LogOut,
  User,
  ShieldCheck,
  IdCard,
  Plus,
  Home
} from 'lucide-react';
import { useQC } from '../context/QCContext';

export const TopNavbar = () => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    logout,
    getDefaultDashboardView
  } = useQC();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar (Logout)?')) {
      logout();
    }
  };

  // Get dynamic title based on view
  const getViewTitle = () => {
    switch (currentView) {
      case 'all-plants':
        return 'Dashboard Over Time';
      case 'hose':
        return 'Dashboard Over Time - Plant Hose';
      case 'molded':
        return 'Dashboard Over Time - Plant Molded';
      case 'subcont':
        return 'Dashboard Over Time - Plant Subcont';
      case 'mixing':
      case 'lab-mixing':
        return 'Dashboard Over Time - Plant Mixing';
      case 'rvi':
        return 'Dashboard Over Time - Plant RVI';
      case 'qre':
        return 'Dashboard Over Time - Plant QRE';
      case 'input-qc':
        return 'Input Data QC';
      case 'rekap-data':
        return 'Rekap Data QC';
      case 'master-pekerja':
        return 'Master Data Pekerja';
      case 'riwayat-input':
        return 'Riwayat & Log Penginput Data QC';
      default:
        return 'Dashboard Over Time';
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="top-system-navbar">
      {/* Left side: Page Title */}
      <div className="top-nav-left">
        <h1 className="top-nav-page-title">{getViewTitle()}</h1>
      </div>

      {/* Right side: User Badge, Refresh, Fullscreen, Logout */}
      <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        
        {/* User Role Badge */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '5px 12px 5px 6px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
            }}
            title={isAdmin ? 'Role: Admin (Akses Penuh: Tambah, Edit, Hapus)' : `Role: Karyawan (Akses: Hanya Tambah)`}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #00d2ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.80rem'
              }}
            >
              {isAdmin ? <ShieldCheck size={16} /> : <User size={15} />}
            </div>

            {/* Name & Role Text */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.82rem' }}>
                  {currentUser.name}
                </span>
                {currentUser.npk && (
                  <span style={{
                    color: '#38bdf8',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    [{currentUser.npk}]
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#7dd3fc',
                  letterSpacing: '0.02em'
                }}
              >
                {isAdmin ? 'Admin (Full Access)' : 'Karyawan (Input Only)'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Input Data Button */}
        <button
          onClick={() => setCurrentView(currentView === 'input-qc' ? (getDefaultDashboardView ? getDefaultDashboardView() : 'all-plants') : 'input-qc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            background: currentView === 'input-qc' ? 'rgba(56, 189, 248, 0.15)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: currentView === 'input-qc' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: currentView === 'input-qc' ? 'none' : '0 2px 10px rgba(2, 132, 199, 0.35)',
            transition: 'all 0.15s ease'
          }}
          title={currentView === 'input-qc' ? 'Kembali ke Dashboard' : 'Input Data Lembur QC'}
        >
          {currentView === 'input-qc' ? <Home size={15} /> : <Plus size={16} strokeWidth={2.5} />}
          <span>{currentView === 'input-qc' ? 'Dashboard' : 'Input Data'}</span>
        </button>

        {/* Refresh Button */}
        <button
          className={`top-nav-pill-btn refresh-pill ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          title="Refresh Data"
        >
          <RotateCw size={15} className={isRefreshing ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>

        {/* Fullscreen Button */}
        <button
          className="top-nav-pill-btn fullscreen-pill"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span>Fullscreen</span>
        </button>

        {/* Logout Button */}
        <button
          className="top-nav-pill-btn"
          onClick={handleLogoutClick}
          title="Keluar / Logout Akun"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.12)'
          }}
        >
          <LogOut size={15} color="#f87171" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
