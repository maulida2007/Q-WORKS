import React, { useState } from 'react';
import {
  X,
  Settings,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { useQC } from '../context/QCContext';

// 1. SETTINGS MODAL
export const SettingsModal = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    targetJamOT,
    setTargetJamOT,
    resetToDefaultData,
    showToast
  } = useQC();

  const [tempTarget, setTempTarget] = useState(targetJamOT || 50);

  if (!showSettingsModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} />
            <span>Pengaturan Sistem Q-WORKS Overtime</span>
          </div>
          <button className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Target Batas Jam Overtime Bulanan</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                step="5"
                min="10"
                max="500"
                className="form-input"
                value={tempTarget}
                onChange={(e) => setTempTarget(parseFloat(e.target.value) || 50)}
              />
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>Jam</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Batas target jam lembur yang ditampilkan pada garis merah putus-putus di grafik bulanan (Default: 50 Jam).
            </span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 8 }}>
            <label className="form-label" style={{ color: '#ef4444' }}>Reset Data Simulasi</label>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
              Kembalikan semua metriks dan data lembur ke data awal pabrik.
            </p>
            <button
              className="btn-settings"
              style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
              onClick={() => {
                resetToDefaultData();
                setShowSettingsModal(false);
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Data ke Awal Pabrik</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-settings"
            onClick={() => setShowSettingsModal(false)}
          >
            Batal
          </button>
          <button
            className="btn-export"
            onClick={() => {
              setTargetJamOT(tempTarget);
              showToast(`Target Jam Overtime diperbarui menjadi ${tempTarget} Jam`, 'success');
              setShowSettingsModal(false);
            }}
          >
            <Check size={16} />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. NOTIFICATION MODAL
export const NotificationModal = () => {
  const {
    showNotificationModal,
    setShowNotificationModal,
    notifications,
    setNotifications
  } = useQC();

  if (!showNotificationModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Bell size={20} />
            <span>Pemberitahuan & Alert Lembur</span>
          </div>
          <button className="modal-close-btn" onClick={() => setShowNotificationModal(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {notifications.map(n => (
            <div
              key={n.id}
              style={{
                backgroundColor: '#131f38',
                borderLeft: `4px solid ${n.type === 'danger' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#38bdf8'}`,
                padding: '12px 14px',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{n.title}</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{n.time}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{n.message}</p>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button
            className="btn-settings"
            onClick={() => {
              setNotifications(notifications.map(n => ({ ...n, unread: false })));
              setShowNotificationModal(false);
            }}
          >
            Tandai Semua Dibaca
          </button>
        </div>
      </div>
    </div>
  );
};
