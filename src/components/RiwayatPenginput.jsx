import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  History,
  Users,
  UserCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  User,
  ArrowUpDown,
  ChevronRight,
  Eye,
  FileText,
  Printer,
  Copy,
  ChevronLeft,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { useQC } from '../context/QCContext';
import { getFallbackJamWaktu } from '../data/mockData';

// Helper to apply exact header color (#8EA954), borders, and cell typography/alignment for Excel export
const applyRiwayatExcelStyles = (ws, rowCount, colCount) => {
  const borderThin = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const headerStyle = (c) => ({
    fill: { fgColor: { rgb: '8EA954' } }, // Exact olive green header fill from user reference
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
    alignment: {
      vertical: 'center',
      horizontal: c === 0 ? 'center' : (c === 8 || c === 9 ? 'right' : 'left')
    },
    border: borderThin
  });

  const dataStyle = (c) => ({
    font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
    alignment: {
      vertical: 'center',
      horizontal: c === 0 ? 'center' : (c === 8 || c === 9 ? 'right' : 'left')
    },
    border: borderThin
  });

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      if (r === 0) {
        ws[cellRef].s = headerStyle(c);
      } else {
        ws[cellRef].s = dataStyle(c);
      }
    }
  }

  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 22 },  // Waktu Penginputan
    { wch: 14 },  // Role
    { wch: 20 },  // Nama
    { wch: 12 },  // NPK
    { wch: 16 },  // Plant
    { wch: 10 },  // Shift
    { wch: 12 },  // Jam Kerja
    { wch: 14 },  // Durasi (Jam)
    { wch: 12 },  // Total TUL
  ];
};

// Reusable Multi-Select Dropdown with Checkboxes, Search, Select All, and Tag Chips
const ExportMultiSelectField = ({
  label,
  icon: Icon,
  placeholder = '-- Pilih --',
  items = [],
  selected = [],
  onChange,
  renderItemLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => {
      const valStr = typeof item === 'string' ? item : (item.label || item.name || item.value || '');
      const npkStr = item.npk || '';
      return valStr.toLowerCase().includes(q) || npkStr.toLowerCase().includes(q);
    });
  }, [items, search]);

  const allSelected = items.length > 0 && selected.length === items.length;

  const toggleSelectAll = (e) => {
    e.stopPropagation();
    if (allSelected) {
      onChange([]);
    } else {
      onChange(items.map(i => (typeof i === 'string' ? i : i.value || i.name)));
    }
  };

  const toggleItem = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeSingle = (e, val) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  };

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder;
    }
    if (selected.length === 1) {
      const item = items.find(i => (typeof i === 'string' ? i === selected[0] : (i.value === selected[0] || i.name === selected[0])));
      if (item) {
        return typeof item === 'string' ? item : item.name || item.label || item.value;
      }
      return selected[0];
    }
    return `${selected.length} Opsi Dipilih`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={15} color="#38bdf8" />}
          <span>{label}</span>
        </span>
        {selected.length > 0 && (
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
            {selected.length} Terpilih
          </span>
        )}
      </label>

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(5, 14, 30, 0.95)',
          border: isOpen ? '1px solid #38bdf8' : selected.length > 0 ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 8,
          color: selected.length > 0 ? '#ffffff' : '#94a3b8',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected.length > 0 ? 700 : 400 }}>
          {getDisplayText()}
        </span>
        <ChevronDown
          size={16}
          color={isOpen ? '#38bdf8' : '#94a3b8'}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 6 }}
        />
      </div>

      {/* Selected Tags Preview */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, maxHeight: 68, overflowY: 'auto' }}>
          {selected.map(val => {
            const item = items.find(i => (typeof i === 'string' ? i === val : (i.value === val || i.name === val)));
            const itemLabel = item ? (typeof item === 'string' ? item : item.name || item.label || item.value) : val;
            return (
              <span
                key={val}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.18)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#e0f2fe',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                {itemLabel}
                <X
                  size={12}
                  style={{ cursor: 'pointer', opacity: 0.8 }}
                  onClick={(e) => removeSingle(e, val)}
                />
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#071630',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: 10,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 99999,
            padding: 8,
            maxHeight: 250,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          {/* Search bar & Select All Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Ketik untuk menelusuri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                background: allSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                border: allSelected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 6,
                padding: '5px 8px',
                color: allSelected ? '#fca5a5' : '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {allSelected ? 'Batal Semua' : 'Pilih Semua'}
            </button>
          </div>

          {/* List Options */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.76rem', color: '#94a3b8' }}>
                Tidak ada data ditemukan
              </div>
            ) : (
              filteredItems.map(item => {
                const val = typeof item === 'string' ? item : (item.value || item.name);
                const isChecked = selected.includes(val);
                const display = renderItemLabel ? renderItemLabel(item) : (typeof item === 'string' ? item : item.label || item.name);

                return (
                  <div
                    key={val}
                    onClick={() => toggleItem(val)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 6,
                      background: isChecked ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                      color: isChecked ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                    onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = isChecked ? 'rgba(56, 189, 248, 0.18)' : 'transparent'; }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', accentColor: '#38bdf8', width: 14, height: 14 }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {display}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const RiwayatPenginput = () => {
  const {
    overtimeRecords,
    employees,
    plants,
    monthList,
    showToast,
    currentUser,
    isAdmin
  } = useQC();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedRoleType, setSelectedRoleType] = useState('ALL'); // 'ALL' | 'karyawan' | 'admin'
  const [selectedSubmitterNpk, setSelectedSubmitterNpk] = useState('ALL');

  // Export Modal State & Filters (Multi-Select Supported)
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNamaList, setExportNamaList] = useState([]);
  const [exportPlantList, setExportPlantList] = useState([]);
  const [exportTanggal, setExportTanggal] = useState('');
  const [exportBulanList, setExportBulanList] = useState([]);
  const [exportShiftList, setExportShiftList] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Detail Modal
  const [detailRecord, setDetailRecord] = useState(null);

  // Live Digital Clock
  const [liveClock, setLiveClock] = useState('');

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
      setLiveClock(`${date} ${month} ${year} • ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to normalize submitter info from record
  const getSubmitterInfo = (rec) => {
    if (rec.createdBy && typeof rec.createdBy === 'object') {
      return {
        name: rec.createdBy.name || rec.nama || 'Operator Quality',
        npk: rec.createdBy.npk || rec.npk || '-',
        role: rec.createdBy.role || 'karyawan',
        roleLabel: rec.createdBy.roleLabel || (rec.createdBy.role === 'admin' ? 'Admin Quality' : 'Karyawan Quality'),
        plant: rec.createdBy.plant || rec.plant || 'Plant Hose'
      };
    }
    // Fallback if legacy record
    return {
      name: rec.nama || 'Operator Quality',
      npk: rec.npk || '-',
      role: 'karyawan',
      roleLabel: 'Karyawan Quality',
      plant: rec.plant || 'Plant Hose'
    };
  };

  // Helper to format creation/submission time
  const getSubmissionTimestamp = (rec) => {
    if (rec.createdAt) {
      try {
        const d = new Date(rec.createdAt);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = String(d.getDate()).padStart(2, '0');
        const m = months[d.getMonth()];
        const y = d.getFullYear();
        const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${day} ${m} ${y}, ${time}`;
      } catch (e) {
        // fallback
      }
    }
    if (rec.timestamp) {
      return rec.timestamp;
    }
    return `${rec.tglOvertime || '2026-09-21'} ${rec.jamWaktu ? rec.jamWaktu.split('-')[0].trim() : '07:30'}`;
  };

  // Helper to split date and time cleanly for display
  const getSubmissionDateTime = (rec) => {
    // 1. If explicit ISO createdAt timestamp exists
    if (rec.createdAt) {
      try {
        const d = new Date(rec.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return {
          date: `${y}-${m}-${day}`,
          time: time
        };
      } catch (e) {}
    }

    // 2. If timestamp exists (e.g. "2026-09-08 09:15:20")
    if (rec.timestamp) {
      const parts = rec.timestamp.trim().split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0];
        const timePart = parts.slice(1).join(' ').trim();
        // Check if timePart is an actual clock time without '-' range
        if (!timePart.includes('-')) {
          return {
            date: datePart,
            time: timePart.length === 5 ? `${timePart}:00` : timePart
          };
        }
      }
    }

    // 3. Fallback clock time for initial / mock records
    const fallbackTime = rec.jamInput || (rec.shift === 'Shift 2' ? '18:15:20' : '08:45:10');
    return {
      date: rec.tglOvertime || '2026-09-21',
      time: fallbackTime
    };
  };

  // Helper to extract a reliable numeric timestamp for chronological sorting (Descending: Newest at top)
  const getRecordInputTimeValue = (rec) => {
    if (rec.createdAt) {
      const time = new Date(rec.createdAt).getTime();
      if (!isNaN(time)) return time;
    }
    if (rec.timestamp) {
      const t = rec.timestamp.trim();
      const isoCandidate = t.includes('T') ? t : t.replace(' ', 'T');
      const parsed = new Date(isoCandidate).getTime();
      if (!isNaN(parsed)) return parsed;
      const parsed2 = new Date(t).getTime();
      if (!isNaN(parsed2)) return parsed2;
    }
    const { date, time } = getSubmissionDateTime(rec);
    if (date && time) {
      const parsed = new Date(`${date}T${time}`).getTime();
      if (!isNaN(parsed)) return parsed;
      const parsed2 = new Date(`${date} ${time}`).getTime();
      if (!isNaN(parsed2)) return parsed2;
    }
    if (rec.tglOvertime) {
      return new Date(rec.tglOvertime).getTime() || 0;
    }
    return 0;
  };

  // Submitter Statistics & Aggregations
  const submitterStats = useMemo(() => {
    const map = new Map();

    overtimeRecords.forEach(rec => {
      const sub = getSubmitterInfo(rec);
      const key = `${sub.npk}_${sub.name}`.toUpperCase();

      if (!map.has(key)) {
        map.set(key, {
          name: sub.name,
          npk: sub.npk,
          role: sub.role,
          roleLabel: sub.roleLabel,
          plant: sub.plant,
          totalInput: 0,
          totalJam: 0,
          totalTUL: 0,
          lastSubmission: getSubmissionTimestamp(rec)
        });
      }

      const item = map.get(key);
      item.totalInput += 1;
      item.totalJam += Number(rec.jamOvertime) || 0;
      item.totalTUL += Number(rec.totalTUL) || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.totalInput - a.totalInput);
  }, [overtimeRecords]);

  // General KPIs
  const totalSubmissions = overtimeRecords.length;
  const totalUniqueSubmitters = submitterStats.length;
  const totalHours = overtimeRecords.reduce((sum, item) => sum + (Number(item.jamOvertime) || 0), 0);
  const totalTUL = overtimeRecords.reduce((sum, item) => sum + (Number(item.totalTUL) || 0), 0);

  // Filtered List for Table (Sorted Descending: Newest input at top / awal, Oldest at bottom / akhir)
  const filteredRecords = useMemo(() => {
    const list = overtimeRecords.filter(rec => {
      const sub = getSubmitterInfo(rec);

      // Filter Submitter NPK
      if (selectedSubmitterNpk !== 'ALL' && sub.npk !== selectedSubmitterNpk) {
        return false;
      }

      // Filter Plant
      if (selectedPlant !== 'ALL') {
        const plantMatch = (rec.plant && rec.plant.toUpperCase() === selectedPlant.toUpperCase()) ||
                           (sub.plant && sub.plant.toUpperCase() === selectedPlant.toUpperCase());
        if (!plantMatch) return false;
      }

      // Filter Role
      if (selectedRoleType !== 'ALL' && sub.role !== selectedRoleType) {
        return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (sub.name || '').toLowerCase().includes(q);
        const matchNpk = (sub.npk || '').toLowerCase().includes(q);
        const matchWorker = (rec.nama || '').toLowerCase().includes(q);
        const matchWorkerNpk = (rec.npk || '').toLowerCase().includes(q);
        const matchPlant = (rec.plant || '').toLowerCase().includes(q);
        const matchReason = (rec.reason || '').toLowerCase().includes(q);
        const matchId = (rec.id || '').toString().toLowerCase().includes(q);

        if (!matchName && !matchNpk && !matchWorker && !matchWorkerNpk && !matchPlant && !matchReason && !matchId) {
          return false;
        }
      }

      return true;
    });

    return list.sort((a, b) => {
      const timeA = getRecordInputTimeValue(a);
      const timeB = getRecordInputTimeValue(b);
      return timeB - timeA;
    });
  }, [overtimeRecords, searchQuery, selectedPlant, selectedRoleType, selectedSubmitterNpk]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlant('ALL');
    setSelectedRoleType('ALL');
    setSelectedSubmitterNpk('ALL');
    setCurrentPage(1);
  };

  // Options for Export Modal
  const employeeOptions = useMemo(() => {
    const map = new Map();
    (employees || []).forEach(emp => {
      map.set(emp.name.toUpperCase(), { name: emp.name, npk: emp.npk, plant: emp.plant });
    });
    (overtimeRecords || []).forEach(rec => {
      if (rec.nama && !map.has(rec.nama.toUpperCase())) {
        map.set(rec.nama.toUpperCase(), { name: rec.nama, npk: rec.npk || '-', plant: rec.plant || '-' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, overtimeRecords]);

  const monthOptions = useMemo(() => {
    const set = new Set(monthList || ['September 2026']);
    (overtimeRecords || []).forEach(r => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set);
  }, [monthList, overtimeRecords]);

  const shiftOptions = ['Shift 1', 'Shift 2'];

  // Data Filtered Specifically for Export Modal (Multi-Select Supported & Sorted Descending)
  const exportFilteredRecords = useMemo(() => {
    const list = overtimeRecords.filter(rec => {
      // 1. Nama Pekerja (Multi-Select)
      if (exportNamaList.length > 0) {
        const match = exportNamaList.some(target => {
          const t = target.toUpperCase();
          return (rec.nama || '').toUpperCase() === t || (rec.npk || '').toUpperCase() === t;
        });
        if (!match) return false;
      }

      // 2. Plant (Multi-Select)
      if (exportPlantList.length > 0) {
        const match = exportPlantList.some(p => {
          return (rec.plant || '').toUpperCase() === p.toUpperCase() ||
                 (rec.dept || '').toLowerCase() === p.toLowerCase().replace('plant ', '').trim();
        });
        if (!match) return false;
      }

      // 3. Tanggal (YYYY-MM-DD)
      if (exportTanggal) {
        if (rec.tglOvertime !== exportTanggal) {
          return false;
        }
      }

      // 4. Bulan (Multi-Select)
      if (exportBulanList.length > 0) {
        if (!exportBulanList.includes(rec.month)) {
          return false;
        }
      }

      // 5. Shift (Multi-Select)
      if (exportShiftList.length > 0) {
        if (!exportShiftList.includes(rec.shift)) {
          return false;
        }
      }

      return true;
    });

    return list.sort((a, b) => {
      const timeA = getRecordInputTimeValue(a);
      const timeB = getRecordInputTimeValue(b);
      return timeB - timeA;
    });
  }, [overtimeRecords, exportNamaList, exportPlantList, exportTanggal, exportBulanList, exportShiftList]);

  // Open Export Modal with current active context (Hanya untuk Admin)
  const handleOpenExportModal = () => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat mengekspor data riwayat.', 'danger');
      return;
    }
    if (selectedPlant !== 'ALL') {
      setExportPlantList([selectedPlant]);
    } else {
      setExportPlantList([]);
    }
    setShowExportModal(true);
  };

  // Reset Export Modal Filters
  const handleResetExportFilters = () => {
    setExportNamaList([]);
    setExportPlantList([]);
    setExportTanggal('');
    setExportBulanList([]);
    setExportShiftList([]);
  };

  // Format timestamp strictly as YYYY-MM-DD HH:mm:ss for Excel
  const formatTimestampForExcel = (rec) => {
    if (rec.createdAt) {
      try {
        const d = new Date(rec.createdAt);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
        }
      } catch (e) {
        // fallback
      }
    }
    if (rec.timestamp && /^\d{4}-\d{2}-\d{2}/.test(rec.timestamp)) {
      return rec.timestamp;
    }
    const tgl = rec.tglOvertime || '2026-09-08';
    const time = rec.jamWaktu && rec.jamWaktu !== '-' ? `${rec.jamWaktu.split('-')[0].trim()}:00` : '09:00:00';
    return `${tgl} ${time.length === 5 ? `${time}:00` : time}`;
  };

  // Execute Export to Excel (.xlsx)
  const handleExecuteExportExcel = () => {
    if (exportFilteredRecords.length === 0) {
      showToast('Tidak ada data yang cocok dengan kriteria filter ekspor.', 'warning');
      return;
    }

    const rows = exportFilteredRecords.map((rec, index) => {
      const sub = getSubmitterInfo(rec);
      return {
        'No': index + 1,
        'Waktu Penginputan': formatTimestampForExcel(rec),
        'Role': sub.roleLabel || 'Karyawan Quality',
        'Nama': (rec.nama || '-').toUpperCase(),
        'NPK': rec.npk || '-',
        'Plant': rec.plant || '-',
        'Shift': rec.shift || '-',
        'Jam Kerja': (rec.jamWaktu && rec.jamWaktu.trim() !== '' && rec.jamWaktu !== '-')
          ? rec.jamWaktu
          : getFallbackJamWaktu(rec.shift, rec.jamOvertime, rec.isHoliday),
        'Durasi (Jam)': Number(rec.jamOvertime) || 0,
        'Total TUL': Number(rec.totalTUL) || 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    applyRiwayatExcelStyles(ws, rows.length + 1, 10);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Lembur QC');

    const dateStr = new Date().toISOString().split('T')[0];
    const plantSuffix = exportPlantList.length > 0 ? `_${exportPlantList.map(p => p.replace(/\s+/g, '')).join('-')}` : '';
    const shiftSuffix = exportShiftList.length > 0 ? `_${exportShiftList.map(s => s.replace(/\s+/g, '')).join('-')}` : '';
    const nameSuffix = exportNamaList.length > 0 ? `_${exportNamaList.length === 1 ? exportNamaList[0].replace(/\s+/g, '_') : `${exportNamaList.length}Pekerja`}` : '';
    const filename = `Rekap_Lembur_QC${plantSuffix}${shiftSuffix}${nameSuffix}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
    showToast(`Berhasil mengekspor ${rows.length} baris data ke Excel!`, 'success');
    setShowExportModal(false);
  };

  return (
    <div className="rekap-page-container" style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto' }}>
      
      {/* 1. CLEAN SLEEK PAGE HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 22,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
          }}>
            <History size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
              Riwayat Penginput Data Lembur
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
              Log pencatatan dan data penginput lembur QC
            </p>
          </div>
        </div>

        {/* Live Clock Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(9, 24, 52, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: 10,
          padding: '8px 14px'
        }}>
          <Clock size={15} color="#38bdf8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace' }}>
            {liveClock}
          </span>
        </div>
      </div>

      {/* 2. STATISTIC SUMMARY CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 20
      }}>
        {/* Card 1: Total Transaksi */}
        <div style={{
          background: 'rgba(9, 24, 52, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(14, 165, 233, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total Transaksi</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {totalSubmissions}
            </div>
          </div>
        </div>

        {/* Card 2: Penginput Unik */}
        <div style={{
          background: 'rgba(9, 24, 52, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>User Penginput</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
              {totalUniqueSubmitters}
            </div>
          </div>
        </div>

        {/* Card 3: Total Jam Lembur */}
        <div style={{
          background: 'rgba(9, 24, 52, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total Jam Lembur</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.2 }}>
              {totalHours} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Jam</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total TUL Lembur */}
        <div style={{
          background: 'rgba(9, 24, 52, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(52, 211, 153, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total TUL Lembur</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
              {totalTUL} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>TUL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER TOOLBAR & SEARCH */}
      <div style={{
        background: 'rgba(8, 18, 38, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Cari penginput, pekerja, NPK..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              background: 'rgba(5, 12, 26, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 7,
              color: '#ffffff',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          
          {/* Plant Filter */}
          <select
            value={selectedPlant}
            onChange={(e) => {
              setSelectedPlant(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'rgba(5, 12, 26, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 7,
              color: '#ffffff',
              fontSize: '0.84rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Semua Plant</option>
            {plants.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleType}
            onChange={(e) => {
              setSelectedRoleType(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'rgba(5, 12, 26, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 7,
              color: '#ffffff',
              fontSize: '0.84rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Semua Role</option>
            <option value="karyawan">Karyawan Quality</option>
            <option value="admin">Admin Quality</option>
          </select>

          {/* Reset Button */}
          {(searchQuery || selectedPlant !== 'ALL' || selectedRoleType !== 'ALL' || selectedSubmitterNpk !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                borderRadius: 7,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.80rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          {/* Export Button */}
          {isAdmin && (
            <button
              onClick={handleOpenExportModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 7,
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Download size={14} />
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN AUDIT LOG TABLE */}
      <div style={{
        background: 'rgba(8, 18, 38, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 10,
        overflow: 'hidden'
      }}>
        
        {/* Table Header Bar */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} color="#38bdf8" />
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.90rem' }}>
              Daftar Riwayat Transaksi ({filteredRecords.length} Data)
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(5, 12, 26, 0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ width: '5%', textAlign: 'center', padding: '11px 8px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NO</th>
                <th style={{ width: '18%', textAlign: 'left', padding: '11px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WAKTU INPUT</th>
                <th style={{ width: '25%', textAlign: 'left', padding: '11px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PENGINPUT</th>
                <th style={{ width: '25%', textAlign: 'left', padding: '11px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DATA PEKERJA & PLANT</th>
                <th style={{ width: '17%', textAlign: 'center', padding: '11px 10px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LEMBUR & TUL</th>
                <th style={{ width: '10%', textAlign: 'center', padding: '11px 8px', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <History size={30} color="#475569" />
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>Tidak ada riwayat penginputan yang cocok</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Silakan sesuaikan kata kunci pencarian atau filter.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, index) => {
                  const sub = getSubmitterInfo(rec);
                  const isSubAdmin = sub.role === 'admin';

                  return (
                    <tr
                      key={rec.id || index}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'}
                    >
                      {/* NO */}
                      <td style={{ textAlign: 'center', padding: '11px 8px', color: '#64748b', fontWeight: 500 }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* WAKTU INPUT */}
                      <td style={{ padding: '11px 12px' }}>
                        {(() => {
                          const dt = getSubmissionDateTime(rec);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.84rem' }}>
                                {dt.date}
                              </span>
                              <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.84rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                {dt.time}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* DIINPUT OLEH */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: isSubAdmin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                            color: isSubAdmin ? '#34d399' : '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {isSubAdmin ? <ShieldCheck size={14} /> : sub.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.84rem' }}>
                                {sub.name}
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontWeight: 700,
                                background: isSubAdmin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                                color: isSubAdmin ? '#34d399' : '#38bdf8'
                              }}>
                                {sub.roleLabel}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                              NPK: {sub.npk}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DATA PEKERJA & PLANT */}
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.84rem' }}>
                              {rec.nama}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.74rem', fontFamily: 'JetBrains Mono, monospace' }}>
                              ({rec.npk})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#94a3b8'
                            }}>
                              {rec.plant}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'rgba(14, 165, 233, 0.08)',
                              color: '#7dd3fc'
                            }}>
                              {rec.shift}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LEMBUR & TUL */}
                      <td style={{ textAlign: 'center', padding: '11px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{
                            color: '#f8fafc',
                            fontWeight: 700,
                            fontSize: '0.84rem'
                          }}>
                            {rec.jamOvertime} Jam
                          </span>
                          <span style={{
                            color: '#34d399',
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '1px 5px',
                            borderRadius: 3
                          }}>
                            {rec.totalTUL} TUL
                          </span>
                        </div>
                      </td>

                      {/* DETAIL BUTTON */}
                      <td style={{ textAlign: 'center', padding: '11px 8px' }}>
                        <button
                          type="button"
                          onClick={() => setDetailRecord(rec)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                            e.currentTarget.style.color = '#38bdf8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                          title="Lihat Detail Transaksi"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          padding: '11px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ fontSize: '0.80rem', color: '#64748b' }}>
            Menampilkan {filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} dari {filteredRecords.length} data
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: currentPage === 1 ? '#475569' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={13} />
                Prev
              </button>
              <span style={{ fontSize: '0.80rem', color: '#94a3b8', padding: '0 4px' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: currentPage === totalPages ? '#475569' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 5. TRANSACTION DETAIL MODAL */}
      {detailRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#091a38',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 16,
            maxWidth: 560,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={20} color="#38bdf8" />
                <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>
                  Detail Transaksi Penginputan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailRecord(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Submitter Info Card */}
              <div style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 10,
                padding: '12px 16px'
              }}>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Informasi Penginput (Submitter):
                </div>
                {(() => {
                  const sub = getSubmitterInfo(detailRecord);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.84rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nama Penginput:</div>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{sub.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>NPK:</div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>{sub.npk}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Role Sistem:</div>
                        <div style={{ fontWeight: 700, color: sub.role === 'admin' ? '#34d399' : '#38bdf8' }}>{sub.roleLabel}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Waktu Input:</div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{getSubmissionTimestamp(detailRecord)}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Overtime Info Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '12px 16px'
              }}>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Detail Penugasan Lembur:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '0.84rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pekerja:</div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{detailRecord.nama} ({detailRecord.npk})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Plant & Shift:</div>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{detailRecord.plant} - {detailRecord.shift}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tanggal Lembur:</div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{detailRecord.tglOvertime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Jam Kerja:</div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                      {(detailRecord.jamWaktu && detailRecord.jamWaktu !== '-')
                        ? detailRecord.jamWaktu
                        : getFallbackJamWaktu(detailRecord.shift, detailRecord.jamOvertime, detailRecord.isHoliday)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Durasi Lembur:</div>
                    <div style={{ fontWeight: 800, color: '#38bdf8' }}>{detailRecord.jamOvertime} Jam</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Perhitungan TUL:</div>
                    <div style={{ fontWeight: 800, color: '#34d399' }}>{detailRecord.totalTUL} TUL</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>Alasan / Catatan Lembur:</div>
                  <div style={{ fontSize: '0.84rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                    "{detailRecord.reason || 'Lembur operasional QC'}"
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDetailRecord(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. EXPORT FILTER & CONFIGURATION MODAL */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#081730',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 18,
            maxWidth: 620,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(2, 132, 199, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}>
                  <FileSpreadsheet size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc' }}>
                    Filter & Ekspor Data Excel
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Pilih filter Nama, Plant, Tanggal, Bulan, dan Shift sebelum mengunduh file (.xlsx).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                
                {/* 1. Nama Pekerja */}
                <ExportMultiSelectField
                  label="Nama Pekerja Lembur"
                  icon={User}
                  placeholder="-- Semua Pekerja Lembur --"
                  items={employeeOptions}
                  selected={exportNamaList}
                  onChange={setExportNamaList}
                  renderItemLabel={(emp) => `${emp.name} (${emp.npk}) - ${emp.plant}`}
                />

                {/* 2. Plant */}
                <ExportMultiSelectField
                  label="Plant Penugasan"
                  icon={Building2}
                  placeholder="-- Semua Plant --"
                  items={plants.map(p => ({ value: p.name, label: p.name }))}
                  selected={exportPlantList}
                  onChange={setExportPlantList}
                />

                {/* 3. Bulan */}
                <ExportMultiSelectField
                  label="Bulan Periode"
                  icon={Calendar}
                  placeholder="-- Semua Bulan --"
                  items={monthOptions.map(m => ({ value: m, label: m }))}
                  selected={exportBulanList}
                  onChange={setExportBulanList}
                />

                {/* 4. Shift */}
                <ExportMultiSelectField
                  label="Shift Kerja"
                  icon={Clock}
                  placeholder="-- Semua Shift --"
                  items={shiftOptions.map(s => ({ value: s, label: s }))}
                  selected={exportShiftList}
                  onChange={setExportShiftList}
                />

                {/* 5. Tanggal Spesifik */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={15} color="#38bdf8" />
                      <span>Tanggal Lembur Spesifik (Opsional)</span>
                    </span>
                    {exportTanggal && (
                      <button
                        type="button"
                        onClick={() => setExportTanggal('')}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Hapus Tanggal (Semua Tanggal)
                      </button>
                    )}
                  </label>
                  <input
                    type="date"
                    value={exportTanggal}
                    onChange={(e) => setExportTanggal(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(5, 14, 30, 0.95)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
                    *Biarkan kosong jika ingin mengekspor seluruh tanggal pada bulan/plant yang dipilih.
                  </span>
                </div>

              </div>

              {/* Status Preview Card */}
              <div style={{
                background: exportFilteredRecords.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: exportFilteredRecords.length > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {exportFilteredRecords.length > 0 ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: exportFilteredRecords.length > 0 ? '#6ee7b7' : '#fca5a5' }}>
                      {exportFilteredRecords.length > 0 
                        ? `${exportFilteredRecords.length} Data Record Ditemukan`
                        : 'Tidak Ada Data yang Cocok'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {exportFilteredRecords.length > 0
                        ? 'Siap diekspor ke dalam file spreadsheet Excel (.xlsx).'
                        : 'Coba ubah atau reset pilihan filter di atas.'}
                    </div>
                  </div>
                </div>

                {(exportNamaList.length > 0 || exportPlantList.length > 0 || exportBulanList.length > 0 || exportShiftList.length > 0 || exportTanggal) && (
                  <button
                    type="button"
                    onClick={handleResetExportFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 6,
                      padding: '5px 10px',
                      color: '#cbd5e1',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset Filter Ekspor</span>
                  </button>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(5, 14, 30, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={exportFilteredRecords.length === 0}
                onClick={handleExecuteExportExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: exportFilteredRecords.length > 0 
                    ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: exportFilteredRecords.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: exportFilteredRecords.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  opacity: exportFilteredRecords.length > 0 ? 1 : 0.5
                }}
              >
                <Download size={16} />
                <span>Unduh File Excel ({exportFilteredRecords.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RiwayatPenginput;
