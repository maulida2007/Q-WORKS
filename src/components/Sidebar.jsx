import React, { useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  Box,
  Truck,
  Cog,
  Zap,
  Layers,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ClipboardPenLine,
  FileSpreadsheet,
  Users,
  Sparkles,
  History,
  ShieldCheck
} from 'lucide-react';
import { useQC } from '../context/QCContext';

export const Sidebar = () => {
  const {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentUser,
    getAllowedDashboards,
    getDefaultDashboardView
  } = useQC();
  const [overtimeOpen, setOvertimeOpen] = useState(true);

  const subDashboardIcons = {
    'all-plants': Globe,
    'hose': Layers,
    'molded': Box,
    'subcont': Cog,
    'lab-mixing': FlaskConical,
    'mixing': FlaskConical,
    'rvi': Truck,
    'qre': ShieldCheck,
  };

  const allowedList = getAllowedDashboards ? getAllowedDashboards() : [];
  const subDashboards = allowedList.map(item => ({
    ...item,
    icon: subDashboardIcons[item.id] || Box
  }));

  const overtimeItems = [
    { id: 'input-qc', label: 'Input Data', icon: ClipboardPenLine },
    { id: 'rekap-data', label: 'Rekap Overtime', icon: FileSpreadsheet },
    { id: 'master-pekerja', label: 'Master Pekerja', icon: Users },
    ...(currentUser?.role === 'admin' ? [{ id: 'riwayat-input', label: 'Riwayat Penginput', icon: History }] : [])
  ];

  const allowedDashboardIds = allowedList.map(d => d.id);
  const isDashboardActive = allowedDashboardIds.includes(currentView);

  return (
    <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header Brand */}
      <div className="sidebar-brand-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden' }}>
          <div
            className="sidebar-brand-logo-glow"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ cursor: 'pointer' }}
            title={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          >
            <div className="sidebar-brand-icon-circle">
              <span className="sidebar-brand-q">Q</span>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div
              className="sidebar-brand-text-block"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ cursor: 'pointer' }}
              title="Tutup Sidebar"
            >
              <div className="sidebar-brand-title">Q-WORKS</div>
              <div className="sidebar-brand-subtitle">Quality Control</div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Navigation Items */}
      <div className="sidebar-content">
        
        {/* Main Dashboard Primary Tab */}
        <div
          className={`sidebar-nav-item primary-dashboard ${isDashboardActive ? 'active' : ''}`}
          onClick={() => setCurrentView(getDefaultDashboardView ? getDefaultDashboardView() : 'all-plants')}
          title={currentUser?.role === 'admin' ? 'Dashboard Utama (All Plants)' : `Dashboard ${currentUser?.plant || ''}`}
        >
          <LayoutDashboard size={20} />
          {!sidebarCollapsed && <span className="nav-label">Dashboard</span>}
        </div>

        {/* Sub-Dashboard Items */}
        <div className="sidebar-subnav-list">
          {subDashboards.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <div
                key={item.id}
                className={`sidebar-subnav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="subnav-left">
                  <Icon size={18} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {isActive && !sidebarCollapsed && (
                  <span className="active-dot-indicator" />
                )}
              </div>
            );
          })}
        </div>

        {/* Section: Overtime Dropdown */}
        <div className="sidebar-accordion-group">
          <div
            className="sidebar-accordion-header"
            onClick={() => setOvertimeOpen(!overtimeOpen)}
          >
            <div className="accordion-left">
              <ClipboardPenLine size={19} />
              {!sidebarCollapsed && <span>Overtime</span>}
            </div>
            {!sidebarCollapsed && (
              overtimeOpen ? <ChevronUp size={17} color="#8CC1E9" /> : <ChevronDown size={17} color="#8CC1E9" />
            )}
          </div>

          {overtimeOpen && (
            <div className="sidebar-subnav-list sub-overtime">
              {overtimeItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <div
                    key={item.id}
                    className={`sidebar-subnav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setCurrentView(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="subnav-left">
                      <Icon size={18} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {isActive && !sidebarCollapsed && (
                      <span className="active-dot-indicator" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Footer in Sidebar */}
      {currentUser && (
        <div
          style={{
            padding: sidebarCollapsed ? '12px 6px' : '14px 16px',
            borderTop: '1px solid rgba(67, 139, 196, 0.2)',
            background: 'rgba(6, 17, 38, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            gap: 10
          }}
        >
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #00d2ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentUser.name === 'Administrator Quality' ? 'Admin' : currentUser.name}
                </span>
                <span style={{
                  fontSize: '0.70rem',
                  color: '#38bdf8',
                  fontWeight: 600
                }}>
                  {currentUser.role === 'admin' ? 'Admin' : `Karyawan (${currentUser.npk || ''})`}
                </span>
              </div>
            </div>
          ) : (
            <div
              title={`${currentUser.name === 'Administrator Quality' ? 'Admin' : currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Karyawan'})`}
              style={{
                width: 32,
                height: 32,
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
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

