import React from 'react';
import { useQC } from './context/QCContext';
import { Sidebar } from './components/Sidebar';
import { DashboardAllPlants } from './components/DashboardAllPlants';
import { DashboardMolded } from './components/DashboardMolded';
import { InputDataQC } from './components/InputDataQC';
import { RekapDataQC } from './components/RekapDataQC';
import { MasterPekerja } from './components/MasterPekerja';
import { RiwayatPenginput } from './components/RiwayatPenginput';
import { TopNavbar } from './components/TopNavbar';
import { LoginPage } from './components/LoginPage';
import {
  SettingsModal,
  NotificationModal
} from './components/Modals';
import {
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export const App = () => {
  const { currentView, setCurrentView, toast, currentUser } = useQC();

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return (
      <div className="app-container auth-wrapper">
        <LoginPage />

        {/* TOAST ALERTS ON LOGIN PAGE */}
        {toast && (
          <div className="toast-container">
            <div
              className="toast-box"
              style={{
                borderLeftColor:
                  toast.type === 'success'
                    ? 'var(--accent-green)'
                    : toast.type === 'warning'
                    ? 'var(--accent-yellow)'
                    : toast.type === 'danger'
                    ? 'var(--accent-red)'
                    : 'var(--accent-cyan)'
              }}
            >
              {toast.type === 'success' && <CheckCircle size={18} color="#10b981" />}
              {toast.type === 'warning' && <AlertCircle size={18} color="#f59e0b" />}
              {toast.type === 'danger' && <AlertCircle size={18} color="#ef4444" />}
              {toast.type === 'info' && <Info size={18} color="#38bdf8" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        {/* TOP SYSTEM NAVBAR */}
        <TopNavbar />

        {/* ACTIVE PAGE VIEW */}
        <main>
          {currentView === 'input-qc' ? (
            <InputDataQC />
          ) : currentView === 'rekap-data' ? (
            <RekapDataQC />
          ) : currentView === 'master-pekerja' ? (
            <MasterPekerja />
          ) : currentView === 'riwayat-input' ? (
            <RiwayatPenginput />
          ) : currentView === 'all-plants' ? (
            <DashboardAllPlants />
          ) : (
            <DashboardMolded />
          )}
        </main>
      </div>



      {/* MODAL DIALOGS */}
      <SettingsModal />
      <NotificationModal />

      {/* TOAST ALERTS */}
      {toast && (
        <div className="toast-container">
          <div
            className="toast-box"
            style={{
              borderLeftColor:
                toast.type === 'success'
                  ? 'var(--accent-green)'
                  : toast.type === 'warning'
                  ? 'var(--accent-yellow)'
                  : toast.type === 'danger'
                  ? 'var(--accent-red)'
                  : 'var(--accent-cyan)'
            }}
          >
            {toast.type === 'success' && <CheckCircle size={18} color="#10b981" />}
            {toast.type === 'warning' && <AlertCircle size={18} color="#f59e0b" />}
            {toast.type === 'danger' && <AlertCircle size={18} color="#ef4444" />}
            {toast.type === 'info' && <Info size={18} color="#38bdf8" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
