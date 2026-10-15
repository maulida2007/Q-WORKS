import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Building2,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useQC } from '../context/QCContext';

export const Header = () => {
  const {
    notifications,
    setShowNotificationModal,
    selectedEmployees,
    setSelectedEmployees
  } = useQC();

  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

  // Live clock / date
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatDateShort = (d) => {
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => n.unread).length || 3;

  return (
    <header className="app-header-mockup">
      {/* Left side: Search Box */}
      <div className="header-mockup-left">
        {/* Search Bar */}
        <div className="header-search-container">
          <Search size={15} color="#8CC1E9" className="search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Cari nama karyawan, bagian, a..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Right side: Date Pill, Dept Badge, Notifications */}
      <div className="header-mockup-right">
        
        {/* Date Selector Pill */}
        <div className="header-pill-badge date-pill" title="Pilih Tanggal">
          <Calendar size={15} color="#8CC1E9" className="pill-icon" />
          <span className="pill-text">{formatDateShort(now)}</span>
          <ChevronDown size={14} color="#8CC1E9" className="pill-chevron" />
        </div>

        {/* Dept Badge */}
        <div className="header-pill-badge dept-pill" title="Departemen Quality Control">
          <Building2 size={15} color="#8CC1E9" className="pill-icon" />
          <span className="pill-text">Dept. Quality Control</span>
          <ChevronDown size={14} color="#8CC1E9" className="pill-chevron" />
        </div>

        {/* Notification Bell with Badge */}
        <button
          className="header-notification-icon-btn"
          onClick={() => setShowNotificationModal(true)}
          title="Notifikasi"
        >
          <Bell size={18} color="#FFF8E7" />
          <span className="notification-badge-dot">{unreadCount}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

