import React, { useState } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  IdCard,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQC } from '../context/QCContext';

export const LoginPage = () => {
  const { employees, loginKaryawan, loginAdmin } = useQC();

  // Active Tab: 'karyawan' | 'admin'
  const [activeTab, setActiveTab] = useState('karyawan');

  // Karyawan Form State
  const [karyawanNpk, setKaryawanNpk] = useState('');
  const [karyawanNama, setKaryawanNama] = useState('');

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto fill name if NPK matches master list
  const handleNpkChange = (val) => {
    setKaryawanNpk(val);
    setErrorMsg('');
    const clean = val.trim();
    if (clean.length >= 2) {
      const matched = employees.find(e => e.npk.toUpperCase() === clean.toUpperCase());
      if (matched) {
        setKaryawanNama(matched.name);
      }
    }
  };

  // Submit Karyawan
  const handleKaryawanSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!karyawanNpk.trim() || !karyawanNama.trim()) {
      setErrorMsg('Silakan masukkan NPK dan Nama Karyawan.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = loginKaryawan(karyawanNama, karyawanNpk);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 250);
  };

  // Submit Admin
  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMsg('Username dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = loginAdmin(adminUsername, adminPassword);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.message || 'Username atau Password salah.');
      }
    }, 250);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 30%, #0c2146 0%, #051124 55%, #020712 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(9, 22, 46, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: 22,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 36px rgba(2, 132, 199, 0.15)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '38px 32px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Logo Emblem */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(2, 132, 199, 0.4)',
            marginBottom: 16
          }}>
            <span style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: 'Montserrat, sans-serif',
              lineHeight: 1
            }}>
              Q
            </span>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '0.04em'
          }}>
            Q-WORKS
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: '0.92rem',
            color: '#93c5fd',
            fontWeight: 500
          }}>
            Quality Control & Overtime System
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div style={{
          margin: '0 32px 24px',
          padding: 5,
          background: 'rgba(5, 14, 30, 0.88)',
          borderRadius: 12,
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('karyawan');
              setKaryawanNpk('');
              setKaryawanNama('');
              setErrorMsg('');
            }}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'karyawan' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeTab === 'karyawan' ? '#ffffff' : '#8ca8cf',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <User size={18} />
            <span>Karyawan Quality</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setAdminUsername('');
              setAdminPassword('');
              setErrorMsg('');
            }}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'admin' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeTab === 'admin' ? '#ffffff' : '#8ca8cf',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={18} />
            <span>Admin</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            margin: '0 32px 20px',
            padding: '11px 16px',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 10,
            color: '#fca5a5',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Content */}
        <div style={{ padding: '0 32px 34px' }}>
          {activeTab === 'karyawan' ? (
            /* Form Karyawan */
            <form onSubmit={handleKaryawanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7 }}>
                  NPK
                </label>
                <div style={{ position: 'relative' }}>
                  <IdCard size={19} color="#38bdf8" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="text"
                    placeholder="Contoh: 1747"
                    value={karyawanNpk}
                    onChange={(e) => handleNpkChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '12px 16px 12px 44px',
                      background: 'rgba(5, 14, 30, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7 }}>
                  Nama Karyawan
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={19} color="#38bdf8" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={karyawanNama}
                    onChange={(e) => { setKaryawanNama(e.target.value); setErrorMsg(''); }}
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '12px 16px 12px 44px',
                      background: 'rgba(5, 14, 30, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  height: 50,
                  padding: '13px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.15s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <span>{isSubmitting ? 'Memproses...' : 'Masuk'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* Form Admin */
            <form onSubmit={handleAdminSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7 }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={19} color="#38bdf8" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="text"
                    placeholder="Username admin"
                    value={adminUsername}
                    autoComplete="off"
                    onChange={(e) => { setAdminUsername(e.target.value); setErrorMsg(''); }}
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '12px 16px 12px 44px',
                      background: 'rgba(5, 14, 30, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.38)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={19} color="#38bdf8" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password admin"
                    value={adminPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setAdminPassword(e.target.value); setErrorMsg(''); }}
                    style={{
                      width: '100%',
                      height: 48,
                      padding: '12px 46px 12px 44px',
                      background: 'rgba(5, 14, 30, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.38)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: 13,
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  height: 50,
                  padding: '13px 20px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.15s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <span>{isSubmitting ? 'Memproses...' : 'Masuk sebagai Admin'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 14, 30, 0.65)',
          textAlign: 'center',
          fontSize: '0.80rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: '#64748b'
        }}>
          PT VELASTO INDONESIA
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

