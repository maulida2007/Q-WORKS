import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  FileText,
  Copy,
  Printer,
  ChevronDown,
  Layers,
  Building2,
  Clock,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  RotateCcw,
  HelpCircle,
  SlidersHorizontal,
  Check,
  Calendar,
  User,
  BarChart2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { useQC } from '../context/QCContext';
import { sortEmployeesByPlant } from '../data/mockData';
import FilterPopover from './FilterPopover';

// Helper to apply exact header color, borders, and typography to Excel worksheets
const applyTableStyles = (ws, rowCount, colCount) => {
  const borderThin = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const headerStyle = {
    fill: { fgColor: { rgb: '8EA954' } }, // Exact olive green header fill from user reference
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: borderThin
  };

  const dataStyleCenter = {
    font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: borderThin
  };

  const dataStyleLeft = {
    font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
    alignment: { vertical: 'center', horizontal: 'left' },
    border: borderThin
  };

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      if (r === 0) {
        ws[cellRef].s = headerStyle;
      } else {
        ws[cellRef].s = (c === 0) ? dataStyleCenter : dataStyleLeft;
      }
    }
  }
};

export const MasterPekerja = () => {
  const {
    employees,
    plants,
    shifts,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    bulkAddEmployees,
    resetEmployeesToDefault,
    overtimeRecords,
    showToast,
    currentUser,
    isAdmin,
    isKaryawan,
    getAllowedPlants
  } = useQC();

  const allowedPlants = useMemo(() => {
    return getAllowedPlants ? getAllowedPlants() : ['Plant Hose', 'Plant Molded', 'Plant Subcont', 'Plant Lab Mixing', 'Plant RVI', 'Plant QRE'];
  }, [getAllowedPlants, currentUser]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(['September 2025']);
  const [selectedTanggal, setSelectedTanggal] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState([]);
  const [selectedKaryawan, setSelectedKaryawan] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null); // null = add, object = edit
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // npk to delete

  // Compute stats
  const totalEmployees = useMemo(() => {
    return employees.filter(emp => allowedPlants.includes(emp.plant)).length;
  }, [employees, allowedPlants]);

  // Compute accumulated OT per employee & total overall OT
  const { employeeOTStats, grandTotalJam } = useMemo(() => {
    const stats = {};
    let grandJam = 0;
    const allowedEmpNpks = new Set(employees.filter(e => allowedPlants.includes(e.plant)).map(e => (e.npk || '').toUpperCase()));

    overtimeRecords.forEach(rec => {
      const npkKey = (rec.npk || '').toUpperCase();
      if (!allowedEmpNpks.has(npkKey)) return;

      if (!stats[npkKey]) {
        stats[npkKey] = { totalJam: 0, totalTUL: 0, count: 0 };
      }
      const jam = Number(rec.jamOvertime) || 0;
      const tul = Number(rec.totalTUL) || 0;
      stats[npkKey].totalJam += jam;
      stats[npkKey].totalTUL += tul;
      stats[npkKey].count += 1;
      grandJam += jam;
    });
    return { employeeOTStats: stats, grandTotalJam: grandJam };
  }, [overtimeRecords, employees, allowedPlants]);

  // Filtered employees (selalu dikelompokkan, diurutkan, dan disaring sesuai izin plant karyawan)
  const filteredEmployees = useMemo(() => {
    const baseList = employees.filter(emp => allowedPlants.includes(emp.plant));
    const list = baseList.filter(emp => {
      // Plant filter
      if (selectedPlant.length > 0 && !selectedPlant.includes(emp.plant)) return false;
      // Karyawan filter
      if (selectedKaryawan.length > 0 && !selectedKaryawan.includes(emp.name) && !selectedKaryawan.includes(emp.npk)) return false;
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNpk = (emp.npk || '').toLowerCase().includes(query);
        const matchName = (emp.name || '').toLowerCase().includes(query);
        const matchPlant = (emp.plant || '').toLowerCase().includes(query);

        return matchNpk || matchName || matchPlant;
      }
      return true;
    });

    return sortEmployeesByPlant(list);
  }, [employees, allowedPlants, selectedPlant, selectedKaryawan, searchTerm]);

  // Pagination Math
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIdx, startIdx + itemsPerPage);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBulan(['September 2025']);
    setSelectedTanggal([]);
    setSelectedPlant([]);
    setSelectedKaryawan([]);
    setCurrentPage(1);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat menambah pekerja baru.', 'danger');
      return;
    }
    setEditingEmployee(null);
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat mengedit data master pekerja.', 'danger');
      return;
    }
    setEditingEmployee(emp);
    setShowAddEditModal(true);
  };

  // Plant Badge Helper
  const getPlantBadgeStyle = (plantName) => {
    const p = (plantName || '').toLowerCase();
    if (p.includes('hose')) {
      return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.35)' };
    }
    if (p.includes('molded')) {
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)' };
    }
    if (p.includes('subcont')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' };
    }
    if (p.includes('lab') || p.includes('mixing')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' };
    }
    if (p.includes('rvi')) {
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)' };
    }
    if (p.includes('qre')) {
      return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.35)' };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' };
  };

  // Download Sample Excel Template (Matches Clean Standard Format)
  const downloadExcelTemplate = () => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat mengunduh template master pekerja.', 'danger');
      return;
    }
    const templateData = [
      ['NO', 'NPK', 'NAMA LENGKAP', 'PLANT'],
      [1, '1747', 'GILANG', 'Plant Hose'],
      [2, '1796', 'OCHA', 'Plant Hose'],
      [3, '1670', 'KATIM', 'Plant Molded'],
      [4, '1423', 'SAHRUL', 'Plant Molded'],
      [5, '0201', 'KIKI', 'Plant Subcont'],
      [6, '1705', 'RAYHAN', 'Plant Lab Mixing'],
      [7, '1443', 'ARIF', 'Plant RVI'],
      [8, '1800', 'SUHDIN', 'Plant RVI'],
      [9, '0222', 'SADIYAH', 'Plant QRE']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 8 },  // NO
      { wch: 18 }, // NPK
      { wch: 34 }, // NAMA LENGKAP
      { wch: 24 }  // PLANT
    ];

    applyTableStyles(ws, templateData.length, 4);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Pekerja');
    XLSX.writeFile(wb, 'Template_Master_Pekerja_QWorks.xlsx');
    showToast('Template Excel berhasil diunduh dengan format & warna presisi!', 'success');
  };

  // Filter Dropdown Lists (disesuaikan dengan plant yang boleh dilihat)
  const bulanList = ['September 2025', 'Agustus 2025', 'Juli 2025', 'Juni 2025', 'Mei 2025'];
  const tanggalList = Array.from({ length: 31 }, (_, i) => `${i + 1} Sep 2025`);
  const plantList = useMemo(() => {
    return plants.filter(p => allowedPlants.includes(p.name || p)).map(p => p.name || p);
  }, [plants, allowedPlants]);
  const karyawanList = useMemo(() => {
    return employees
      .filter(e => allowedPlants.includes(e.plant))
      .map(e => ({ value: e.name, label: `${e.npk} - ${e.name}` }));
  }, [employees, allowedPlants]);

  // Live Digital Clock
  const [liveDateTime, setLiveDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const date = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setLiveDateTime(`${date} ${month} ${year} • ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rekap-page-container" style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>
      
      {/* 1. TOP EXECUTIVE HERO BANNER */}
      <div className="dashboard-hero-mockup-card">
        <div className="hero-mockup-left">
          <div className="hero-glowing-icon">
            <Users size={22} color="#ffffff" />
          </div>
          <div className="hero-text-block">
            <span className="hero-dept-tag">QUALITY CONTROL</span>
            <h1 className="hero-main-title">Master Data Pekerja QC</h1>
            <span className="hero-desc">
              Manajemen data anggota seluruh plant QC, tambah data, serta ekspor & impor massal Excel.
            </span>
          </div>
        </div>

        {/* Live Status Right */}
        <div className="hero-live-status-card">
          <div className="hero-live-clock-icon">
            <Clock size={15} />
          </div>
          <div className="hero-status-texts">
            <span className="hero-status-label">Waktu Sistem</span>
            <span className="hero-status-time">{liveDateTime}</span>
          </div>
        </div>
      </div>

      {/* 2. ACTION TOOLBAR (HANYA UNTUK ADMIN) */}
      {isAdmin && (
        <div className="master-actions-toolbar" style={{ marginBottom: 18 }}>
          <button
            onClick={downloadExcelTemplate}
            className="btn-master-action"
            title="Unduh format file Excel untuk input data pekerja"
          >
            <FileSpreadsheet size={16} color="#8CC1E9" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={() => {
              if (!isAdmin) {
                showToast('Akses ditolak: Hanya Admin yang dapat mengimpor data pekerja.', 'danger');
                return;
              }
              setShowImportModal(true);
            }}
            className="btn-master-action"
            title="Impor file Excel atau CSV"
          >
            <UploadCloud size={16} color="#8CC1E9" />
            <span>Impor Excel (.CSV)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-master-primary"
            title="Tambah anggota baru secara manual"
          >
            <UserPlus size={16} />
            <span>Tambah Anggota Manual</span>
          </button>
        </div>
      )}

      {/* 3. SEARCH & FILTER TASKBAR */}
      <div
        className="master-search-taskbar-card"
        style={{
          background: 'linear-gradient(135deg, rgba(8, 26, 58, 0.75) 0%, rgba(5, 17, 40, 0.9) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 18,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(16px)'
        }}
      >
        {/* Left: Search Input Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 360px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Search size={19} color="#38bdf8" />
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama karyawan, NPK, plant, atau shift..."
              style={{
                width: '100%',
                padding: '11px 38px 11px 16px',
                borderRadius: 10,
                background: 'rgba(9, 26, 56, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#f8fafc',
                fontSize: '0.90rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#38bdf8';
                e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.18), inset 0 2px 4px rgba(0, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Plant Selector + Stats + Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick Plant Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedPlant[0] || ''}
              onChange={(e) => {
                setSelectedPlant(e.target.value ? [e.target.value] : []);
                setCurrentPage(1);
              }}
              style={{
                padding: '9px 32px 9px 12px',
                borderRadius: 8,
                background: 'rgba(9, 26, 56, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#e2e8f0',
                fontSize: '0.84rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: '#071226', color: '#94a3b8' }}>Semua Plant</option>
              {plantList.map(p => (
                <option key={p} value={p} style={{ background: '#071226', color: '#f8fafc' }}>{p}</option>
              ))}
            </select>
            <Building2 size={13} color="#38bdf8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Counter Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.84rem',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={14} color="#38bdf8" />
            <span>{filteredEmployees.length} Pekerja</span>
          </div>

          {/* Reset Button (Visible if filtered/searched) */}
          {(searchTerm || selectedPlant.length > 0 || selectedKaryawan.length > 0) && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; }}
              title="Reset pencarian dan filter"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. MASTER TABLE CARD */}
      <div className="master-table-card">
        {/* Table Header */}
        <div className="master-table-card-header">
          <div className="master-table-title-left">
            <div className="master-table-icon-box">
              <Users size={17} color="#8CC1E9" />
            </div>
            <span className="master-table-title-text">
              Daftar Anggota & Pekerja ({filteredEmployees.length} Ditemukan)
            </span>
          </div>
          <span className="master-table-subtext">
            Data tersinkron otomatis dengan form input lembur dan rekapitulasi QC
          </span>
        </div>

        {/* Table Wrapper */}
        <div className="master-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(180deg, #091a38 0%, #071226 100%)', borderBottom: '2px solid rgba(56, 189, 248, 0.25)' }}>
                <th style={{ width: '6%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NO</th>
                <th style={{ width: '14%', textAlign: 'center', padding: '14px 10px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NPK</th>
                <th style={{ width: '36%', textAlign: 'left', padding: '14px 14px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NAMA KARYAWAN</th>
                <th style={{ width: '28%', textAlign: 'center', padding: '14px 10px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PLANT PENUGASAN</th>
                <th style={{ width: '16%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#8ca8cf' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Users size={36} color="#438BC4" />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Tidak ada data pekerja yang cocok</div>
                      <div style={{ fontSize: 13, color: '#8ca8cf' }}>Coba ubah filter atau tambahkan anggota baru.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp, index) => {
                  const initial = emp.name?.trim()?.charAt(0)?.toUpperCase() || 'P';
                  const plantName = emp.plant?.replace(/Plant\s*/i, '') || 'MOLDED';
                  const plantStyle = getPlantBadgeStyle(emp.plant);

                  return (
                    <tr
                      key={emp.npk || index}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        backgroundColor: index % 2 === 0 ? 'rgba(9, 26, 56, 0.4)' : 'rgba(13, 38, 84, 0.25)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(9, 26, 56, 0.4)' : 'rgba(13, 38, 84, 0.25)'}
                    >
                      {/* NO */}
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            fontWeight: 700,
                            fontSize: '0.80rem'
                          }}
                        >
                          {startIdx + index + 1}
                        </span>
                      </td>

                      {/* NPK */}
                      <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 12px',
                            borderRadius: 6,
                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {emp.npk}
                        </span>
                      </td>

                      {/* NAMA KARYAWAN */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                              border: '1.5px solid rgba(56, 189, 248, 0.5)',
                              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {initial}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', letterSpacing: '0.02em' }}>
                              {emp.name}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                color: '#94a3b8',
                                fontWeight: 500,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                width: 'fit-content'
                              }}
                            >
                              Dept. {plantName.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PLANT */}
                      <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 14px',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: plantStyle.bg,
                            color: plantStyle.text,
                            border: plantStyle.border,
                            boxShadow: `0 2px 8px ${plantStyle.bg}`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Building2 size={13} color={plantStyle.text} />
                          {emp.plant}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                        {isAdmin ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              title={`Edit data ${emp.name}`}
                              style={{
                                backgroundColor: 'rgba(0, 110, 220, 0.18)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                width: 32,
                                height: 32,
                                borderRadius: 7,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 110, 220, 0.35)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 110, 220, 0.18)'; }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (!isAdmin) {
                                  showToast('Akses ditolak: Hanya Admin yang dapat menghapus pekerja.', 'danger');
                                  return;
                                }
                                setShowDeleteConfirm(emp);
                              }}
                              title={`Hapus data ${emp.name}`}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#f87171',
                                width: 32,
                                height: 32,
                                borderRadius: 7,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{
                              fontSize: '0.74rem',
                              color: '#64748b',
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '3px 8px',
                              borderRadius: 5,
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              Lihat Saja
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="master-pagination-bar">
          <span className="master-pagination-count">
            Menampilkan {filteredEmployees.length === 0 ? 0 : startIdx + 1} - {Math.min(startIdx + itemsPerPage, filteredEmployees.length)} dari {filteredEmployees.length} data
          </span>

          <div className="master-pagination-controls">
            <button
              className="pagination-nav-btn"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ opacity: validCurrentPage <= 1 ? 0.4 : 1, cursor: validCurrentPage <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(p => p === 1 || p === totalPages || (p >= validCurrentPage - 1 && p <= validCurrentPage + 1))
              .map((pageNum, idx, arr) => {
                const showEllipsisBefore = idx > 0 && pageNum - arr[idx - 1] > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsisBefore && (
                      <span style={{ color: '#8CC1E9', padding: '0 4px', fontSize: 12 }}>...</span>
                    )}
                    <button
                      className={`pagination-nav-btn ${validCurrentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              className="pagination-nav-btn"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ opacity: validCurrentPage >= totalPages ? 0.4 : 1, cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PEKERJA */}
      {showAddEditModal && (
        <ModalAddEditPekerja
          isOpen={showAddEditModal}
          onClose={() => setShowAddEditModal(false)}
          editingEmployee={editingEmployee}
          plants={plants}
          onSave={(data) => {
            if (!isAdmin) {
              showToast('Akses ditolak: Hanya Admin yang dapat menambah atau mengedit data pekerja.', 'danger');
              setShowAddEditModal(false);
              return;
            }
            if (editingEmployee) {
              updateEmployee(editingEmployee.npk, data);
            } else {
              addEmployee(data);
            }
            setShowAddEditModal(false);
          }}
        />
      )}

      {/* MODAL IMPORT EXCEL / CSV */}
      {showImportModal && (
        <ModalImportExcel
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          plants={plants}
          onBulkImport={(data, mode) => {
            if (!isAdmin) {
              showToast('Akses ditolak: Hanya Admin yang dapat mengimpor data pekerja.', 'danger');
              setShowImportModal(false);
              return;
            }
            bulkAddEmployees(data, mode);
            setShowImportModal(false);
          }}
          downloadTemplate={downloadExcelTemplate}
        />
      )}

      {/* MODAL EXPORT PEKERJA */}
      {showExportModal && (
        <ModalExportPekerja
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          allEmployees={employees}
          initialFilters={{
            bulan: selectedBulan,
            tanggal: selectedTanggal,
            plant: selectedPlant,
            karyawan: selectedKaryawan
          }}
          plants={plants}
          employeeOTStats={employeeOTStats}
          showToast={showToast}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 12, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #091a38 0%, #0d2654 100%)',
            border: '1px solid rgba(244, 63, 94, 0.45)',
            borderRadius: 14,
            padding: '24px 28px',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFF8E7' }}>Hapus Anggota Pekerja?</h3>
                <div style={{ fontSize: 12.5, color: '#8CC1E9' }}>Tindakan ini akan menghapus data pekerja dari master.</div>
              </div>
            </div>

            <div style={{ background: 'rgba(10, 22, 45, 0.8)', border: '1px solid rgba(67, 139, 196, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF8E7' }}>{showDeleteConfirm.name}</div>
              <div style={{ fontSize: 12.5, color: '#00d2ff', fontFamily: 'JetBrains Mono, monospace' }}>{showDeleteConfirm.npk} • {showDeleteConfirm.plant}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(67, 139, 196, 0.35)',
                  color: '#8CC1E9',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteEmployee(showDeleteConfirm.npk);
                  setShowDeleteConfirm(null);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(244, 63, 94, 0.4)'
                }}
              >
                Ya, Hapus Pekerja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// MODAL TAMBAH / EDIT PEKERJA MANUAL
// ==========================================
const ModalAddEditPekerja = ({ isOpen, onClose, editingEmployee, plants, onSave }) => {
  const [npk, setNpk] = useState(editingEmployee?.npk || '');
  const [name, setName] = useState(editingEmployee?.name || '');
  const [plant, setPlant] = useState(editingEmployee?.plant || 'Plant Molded');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!npk.trim()) {
      alert('Silakan isi NPK Karyawan.');
      return;
    }
    if (!name.trim()) {
      alert('Silakan isi Nama Lengkap Karyawan.');
      return;
    }
    onSave({ npk, name, plant });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #091a38 0%, #0d2654 100%)',
        border: '1px solid rgba(67, 139, 196, 0.45)',
        borderRadius: 16,
        padding: '24px 28px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(67, 139, 196, 0.2)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #0055A0, #0088ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {editingEmployee ? <Pencil size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFF8E7' }}>
                {editingEmployee ? 'Edit Data Anggota' : 'Tambah Anggota / Pekerja Manual'}
              </h3>
              <div style={{ fontSize: 12, color: '#8CC1E9' }}>
                {editingEmployee ? `Perbarui informasi untuk ${editingEmployee.name}` : 'Masukkan data pekerja secara manual'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8CC1E9', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          
          {/* NPK */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#8CC1E9', marginBottom: 6 }}>
              NPK Karyawan <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: NPK-8832"
              value={npk}
              onChange={(e) => setNpk(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(10, 22, 45, 0.85)',
                border: '1px solid rgba(67, 139, 196, 0.35)',
                borderRadius: 8,
                color: '#FFF8E7',
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Nama Lengkap */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#8CC1E9', marginBottom: 6 }}>
              Nama Lengkap Karyawan <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Ahmad Hidayat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(10, 22, 45, 0.85)',
                border: '1px solid rgba(67, 139, 196, 0.35)',
                borderRadius: 8,
                color: '#FFF8E7',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Plant */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#8CC1E9', marginBottom: 6 }}>
              Plant Penugasan <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(10, 22, 45, 0.95)',
                border: '1px solid rgba(67, 139, 196, 0.35)',
                borderRadius: 8,
                color: '#FFF8E7',
                fontSize: 14,
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {plants.map(p => (
                <option key={p.id || p} value={p.name || p} style={{ background: '#091a38', color: '#FFF8E7' }}>
                  {p.name || p}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(67, 139, 196, 0.35)',
                color: '#8CC1E9',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                background: 'linear-gradient(90deg, #0055A0 0%, #0088ff 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(0, 136, 255, 0.45)'
              }}
            >
              {editingEmployee ? 'Simpan Perubahan' : '+ Tambah ke Master'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ==========================================
// MODAL IMPORT EXCEL / CSV
// ==========================================
const ModalImportExcel = ({ isOpen, onClose, plants, shifts, onBulkImport, downloadTemplate }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [rawPastedText, setRawPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState('merge'); // 'merge' or 'replace'
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process Excel / CSV file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        processMatrixData(rawJson);
      } catch (err) {
        console.error('Error parsing excel file', err);
        alert('Gagal membaca file Excel. Pastikan format file .xlsx, .xls, atau .csv valid.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process raw pasted text from spreadsheet
  const handleProcessPastedText = () => {
    if (!rawPastedText.trim()) {
      alert('Silakan tempelkan (paste) data dari spreadsheet terlebih dahulu.');
      return;
    }

    const lines = rawPastedText.trim().split('\n');
    const matrix = lines.map(l => l.split('\t').map(c => c.trim()));
    processMatrixData(matrix);
  };

  // Convert raw 2D array into validated employee objects
  const processMatrixData = (matrix) => {
    if (!matrix || matrix.length === 0) {
      setParsedRows([]);
      return;
    }

    let headerRowIdx = -1;
    let npkCol = 1; // default to column 1 if column 0 is NO
    let nameCol = 2;
    let plantCol = 3;

    // Scan first 15 rows to find the actual table header
    for (let r = 0; r < Math.min(matrix.length, 15); r++) {
      const rowArr = (matrix[r] || []).map(c => String(c || '').toLowerCase().trim());
      const hasNpk = rowArr.some(c => c.includes('npk'));
      const hasName = rowArr.some(c => c.includes('nama') || c.includes('name') || c.includes('karyawan'));
      const hasPlant = rowArr.some(c => c.includes('plant') || c.includes('dept') || c.includes('unit'));

      if (hasNpk || (hasName && hasPlant)) {
        headerRowIdx = r;
        rowArr.forEach((colName, idx) => {
          if (colName.includes('npk')) npkCol = idx;
          else if (colName.includes('nama') || colName.includes('name') || colName.includes('karyawan')) nameCol = idx;
          else if (colName.includes('plant') || colName.includes('dept') || colName.includes('unit')) plantCol = idx;
        });
        break;
      }
    }

    const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    const rows = [];

    for (let i = startIdx; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0 || row.every(c => !String(c).trim())) continue;

      const rawNpk = String(row[npkCol] !== undefined ? row[npkCol] : '').trim().toUpperCase();
      const rawName = String(row[nameCol] !== undefined ? row[nameCol] : '').trim();
      let rawPlant = String(row[plantCol] !== undefined ? row[plantCol] : 'Plant Molded').trim();

      // Skip instruction or header-like rows that might be lingering
      if (!rawNpk && !rawName) continue;
      if (rawNpk.toLowerCase().includes('petunjuk') || rawName.toLowerCase().includes('petunjuk')) continue;
      if (rawNpk.toLowerCase().includes('pt.') || rawName.toLowerCase().includes('pt.')) continue;
      if (rawNpk === 'NPK' || rawName === 'NAMA') continue;

      if (!rawPlant.toLowerCase().startsWith('plant ') && !rawPlant.toLowerCase().startsWith('plant')) {
        rawPlant = `Plant ${rawPlant}`;
      } else if (rawPlant.toLowerCase().startsWith('plant') && !rawPlant.toLowerCase().startsWith('plant ')) {
        rawPlant = `Plant ${rawPlant.substring(5).trim()}`;
      }
      const validPlants = ['Plant Hose', 'Plant Molded', 'Plant Subcont', 'Plant Mixing', 'Plant Lab Mixing', 'Plant RVI'];
      const matchedPlant = validPlants.find(p => p.toLowerCase() === rawPlant.toLowerCase()) || 'Plant Hose';

      const isValid = rawNpk.length >= 2 && rawName.length >= 2;

      rows.push({
        npk: rawNpk,
        name: rawName,
        plant: matchedPlant,
        isValid
      });
    }

    setParsedRows(rows);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada baris data valid untuk diimpor.');
      return;
    }
    onBulkImport(validRows, importMode);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #091a38 0%, #0d2654 100%)',
        border: '1px solid rgba(67, 139, 196, 0.45)',
        borderRadius: 16,
        padding: '24px 28px',
        maxWidth: 720,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(67, 139, 196, 0.2)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #0055A0, #0088ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFF8E7' }}>
                Impor Data Anggota via Excel / CSV
              </h3>
              <div style={{ fontSize: 12, color: '#8CC1E9' }}>
                Unggah file spreadsheet atau tempel data langsung untuk menambahkan karyawan secara massal
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8CC1E9', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(67, 139, 196, 0.2)', paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: activeTab === 'upload' ? 'rgba(0, 85, 160, 0.4)' : 'transparent',
              border: activeTab === 'upload' ? '1px solid #0088ff' : '1px solid transparent',
              color: activeTab === 'upload' ? '#FFF8E7' : '#8CC1E9',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Unggah File (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: activeTab === 'paste' ? 'rgba(0, 85, 160, 0.4)' : 'transparent',
              border: activeTab === 'paste' ? '1px solid #0088ff' : '1px solid transparent',
              color: activeTab === 'paste' ? '#FFF8E7' : '#8CC1E9',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Copy size={15} />
            <span>Paste Langsung dari Excel</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD FILE */}
        {activeTab === 'upload' && (
          <div style={{ marginBottom: 20 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(67, 139, 196, 0.45)',
                borderRadius: 12,
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(10, 22, 45, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0088ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(67, 139, 196, 0.45)'}
            >
              <FileSpreadsheet size={40} color="#0088ff" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF8E7', marginBottom: 4 }}>
                {fileName ? fileName : 'Klik di sini untuk memilih file Excel (.xlsx / .xls / .csv)'}
              </div>
              <div style={{ fontSize: 12, color: '#8CC1E9' }}>
                Format kolom: NO | NPK | NAMA LENGKAP | PLANT
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                onClick={downloadTemplate}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  textDecoration: 'underline'
                }}
              >
                <Download size={13} />
                <span>Unduh Format Template Excel (.xlsx)</span>
              </button>
              {isProcessing && <span style={{ fontSize: 12, color: '#f59e0b' }}>Membaca file spreadsheet...</span>}
            </div>
          </div>
        )}

        {/* TAB 2: PASTE DIRECTLY */}
        {activeTab === 'paste' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#8CC1E9', marginBottom: 6 }}>
              Salin data dari Excel (Ctrl+C) lalu tempel di kotak berikut (Ctrl+V):
            </label>
            <textarea
              rows={6}
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              placeholder="Contoh salinan tabel dari spreadsheet:&#10;1	1747	GILANG	Plant Hose&#10;2	1796	OCHA	Plant Hose"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(10, 22, 45, 0.85)',
                border: '1px solid rgba(67, 139, 196, 0.35)',
                borderRadius: 8,
                color: '#FFF8E7',
                fontSize: 13,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={handleProcessPastedText}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'rgba(0, 85, 160, 0.45)',
                  border: '1px solid #0088ff',
                  color: '#FFF8E7',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Proses Data Tempel (Parse)
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  textDecoration: 'underline'
                }}
              >
                <Download size={13} />
                <span>Unduh Format Template</span>
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW PARSED ROWS */}
        {parsedRows.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF8E7' }}>
                Preview Data ({validCount} Valid dari {parsedRows.length} Baris):
              </span>
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>
                ✓ Siap Diproses
              </span>
            </div>

            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid rgba(67, 139, 196, 0.25)', borderRadius: 8, background: 'rgba(10, 22, 45, 0.85)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 85, 160, 0.35)', color: '#8CC1E9', borderBottom: '1px solid rgba(67, 139, 196, 0.2)' }}>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>NPK</th>
                    <th style={{ padding: '8px 12px' }}>Nama</th>
                    <th style={{ padding: '8px 12px' }}>Plant</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(67, 139, 196, 0.1)' }}>
                      <td style={{ padding: '6px 12px' }}>
                        {r.isValid ? (
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                            <CheckCircle size={13} /> Valid
                          </span>
                        ) : (
                          <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                            <AlertCircle size={13} /> Kurang Lengkap
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#00d2ff', fontWeight: 700 }}>{r.npk || '-'}</td>
                      <td style={{ padding: '6px 12px', color: '#FFF8E7' }}>{r.name || '-'}</td>
                      <td style={{ padding: '6px 12px', color: '#8CC1E9' }}>{r.plant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Opsi Mode Impor */}
            <div style={{ marginTop: 14, background: 'rgba(10, 22, 45, 0.8)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(67, 139, 196, 0.3)' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8CC1E9', marginBottom: 8 }}>
                Metode Penggabungan:
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFF8E7', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />
                  <span>Gabungkan & Perbarui NPK yang Cocok (Disarankan)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFF8E7', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <span>Ganti Seluruh Master Data</span>
                </label>
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(67, 139, 196, 0.2)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(67, 139, 196, 0.35)',
              color: '#8CC1E9',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={validCount === 0}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: validCount > 0 ? 'linear-gradient(90deg, #0055A0 0%, #0088ff 100%)' : '#334155',
              border: 'none',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: validCount > 0 ? 'pointer' : 'not-allowed',
              boxShadow: validCount > 0 ? '0 0 20px rgba(0, 136, 255, 0.45)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Check size={16} />
            <span>Eksekusi Impor {validCount > 0 ? `(${validCount} Pekerja)` : ''}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// ==========================================
// MODAL EXPORT PEKERJA DENGAN FILTER LENGKAP
// ==========================================
const ModalExportPekerja = ({
  isOpen,
  onClose,
  allEmployees = [],
  initialFilters = {},
  plants = [],
  employeeOTStats = {},
  showToast
}) => {
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel', 'word', 'pdf'

  const bulanList = ['September 2025', 'Agustus 2025', 'Juli 2025', 'Juni 2025', 'Mei 2025'];
  const tanggalList = Array.from({ length: 31 }, (_, i) => `${i + 1} Sep 2025`);
  const plantList = plants.map(p => p.name || p);

  // Filter States inside Modal
  const [filterBulan, setFilterBulan] = useState(
    Array.isArray(initialFilters.bulan) && initialFilters.bulan.length > 0 ? initialFilters.bulan[0] : 'all'
  );
  const [filterTanggal, setFilterTanggal] = useState(
    Array.isArray(initialFilters.tanggal) && initialFilters.tanggal.length > 0 ? initialFilters.tanggal[0] : 'all'
  );
  const [filterPlant, setFilterPlant] = useState(
    Array.isArray(initialFilters.plant) && initialFilters.plant.length > 0 ? initialFilters.plant[0] : 'all'
  );
  const [filterKaryawan, setFilterKaryawan] = useState(
    Array.isArray(initialFilters.karyawan) && initialFilters.karyawan.length > 0 ? initialFilters.karyawan[0] : ''
  );
  const [showKaryawanDropdown, setShowKaryawanDropdown] = useState(false);
  const karyawanDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (karyawanDropdownRef.current && !karyawanDropdownRef.current.contains(e.target)) {
        setShowKaryawanDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetFilters = () => {
    setFilterBulan('all');
    setFilterTanggal('all');
    setFilterPlant('all');
    setFilterKaryawan('');
    setShowKaryawanDropdown(false);
  };

  // Dynamically filtered list of employees based on modal filters
  const targetData = useMemo(() => {
    const q = filterKaryawan.trim().toLowerCase();
    return allEmployees.filter(emp => {
      if (filterPlant !== 'all' && emp.plant !== filterPlant) return false;
      if (q && q !== 'all' && q !== 'semua' && q !== 'semua karyawan') {
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchNpk = emp.npk?.toLowerCase().includes(q);
        const matchFull = `${emp.npk} ${emp.name}`.toLowerCase().includes(q);
        if (!matchName && !matchNpk && !matchFull) return false;
      }
      return true;
    });
  }, [allEmployees, filterPlant, filterKaryawan]);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    if (targetData.length === 0) {
      alert('Tidak ada data yang cocok dengan filter untuk diekspor.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `Master_Pekerja_QC_QWorks_${todayStr}`;

    const formattedRows = targetData.map((emp, index) => {
      return {
        NO: index + 1,
        NPK: emp.npk,
        'NAMA LENGKAP': emp.name,
        PLANT: emp.plant
      };
    });

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(formattedRows);
      ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 34 }, { wch: 24 }];
      applyTableStyles(ws, formattedRows.length + 1, 4);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Master Pekerja');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      showToast(`Berhasil mengekspor ${targetData.length} data ke Excel (.xlsx)!`, 'success');
    } else if (exportFormat === 'word') {
      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Master Data Pekerja QC</title>
          <style>
            body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 20px; }
            h2 { text-align: center; color: #0055A0; margin-bottom: 3px; }
            p.sub { text-align: center; color: #555; font-size: 11pt; margin-top: 0; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #8EA954; color: #000000; font-weight: bold; border: 1px solid #000000; padding: 8px 6px; text-align: center; font-size: 11pt; }
            td { border: 1px solid #000000; padding: 6px 8px; font-size: 10.5pt; }
            .center { text-align: center; }
            .meta { margin-top: 15px; font-size: 9.5pt; color: #666; }
          </style>
        </head>
        <body>
          <h2>PT. VELASTO INDONESIA - Q-WORKS</h2>
          <p class="sub">LAPORAN MASTER DATA PEKERJA QUALITY CONTROL</p>
          <div style="margin-bottom: 12px; font-size: 10pt; color: #444;">
            <strong>Periode:</strong> ${filterBulan !== 'all' ? filterBulan : 'Semua Bulan'} ${filterTanggal !== 'all' ? `(${filterTanggal})` : ''} | 
            <strong>Plant:</strong> ${filterPlant !== 'all' ? filterPlant : 'Semua Plant'}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">NO</th>
                <th style="width: 120px;">NPK</th>
                <th>NAMA LENGKAP</th>
                <th style="width: 180px;">PLANT</th>
              </tr>
            </thead>
            <tbody>
              ${formattedRows.map(r => `
                <tr>
                  <td class="center">${r.NO}</td>
                  <td class="center">${r.NPK}</td>
                  <td>${r['NAMA LENGKAP']}</td>
                  <td>${r.PLANT}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="meta">
            <p>Total Data: ${targetData.length} Pekerja | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${fileName}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Berhasil mengekspor ${targetData.length} data ke Word (.doc)!`, 'success');
    } else if (exportFormat === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Master Data Pekerja QC - Q-WORKS</title>
              <style>
                @page { size: A4 portrait; margin: 15mm; }
                body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; padding: 20px; }
                .header-title { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0055A0; padding-bottom: 8px; }
                .header-title h2 { margin: 0 0 4px 0; font-size: 16pt; color: #0055A0; font-weight: 800; }
                .header-title p { margin: 0; font-size: 10.5pt; color: #555; }
                .filter-meta { margin-bottom: 12px; font-size: 9.5pt; color: #444; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #8EA954 !important; color: #000; font-weight: bold; border: 1px solid #000; padding: 8px 6px; font-size: 10.5pt; text-align: center; }
                td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
                .center { text-align: center; }
                .meta-info { margin-top: 15px; font-size: 9.5pt; color: #666; display: flex; justify-content: space-between; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="header-title">
                <h2>PT. VELASTO INDONESIA - Q-WORKS</h2>
                <p>LAPORAN MASTER DATA PEKERJA QUALITY CONTROL</p>
              </div>
              <div class="filter-meta">
                <strong>Periode:</strong> ${filterBulan !== 'all' ? filterBulan : 'Semua Bulan'} ${filterTanggal !== 'all' ? `(${filterTanggal})` : ''} | 
                <strong>Plant:</strong> ${filterPlant !== 'all' ? filterPlant : 'Semua Plant'}
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 45px;">NO</th>
                    <th style="width: 120px;">NPK</th>
                    <th>NAMA LENGKAP</th>
                    <th style="width: 180px;">PLANT</th>
                  </tr>
                </thead>
                <tbody>
                  ${formattedRows.map(r => `
                    <tr>
                      <td class="center">${r.NO}</td>
                      <td class="center">${r.NPK}</td>
                      <td>${r['NAMA LENGKAP']}</td>
                      <td>${r.PLANT}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="meta-info">
                <span>Total Data: ${targetData.length} Pekerja</span>
                <span>Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        showToast(`Membuka dialog cetak / PDF untuk ${targetData.length} data!`, 'success');
      }
    }

    onClose();
  };

  const selectStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    background: 'rgba(10, 22, 45, 0.85)',
    border: '1px solid rgba(67, 139, 196, 0.35)',
    color: '#FFF8E7',
    fontSize: 12.5,
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #091a38 0%, #0d2654 100%)',
        border: '1px solid rgba(67, 139, 196, 0.45)',
        borderRadius: 16,
        padding: '24px 28px',
        maxWidth: 620,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid rgba(67, 139, 196, 0.2)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #0055A0, #0088ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Download size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFF8E7' }}>
                Ekspor Data Anggota & Pekerja
              </h3>
              <div style={{ fontSize: 12, color: '#8CC1E9' }}>
                Pilih cakupan filter parameter dan format file yang ingin diunduh
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8CC1E9', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. Cakupan & Filter Parameter Data */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#8CC1E9' }}>
              1. Cakupan & Parameter Filter Data:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: targetData.length > 0 ? '#38bdf8' : '#f87171',
                background: targetData.length > 0 ? 'rgba(0, 136, 255, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: targetData.length > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                padding: '3px 10px',
                borderRadius: 12
              }}>
                {targetData.length} Pekerja Terpilih
              </span>
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8CC1E9',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(10, 22, 45, 0.55)',
            border: '1px solid rgba(67, 139, 196, 0.25)',
            borderRadius: 12,
            padding: '14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {/* Row 1: Bulan & Tanggal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#8CC1E9', marginBottom: 4 }}>
                  Bulan
                </label>
                <select
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">Semua Bulan</option>
                  {bulanList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#8CC1E9', marginBottom: 4 }}>
                  Tanggal
                </label>
                <select
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">Semua Tanggal</option>
                  {tanggalList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Plant */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#8CC1E9', marginBottom: 4 }}>
                Plant / Unit
              </label>
              <select
                value={filterPlant}
                onChange={(e) => setFilterPlant(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Semua Plant</option>
                {plantList.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Row 3: Nama Karyawan (Ketik Manual & Dropdown Pilihan) */}
            <div style={{ position: 'relative' }} ref={karyawanDropdownRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#8CC1E9' }}>
                  Nama / NPK Karyawan (Ketik Manual / Pilih):
                </label>
                {filterKaryawan && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterKaryawan('');
                      setShowKaryawanDropdown(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Tampilkan Semua
                  </button>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Ketik nama atau NPK karyawan... (atau klik untuk lihat daftar)"
                  value={filterKaryawan}
                  onChange={(e) => {
                    setFilterKaryawan(e.target.value);
                    setShowKaryawanDropdown(true);
                  }}
                  onFocus={() => setShowKaryawanDropdown(true)}
                  style={{
                    ...selectStyle,
                    paddingLeft: 34,
                    paddingRight: 34
                  }}
                />
                <Search
                  size={15}
                  color="#8CC1E9"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
                {filterKaryawan ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterKaryawan('');
                      setShowKaryawanDropdown(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8CC1E9',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowKaryawanDropdown(!showKaryawanDropdown)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8CC1E9',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronDown size={15} />
                  </button>
                )}
              </div>

              {/* Dropdown Options List */}
              {showKaryawanDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: '#0d2248',
                  border: '1px solid #0088ff',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  maxHeight: 190,
                  overflowY: 'auto',
                  zIndex: 10000
                }}>
                  <div
                    onClick={() => {
                      setFilterKaryawan('');
                      setShowKaryawanDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: !filterKaryawan ? 700 : 500,
                      color: !filterKaryawan ? '#FFF8E7' : '#8CC1E9',
                      background: !filterKaryawan ? 'rgba(0, 85, 160, 0.4)' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(67, 139, 196, 0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 85, 160, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = !filterKaryawan ? 'rgba(0, 85, 160, 0.4)' : 'transparent'}
                  >
                    -- Semua Karyawan ({allEmployees.length} Total Master Data) --
                  </div>

                  {allEmployees
                    .filter(emp => {
                      if (!filterKaryawan) return true;
                      const q = filterKaryawan.toLowerCase();
                      return (
                        emp.name?.toLowerCase().includes(q) ||
                        emp.npk?.toLowerCase().includes(q)
                      );
                    })
                    .map(emp => (
                      <div
                        key={emp.npk || emp.name}
                        onClick={() => {
                          setFilterKaryawan(emp.name);
                          setShowKaryawanDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: filterKaryawan === emp.name ? 700 : 500,
                          color: filterKaryawan === emp.name ? '#FFF8E7' : '#e2e8f0',
                          background: filterKaryawan === emp.name ? 'rgba(0, 85, 160, 0.4)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 85, 160, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = filterKaryawan === emp.name ? 'rgba(0, 85, 160, 0.4)' : 'transparent'}
                      >
                        <span><strong>{emp.npk}</strong> - {emp.name}</span>
                        <span style={{ fontSize: 10.5, color: '#8CC1E9', opacity: 0.85 }}>{emp.plant}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Format File (Exact 3 Options: Excel, Word, PDF) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#8CC1E9', marginBottom: 8 }}>
            2. Format File:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => setExportFormat('excel')}
              style={{
                padding: '12px 10px',
                borderRadius: 8,
                background: exportFormat === 'excel' ? 'rgba(0, 85, 160, 0.45)' : 'rgba(10, 22, 45, 0.8)',
                border: exportFormat === 'excel' ? '2px solid #0088ff' : '1px solid rgba(67, 139, 196, 0.3)',
                color: exportFormat === 'excel' ? '#FFF8E7' : '#8CC1E9',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <FileSpreadsheet size={16} />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('word')}
              style={{
                padding: '12px 10px',
                borderRadius: 8,
                background: exportFormat === 'word' ? 'rgba(0, 85, 160, 0.45)' : 'rgba(10, 22, 45, 0.8)',
                border: exportFormat === 'word' ? '2px solid #0088ff' : '1px solid rgba(67, 139, 196, 0.3)',
                color: exportFormat === 'word' ? '#FFF8E7' : '#8CC1E9',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <FileText size={16} />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('pdf')}
              style={{
                padding: '12px 10px',
                borderRadius: 8,
                background: exportFormat === 'pdf' ? 'rgba(0, 85, 160, 0.45)' : 'rgba(10, 22, 45, 0.8)',
                border: exportFormat === 'pdf' ? '2px solid #0088ff' : '1px solid rgba(67, 139, 196, 0.3)',
                color: exportFormat === 'pdf' ? '#FFF8E7' : '#8CC1E9',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Printer size={16} />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(67, 139, 196, 0.35)',
              color: '#8CC1E9',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={targetData.length === 0}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              background: targetData.length > 0 ? 'linear-gradient(90deg, #0055A0 0%, #0088ff 100%)' : '#334155',
              border: 'none',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: targetData.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: targetData.length > 0 ? '0 0 16px rgba(0, 136, 255, 0.45)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Download size={16} />
            <span>Unduh File Sekarang ({targetData.length} Pekerja)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
