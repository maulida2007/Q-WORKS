import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  Trash2,
  Filter,
  RotateCcw,
  Calendar,
  Clock,
  User,
  Users,
  Building2,
  Layers,
  Flame,
  Calculator,
  X,
  Copy,
  Printer,
  FileText,
  Pencil,
  Save,
  CheckCircle2,
  XCircle,
  Check
} from 'lucide-react';
import { useQC } from '../context/QCContext';
import { getDayTypeInfo, isWeekendOrHoliday, getTULBreakdown, getFallbackJamWaktu } from '../data/mockData';
import FilterPopover from './FilterPopover';

const TimeInput24 = ({ value, onChange, label }) => {
  const [h, m] = (value && value.includes(':')) ? value.split(':') : ['07', '30'];
  const [localH, setLocalH] = useState(h);
  const [localM, setLocalM] = useState(m);

  useEffect(() => {
    const [curH, curM] = (value && value.includes(':')) ? value.split(':') : ['07', '30'];
    setLocalH(curH);
    setLocalM(curM);
  }, [value]);

  const updateTime = (newH, newM) => {
    let finalH = String(Math.min(23, Math.max(0, parseInt(newH, 10) || 0))).padStart(2, '0');
    let finalM = String(Math.min(59, Math.max(0, parseInt(newM, 10) || 0))).padStart(2, '0');
    setLocalH(finalH);
    setLocalM(finalM);
    onChange(`${finalH}:${finalM}`);
  };

  const handleHourChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setLocalH(val);
    if (val.length === 2) {
      updateTime(val, localM);
    }
  };

  const handleHourBlur = () => {
    updateTime(localH, localM);
  };

  const handleMinuteChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setLocalM(val);
    if (val.length === 2) {
      updateTime(localH, val);
    }
  };

  const handleMinuteBlur = () => {
    updateTime(localH, localM);
  };

  const stepHour = (delta) => {
    let num = (parseInt(localH, 10) || 0) + delta;
    if (num < 0) num = 23;
    if (num > 23) num = 0;
    updateTime(String(num), localM);
  };

  const stepMinute = (delta) => {
    let num = (parseInt(localM, 10) || 0) + delta;
    if (num < 0) num = 55;
    if (num > 59) num = 0;
    updateTime(localH, String(num));
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(10, 22, 45, 0.95)',
      border: '1.5px solid rgba(67, 139, 196, 0.45)',
      borderRadius: 8,
      height: 44,
      padding: '0 8px 0 10px',
      boxSizing: 'border-box'
    }}>
      <span style={{ fontSize: '0.78rem', color: '#8CC1E9', fontWeight: 800, whiteSpace: 'nowrap' }}>
        {label}:
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localH}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); stepHour(1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); stepHour(-1); }
          }}
          style={{
            width: 32,
            height: 28,
            background: 'rgba(0, 85, 160, 0.35)',
            border: '1px solid rgba(0, 210, 255, 0.45)',
            borderRadius: 5,
            color: '#FFF8E7',
            fontSize: '0.98rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'center',
            outline: 'none',
            padding: 0
          }}
          title="Jam (00 s/d 23). Ketik angka atau tekan panah atas/bawah."
        />
        <span style={{ color: '#00d2ff', fontWeight: 900, fontSize: '1.05rem' }}>:</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localM}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); stepMinute(5); }
            if (e.key === 'ArrowDown') { e.preventDefault(); stepMinute(-5); }
          }}
          style={{
            width: 32,
            height: 28,
            background: 'rgba(0, 85, 160, 0.35)',
            border: '1px solid rgba(0, 210, 255, 0.45)',
            borderRadius: 5,
            color: '#FFF8E7',
            fontSize: '0.98rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'center',
            outline: 'none',
            padding: 0
          }}
          title="Menit (00 s/d 59). Ketik angka atau tekan panah atas/bawah."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 2 }}>
          <button
            type="button"
            onClick={() => stepMinute(15)}
            style={{
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              color: '#00d2ff',
              borderRadius: 3,
              width: 16,
              height: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0
            }}
            title="Tambah 15 Menit"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => stepMinute(-15)}
            style={{
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              color: '#00d2ff',
              borderRadius: 3,
              width: 16,
              height: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0
            }}
            title="Kurang 15 Menit"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export const RekapDataQC = () => {
  const {
    overtimeRecords,
    updateOvertimeRecord,
    deleteOvertimeRecord,
    plants,
    shifts,
    monthList,
    employees,
    calculateTUL,
    showToast,
    currentUser,
    isAdmin,
    isKaryawan,
    getAllowedPlants
  } = useQC();

  const allowedPlants = useMemo(() => {
    return getAllowedPlants ? getAllowedPlants() : ['Plant Hose', 'Plant Molded', 'Plant Subcont', 'Plant Lab Mixing', 'Plant RVI', 'Plant QRE'];
  }, [getAllowedPlants, currentUser]);

  // Local Filter States
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(['September 2026']);
  const [selectedTanggal, setSelectedTanggal] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Digital Clock
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentDateTime(`${day} ${month} ${year} • ${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pagination State (10 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' | 'csv' | 'copy' | 'print'
  const [exportScope, setExportScope] = useState('filtered'); // 'filtered' | 'all'

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Slicer Items
  const plantItems = useMemo(() => plants.filter(p => allowedPlants.includes(p.name)).map(p => ({ value: p.name, label: p.name })), [plants, allowedPlants]);
  const shiftItems = useMemo(() => ['Shift 1', 'Shift 2'].map(s => ({ value: s, label: s })), []);
  const monthItems = useMemo(() => monthList.map(m => ({ value: m, label: m })), [monthList]);
  const employeeItems = useMemo(() => employees.filter(emp => allowedPlants.includes(emp.plant)).map(emp => ({
    value: emp.npk,
    label: `${emp.name} (${emp.npk} - ${emp.plant})`
  })), [employees, allowedPlants]);

  // Tanggal Slicer Items (Dinamis sampai hari ini)
  const tanggalItems = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = String(today.getMonth() + 1).padStart(2, '0');
    const currentDayNum = today.getDate();
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonthShort = monthNames[today.getMonth() + 1];

    const items = [];
    for (let d = currentDayNum; d >= 1; d--) {
      const dStr = String(d).padStart(2, '0');
      const dateVal = `${currentYear}-${currentMonthNum}-${dStr}`;
      items.push({
        value: dateVal,
        label: `${dStr} ${currentMonthShort} ${currentYear}`
      });
    }

    const existingValues = new Set(items.map(i => i.value));
    overtimeRecords.filter(r => allowedPlants.includes(r.plant)).forEach(r => {
      if (r.tglOvertime && !existingValues.has(r.tglOvertime)) {
        const parts = r.tglOvertime.split('-');
        const dayNum = parts[2] || r.tglOvertime;
        const mIdx = parseInt(parts[1], 10);
        const mLabel = monthNames[mIdx] || 'Sep';
        const yLabel = parts[0] || String(currentYear);
        items.push({
          value: r.tglOvertime,
          label: `${dayNum} ${mLabel} ${yLabel}`
        });
        existingValues.add(r.tglOvertime);
      }
    });

    return items;
  }, [overtimeRecords, allowedPlants]);

  // Filter Records (with shift normalization and smart multi-token search)
  const filteredRecords = useMemo(() => {
    return overtimeRecords
      .map(item => ({
        ...item,
        shift: item.shift === 'Shift 3' ? 'Shift 2' : (item.shift || 'Shift 1')
      }))
      .filter(item => {
        // Plant boundary check for user permissions
        if (!allowedPlants.includes(item.plant)) {
          return false;
        }
        // Month Filter
        if (selectedMonths.length > 0 && !selectedMonths.includes(item.month)) {
          return false;
        }
        // Tanggal Filter
        if (selectedTanggal.length > 0 && !selectedTanggal.includes(item.tglOvertime)) {
          return false;
        }
        // Shift Filter
        if (selectedShifts.length > 0 && !selectedShifts.includes(item.shift)) {
          return false;
        }
        // Plant Filter
        if (selectedPlants.length > 0 && !selectedPlants.includes(item.plant)) {
          return false;
        }
        // Employee Filter
        if (selectedEmployees.length > 0 && !selectedEmployees.includes(item.npk)) {
          return false;
        }
        // Universal Smart Multi-Token Search (NPK, nama, plant, shift, tanggal, bulan, jam, dsb)
        if (searchQuery && searchQuery.trim()) {
          let rawQuery = searchQuery.toLowerCase().trim();

          const itemNama = (item.nama || '').toLowerCase();
          const itemNpk = (item.npk || '').toLowerCase();
          const itemNpkDigits = itemNpk.replace(/[^0-9]/g, '');
          const itemPlant = (item.plant || '').toLowerCase();
          const itemPlantShort = itemPlant.replace(/^plant\s*/i, '');
          const itemShift = (item.shift || '').toLowerCase(); // e.g. "shift 1", "shift 2"
          const itemShiftDigits = itemShift.replace(/[^0-9]/g, ''); // "1" or "2"
          const itemTgl = (item.tglOvertime || '').toLowerCase();
          const itemMonth = (item.month || '').toLowerCase();
          const itemJam = String(item.jamOvertime || '');
          const itemTul = String(item.totalTUL || '');

          // 1. Precise Shift Phrase Interception
          let queryRequiresShift = null;
          if (/\b(shift\s*1|shift1|s1|shift-1|malam)\b/i.test(rawQuery)) {
            queryRequiresShift = '1';
            rawQuery = rawQuery.replace(/\b(shift\s*1|shift1|s1|shift-1|malam)\b/gi, ' ').trim();
          } else if (/\b(shift\s*2|shift2|s2|shift-2|pagi|siang)\b/i.test(rawQuery)) {
            queryRequiresShift = '2';
            rawQuery = rawQuery.replace(/\b(shift\s*2|shift2|s2|shift-2|pagi|siang)\b/gi, ' ').trim();
          }

          if (queryRequiresShift !== null) {
            if (itemShiftDigits !== queryRequiresShift) {
              return false;
            }
          }

          // If query was ONLY shift (e.g. "shift 1" or "shift 2" or "malam" or "pagi"), and nothing else left:
          if (!rawQuery || !rawQuery.trim()) {
            return true;
          }

          // Generate extensive date variations (Indonesian full month, abbreviations, slash, dash)
          const dateVariants = [itemTgl, itemMonth];
          if (itemTgl && itemTgl.includes('-')) {
            const parts = itemTgl.split('-');
            const y = parts[0];
            const m = parseInt(parts[1], 10);
            const d = parts[2];
            const dNum = parseInt(d, 10);
            const mNames = ['', 'januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
            const mShorts = ['', 'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
            if (m >= 1 && m <= 12) {
              dateVariants.push(
                `${d} ${mNames[m]} ${y}`,
                `${dNum} ${mNames[m]} ${y}`,
                `${d} ${mShorts[m]} ${y}`,
                `${dNum} ${mShorts[m]} ${y}`,
                `${d} ${mNames[m]}`,
                `${dNum} ${mNames[m]}`,
                `${d} ${mShorts[m]}`,
                `${dNum} ${mShorts[m]}`,
                `${d}/${m}/${y}`,
                `${d}/${parts[1]}/${y}`,
                `${dNum}/${m}/${y}`,
                `${d}/${m}`,
                `${dNum}/${m}`
              );
            }
          }

          const tokens = rawQuery.split(/\s+/).filter(Boolean);

          // Construct corpus for remaining tokens
          const corpus = [
            itemNama,
            itemNpk,
            itemNpkDigits,
            itemPlant,
            itemPlantShort,
            ...dateVariants,
            `${itemJam} jam`,
            `${itemTul} tul`
          ].join(' ').toLowerCase();

          // Check each token
          const allMatch = tokens.every(token => {
            // If user simply typed "shift" without number
            if (token === 'shift') {
              return Boolean(item.shift);
            }
            const clean = token.replace(/[^a-z0-9]/g, '');
            return corpus.includes(token) || (clean && corpus.includes(clean));
          });

          if (!allMatch) return false;
        }
        return true;
      });
  }, [overtimeRecords, selectedPlants, selectedShifts, selectedMonths, selectedTanggal, selectedEmployees, searchQuery, allowedPlants]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Helper for Pagination numbers
  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 2, total - 1, total];
    }
    return [1, '...', current, '...', total];
  };

  // KPI Calculations
  const totalRecords = filteredRecords.length;
  const totalHours = filteredRecords.reduce((sum, item) => sum + (Number(item.jamOvertime) || 0), 0);
  const totalTUL = filteredRecords.reduce((sum, item) => sum + (Number(item.totalTUL) || 0), 0);
  const uniqueEmployees = new Set(filteredRecords.map(item => item.npk)).size;
  // Reset Filters
  const handleResetFilters = () => {
    setSelectedPlants([]);
    setSelectedShifts([]);
    setSelectedMonths(['September 2026']);
    setSelectedTanggal([]);
    setSelectedEmployees([]);
    setSearchQuery('');
    setCurrentPage(1);
    showToast('Semua filter berhasil direset.', 'info');
  };

  // Helper Plant Badge Colors
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

  // Helper to calculate hours diff based on shift overtime rules
  const calculateEditHoursDiff = (sft, start, end, isHol) => {
    if (!start || !end) return null;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diffM = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffM < 0) diffM += 24 * 60;
    
    if (isHol) {
      return Number((diffM / 60).toFixed(2));
    }

    const startMin = sH * 60 + sM;
    if (sft === 'Shift 1') {
      if (diffM >= 9 * 60 && (startMin >= 21 * 60 || startMin <= 1 * 60)) {
        const otMin = diffM - 9 * 60;
        return otMin > 0 ? Number((otMin / 60).toFixed(2)) : 0;
      }
      return Number((diffM / 60).toFixed(2));
    } else {
      if (diffM >= 9 * 60 && (startMin >= 6 * 60 && startMin <= 9 * 60)) {
        const otMin = diffM - 9 * 60;
        return otMin > 0 ? Number((otMin / 60).toFixed(2)) : 0;
      }
      return Number((diffM / 60).toFixed(2));
    }
  };

  const addEditHours = (start, hrs) => {
    if (!start) return '';
    const [sH, sM] = start.split(':').map(Number);
    const totalM = sH * 60 + sM + Math.round(hrs * 60);
    const newH = Math.floor(totalM / 60) % 24;
    const newM = totalM % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat mengedit data lembur.', 'danger');
      return;
    }
    let jamM = item.jamMasuk || '17:00';
    let jamP = item.jamPulang || '19:00';
    if (!item.jamMasuk && item.jamWaktu && item.jamWaktu.includes('-')) {
      const parts = item.jamWaktu.split('-').map(s => s.trim());
      jamM = parts[0] || '17:00';
      jamP = parts[1] || '19:00';
    } else if (!item.jamMasuk && item.jamWaktu) {
      jamM = item.jamWaktu;
      jamP = addEditHours(jamM, Number(item.jamOvertime) || 2);
    }

    setEditingRecord({
      ...item,
      shift: item.shift === 'Shift 3' ? 'Shift 2' : (item.shift || 'Shift 1'),
      jamMasuk: jamM,
      jamPulang: jamP,
      jamWaktu: `${jamM} - ${jamP}`,
      jamOvertime: item.jamOvertime || 2
    });
    setShowEditModal(true);
  };

  // Handle Plant Change in Edit Modal (autofill employee from that plant)
  const handleEditPlantChange = (newPlant) => {
    const emps = employees.filter(e => e.plant === newPlant);
    if (emps.length > 0) {
      setEditingRecord(prev => ({
        ...prev,
        plant: newPlant,
        nama: emps[0].name,
        npk: emps[0].npk,
        shift: emps[0].shift || prev.shift
      }));
    } else {
      setEditingRecord(prev => ({
        ...prev,
        plant: newPlant
      }));
    }
  };

  // Handle Employee Change in Edit Modal
  const handleEditEmployeeChange = (selectedName) => {
    const emp = employees.find(e => e.name.toLowerCase() === selectedName.trim().toLowerCase());
    if (emp) {
      setEditingRecord(prev => ({
        ...prev,
        nama: emp.name,
        npk: emp.npk,
        plant: emp.plant || prev.plant
      }));
    } else {
      setEditingRecord(prev => ({
        ...prev,
        nama: selectedName
      }));
    }
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editingRecord.nama.trim()) {
      showToast('Nama Karyawan tidak boleh kosong.', 'warning');
      return;
    }
    if (!editingRecord.npk.trim()) {
      showToast('NPK Karyawan tidak boleh kosong.', 'warning');
      return;
    }
    const jamNum = parseFloat(editingRecord.jamOvertime) || 0;
    if (jamNum <= 0) {
      showToast('Durasi lembur harus lebih dari 0.', 'warning');
      return;
    }
    if (editingRecord.isHoliday && jamNum > 7) {
      showToast('Maksimal lembur hari libur (H.O.T) adalah 7 Jam (tidak boleh lebih).', 'danger');
      return;
    }

    const jamM = editingRecord.jamMasuk || '17:00';
    const jamP = editingRecord.jamPulang || '19:00';

    updateOvertimeRecord({
      ...editingRecord,
      jamMasuk: jamM,
      jamPulang: jamP,
      jamWaktu: `${jamM} - ${jamP}`,
      jamOvertime: jamNum
    });

    setShowEditModal(false);
    setEditingRecord(null);
  };

  // Process Export with User Chosen Options (Hanya untuk Admin)
  const handleExecuteExport = () => {
    if (!isAdmin) {
      showToast('Akses ditolak: Hanya Admin yang dapat mengekspor data.', 'danger');
      return;
    }
    const targetData = exportScope === 'all'
      ? overtimeRecords.map(item => ({ ...item, shift: item.shift === 'Shift 3' ? 'Shift 2' : (item.shift || 'Shift 1') }))
      : filteredRecords;

    if (targetData.length === 0) {
      showToast('Tidak ada data untuk diekspor.', 'warning');
      return;
    }

    const headers = ['No', 'Tanggal', 'Jam / Waktu', 'Plant', 'NPK', 'Nama Karyawan', 'Shift', 'Jam Overtime', 'Total TUL'];
    const rows = targetData.map((item, index) => [
      index + 1,
      item.tglOvertime || '',
      item.jamWaktu || (item.timestamp ? item.timestamp.split(' ')[1] : ''),
      item.plant || '',
      item.npk || '',
      item.nama || '',
      item.shift || '',
      item.jamOvertime ? `${item.jamOvertime} Jam` : '0 Jam',
      item.totalTUL ? `${item.totalTUL} TUL` : '0 TUL'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];

    // Format 1: Salin ke Clipboard
    if (exportFormat === 'copy') {
      const tsvContent = [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
      navigator.clipboard.writeText(tsvContent).then(() => {
        showToast(`Berhasil menyalin ${targetData.length} baris data ke clipboard!`, 'success');
        setShowExportModal(false);
      }).catch(() => {
        showToast('Gagal menyalin data ke clipboard.', 'danger');
      });
      return;
    }

    // Format 2: Cetak / Print PDF
    if (exportFormat === 'print') {
      setShowExportModal(false);
      setTimeout(() => {
        window.print();
      }, 300);
      return;
    }

    // Format 3: CSV Spreadsheet
    if (exportFormat === 'csv') {
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekap_Overtime_${exportScope === 'all' ? 'SEMUA' : 'TERFILTER'}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`File CSV (${targetData.length} data) berhasil diunduh.`, 'success');
      setShowExportModal(false);
      return;
    }

    // Format 4: Microsoft Excel (.xls)
    if (exportFormat === 'excel') {
      const excelHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #0369a1; padding: 8px 12px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 6px 10px; color: #0f172a; }
            tr:nth-child(even) { background-color: #f1f5f9; }
            .header-title { font-size: 16pt; font-weight: bold; color: #0369a1; margin-bottom: 4px; }
            .header-sub { font-size: 10pt; color: #64748b; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="header-title">REKAP DATA OVERTIME - Q-WORKS</div>
          <div class="header-sub">Tanggal Ekspor: ${new Date().toLocaleString('id-ID')} | Cakupan: ${exportScope === 'all' ? 'Semua Data' : 'Data Terfilter'} (${targetData.length} Data Record)</div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekap_Overtime_${exportScope === 'all' ? 'SEMUA' : 'TERFILTER'}_${dateStr}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`File Excel (.xls) (${targetData.length} data) berhasil diunduh.`, 'success');
      setShowExportModal(false);
      return;
    }
  };

  return (
    <div
      className="page-content"
      style={{
        width: '100%',
        maxWidth: '100%',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. TOP EXECUTIVE HERO BANNER */}
      <div className="dashboard-hero-mockup-card" style={{ marginBottom: 0 }}>
        <div className="hero-mockup-left">
          <div className="hero-glowing-icon">
            <FileSpreadsheet size={22} color="#ffffff" />
          </div>
          <div className="hero-text-block">
            <span className="hero-dept-tag">QUALITY CONTROL</span>
            <h1 className="hero-main-title">Rekap Data Overtime</h1>
            <span className="hero-desc">
              Monitoring dan rekap data lembur harian per plant terintegrasi dengan perhitungan TUL.
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
            <span className="hero-status-time">{currentDateTime}</span>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 METRIC KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Card 1: TOTAL RECORD DATA */}
        <div
          style={{
            background: 'rgba(9, 24, 52, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
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
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total Data Overtime</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {totalRecords} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Data</span>
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL JAM LEMBUR */}
        <div
          style={{
            background: 'rgba(9, 24, 52, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
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

        {/* Card 3: TOTAL TUL */}
        <div
          style={{
            background: 'rgba(9, 24, 52, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
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
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total TUL</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
              {totalTUL} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>TUL</span>
            </div>
          </div>
        </div>

        {/* Card 4: TOTAL KARYAWAN */}
        <div
          style={{
            background: 'rgba(9, 24, 52, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Total Karyawan</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#c084fc', lineHeight: 1.2 }}>
              {uniqueEmployees} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Orang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FILTER PARAMETER CARD (Exact Master Pekerja layout) */}
      <div className="filter-parameter-mockup-card">
        <div className="filter-parameter-top-row">
          <div className="filter-parameter-title-group">
            <Filter size={16} color="#8CC1E9" />
            <span className="filter-param-header-text">Filter Parameter</span>
            <span className="filter-live-pill">Live Filter</span>
          </div>
          <div className="filter-parameter-actions">
            <button className="btn-filter-reset" onClick={handleResetFilters}>
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            {isAdmin && (
              <button className="btn-filter-export" onClick={() => setShowExportModal(true)}>
                <Download size={14} />
                <span>Export Data</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Filter Dropdowns Grid */}
        <div className="filter-boxes-grid">
          {/* 1. Bulan */}
          <FilterPopover
            title="PILIH BULAN"
            label="Bulan"
            icon={<Calendar size={16} color="#8CC1E9" />}
            items={monthItems}
            selectedValues={selectedMonths}
            onChange={(vals) => { setSelectedMonths(vals); setCurrentPage(1); }}
          />

          {/* 2. Tanggal */}
          <FilterPopover
            title="PILIH TANGGAL"
            label="Tanggal"
            icon={<Calendar size={16} color="#8CC1E9" />}
            items={tanggalItems}
            selectedValues={selectedTanggal}
            onChange={(vals) => { setSelectedTanggal(vals); setCurrentPage(1); }}
          />

          {/* 3. Shift */}
          <FilterPopover
            title="PILIH SHIFT"
            label="Shift"
            icon={<Clock size={16} color="#8CC1E9" />}
            items={shiftItems}
            selectedValues={selectedShifts}
            onChange={(vals) => { setSelectedShifts(vals); setCurrentPage(1); }}
          />

          {/* 4. Plant */}
          <FilterPopover
            title="PILIH PLANT"
            label="Plant"
            icon={<Building2 size={16} color="#8CC1E9" />}
            items={plantItems}
            selectedValues={selectedPlants}
            onChange={(vals) => { setSelectedPlants(vals); setCurrentPage(1); }}
          />

          {/* 5. Karyawan */}
          <FilterPopover
            title="PILIH KARYAWAN"
            label="Karyawan"
            icon={<Users size={16} color="#8CC1E9" />}
            items={employeeItems}
            selectedValues={selectedEmployees}
            onChange={(vals) => { setSelectedEmployees(vals); setCurrentPage(1); }}
            width={280}
            align="right"
          />
        </div>

        {/* Universal Search Bar */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(10, 22, 45, 0.85)',
            border: '1.5px solid rgba(67, 139, 196, 0.35)',
            borderRadius: 10,
            padding: '0 14px',
            height: 42
          }}
        >
          <Search size={16} color="#8CC1E9" style={{ marginRight: 10, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Cari NPK, nama, plant, shift, tanggal..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8CC1E9',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN DATA RECORD TABLE */}
      <div
        style={{
          background: 'linear-gradient(145deg, #091a38 0%, #0d2654 100%)',
          border: '1.5px solid rgba(67, 139, 196, 0.35)',
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(180deg, #091a38 0%, #071226 100%)', borderBottom: '2px solid rgba(56, 189, 248, 0.25)' }}>
                <th style={{ width: '6%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No.</th>
                <th style={{ width: '15%', textAlign: 'left', padding: '14px 12px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</th>
                <th style={{ width: '16%', textAlign: 'center', padding: '14px 10px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plant</th>
                <th style={{ width: '26%', textAlign: 'left', padding: '14px 12px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Karyawan & NPK</th>
                <th style={{ width: '14%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jam Lembur</th>
                <th style={{ width: '11%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TUL</th>
                <th style={{ width: '12%', textAlign: 'center', padding: '14px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px 20px', color: '#8ca8cf' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <FileSpreadsheet size={40} color="#64748b" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                        Tidak ada data record lembur yang cocok dengan kriteria filter.
                      </span>
                      <button
                        onClick={handleResetFilters}
                        style={{
                          backgroundColor: 'rgba(0, 110, 220, 0.2)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          padding: '6px 16px',
                          borderRadius: 8,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: 6
                        }}
                      >
                        Reset Semua Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  const plantStyle = getPlantBadgeStyle(item.plant);
                  const initialLetter = item.nama ? item.nama.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        backgroundColor: index % 2 === 0
                          ? 'rgba(9, 26, 56, 0.4)'
                          : 'rgba(13, 38, 84, 0.25)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(9, 26, 56, 0.4)' : 'rgba(13, 38, 84, 0.25)'}
                    >
                      {/* 1. No. */}
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
                          {globalIndex}
                        </span>
                      </td>

                      {/* 2. Tanggal */}
                      <td style={{ whiteSpace: 'nowrap', padding: '12px 12px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            color: '#f1f5f9',
                            fontSize: '0.86rem',
                            fontWeight: 700
                          }}
                        >
                          <Calendar size={14} color="#00d2ff" />
                          <span>{item.tglOvertime || '2026-09-01'}</span>
                        </div>
                      </td>

                      {/* 3. Plant */}
                      <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: plantStyle.bg,
                            color: plantStyle.text,
                            border: plantStyle.border,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Building2 size={12} />
                          {item.plant}
                        </span>
                      </td>

                      {/* 4. Karyawan & NPK */}
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7 0%, #0055a0 100%)',
                              border: '1.5px solid rgba(0, 210, 255, 0.5)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}
                          >
                            {initialLetter}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.90rem' }}>
                                {item.nama}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.70rem',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  background: item.shift === 'Shift 2' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: item.shift === 'Shift 2' ? '#38bdf8' : '#fbbf24',
                                  border: item.shift === 'Shift 2' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
                                }}
                              >
                                {item.shift}
                              </span>
                            </div>
                            <span
                              style={{
                                color: '#8ca8cf',
                                fontSize: '0.78rem',
                                fontFamily: 'JetBrains Mono, monospace'
                              }}
                            >
                              NPK: {item.npk}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Jam Lembur */}
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              color: '#38bdf8',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}
                          >
                            <Clock size={13} color="#38bdf8" />
                            {item.jamOvertime} Jam
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#8ca8cf',
                              fontFamily: 'JetBrains Mono, monospace'
                            }}
                          >
                            {(item.jamWaktu && item.jamWaktu !== '-')
                              ? item.jamWaktu
                              : getFallbackJamWaktu(item.shift, item.jamOvertime, item.isHoliday)}
                          </span>
                        </div>
                      </td>

                      {/* 6. Total TUL */}
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 11px',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            backgroundColor: 'rgba(16, 185, 129, 0.16)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.totalTUL} TUL
                        </span>
                      </td>

                      {/* 7. Aksi (Edit & Delete untuk Admin, Lihat Saja untuk Karyawan) */}
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                        {isAdmin ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Data Lembur"
                              style={{
                                backgroundColor: 'rgba(0, 110, 220, 0.18)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                width: 30,
                                height: 30,
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
                              <Pencil size={13} />
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus data lembur ${item.nama} (${item.tglOvertime})?`)) {
                                  deleteOvertimeRecord(item.id);
                                }
                              }}
                              title="Hapus Data Record"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#f87171',
                                width: 30,
                                height: 30,
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
                              <Trash2 size={13} />
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
                              Hanya Lihat
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

        {/* 4. PAGINATION FOOTER BAR (Matching user screenshot) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid rgba(67, 139, 196, 0.2)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ color: '#8ca8cf', fontSize: '0.85rem', fontWeight: 500 }}>
            {filteredRecords.length === 0
              ? 'Menampilkan 0 data'
              : `Menampilkan ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredRecords.length)} dari ${filteredRecords.length} data`}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: currentPage === 1 ? 'rgba(140, 168, 207, 0.3)' : '#8ca8cf',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                ‹
              </button>

              {/* Page Numbers */}
              {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} style={{ color: '#8ca8cf', padding: '0 4px', fontSize: '0.85rem' }}>
                      ...
                    </span>
                  );
                }
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                      border: isActive ? '1.5px solid #38bdf8' : 'none',
                      color: isActive ? '#ffffff' : '#8ca8cf',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: currentPage === totalPages ? 'rgba(140, 168, 207, 0.3)' : '#8ca8cf',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: EDIT OVERTIME RECORD MODAL */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, width: '92%' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #38bdf8'
                  }}
                >
                  <Pencil size={18} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                    EDIT DATA OVERTIME
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Perbarui rincian data lembur karyawan
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 24px' }}>
                {/* 1. PLANT */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                    <Building2 size={13} style={{ display: 'inline', marginRight: 5 }} />
                    PLANT
                  </label>
                  <select
                    className="form-select"
                    value={editingRecord.plant}
                    onChange={(e) => handleEditPlantChange(e.target.value)}
                    required
                  >
                    {plants.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. NAMA KARYAWAN */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                    <User size={13} style={{ display: 'inline', marginRight: 5 }} />
                    NAMA KARYAWAN
                  </label>
                  <input
                    type="text"
                    list="edit-karyawan-datalist"
                    className="form-input"
                    value={editingRecord.nama}
                    onChange={(e) => handleEditEmployeeChange(e.target.value)}
                    placeholder="Ketik atau pilih nama karyawan..."
                    required
                    style={{ padding: '0 12px', height: 38, fontSize: '0.85rem' }}
                  />
                  <datalist id="edit-karyawan-datalist">
                    {employees
                      .filter(e => e.plant === editingRecord.plant)
                      .map(emp => (
                        <option key={emp.npk} value={emp.name} />
                      ))}
                  </datalist>
                </div>

                {/* 3. NPK */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                    <FileText size={13} style={{ display: 'inline', marginRight: 5 }} />
                    NPK
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingRecord.npk}
                    onChange={(e) => setEditingRecord({ ...editingRecord, npk: e.target.value })}
                    required
                  />
                </div>

                {/* 4. SHIFT */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                    <Layers size={13} style={{ display: 'inline', marginRight: 5 }} />
                    SHIFT
                  </label>
                  <div style={{ display: 'flex', gap: 20, paddingTop: 4 }}>
                    {shifts.map(s => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="editShift"
                          value={s}
                          checked={editingRecord.shift === s}
                          onChange={() => setEditingRecord({ ...editingRecord, shift: s })}
                          style={{ accentColor: '#38bdf8' }}
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. TGL OVERTIME (OTOMATIS KALENDER) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />
                      TGL OVERTIME
                    </label>
                    {(() => {
                      const dInfo = getDayTypeInfo(editingRecord.tglOvertime);
                      return (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: dInfo.isHoliday ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                            color: dInfo.isHoliday ? '#fbbf24' : '#38bdf8'
                          }}
                        >
                          {dInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                  <input
                    type="date"
                    className="form-input"
                    value={editingRecord.tglOvertime}
                    onChange={(e) => {
                      const newTgl = e.target.value;
                      const hol = isWeekendOrHoliday(newTgl);
                      setEditingRecord(prev => ({
                        ...prev,
                        tglOvertime: newTgl,
                        isHoliday: hol
                      }));
                    }}
                    required
                  />
                </div>

                {/* 6. ACTUAL TIME: JAM MASUK (START) & JAM PULANG (TO) */}
                {(() => {
                  const mVal = editingRecord.jamMasuk || (editingRecord.shift === 'Shift 1' ? '07:30' : '16:30');
                  const pVal = editingRecord.jamPulang || (editingRecord.shift === 'Shift 1' ? '09:30' : '18:30');

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <TimeInput24
                        label="Masuk"
                        value={mVal}
                        onChange={(newM) => {
                          const hrs = calculateEditHoursDiff(editingRecord.shift, newM, pVal, editingRecord.isHoliday);
                          setEditingRecord(prev => ({
                            ...prev,
                            jamMasuk: newM,
                            jamOvertime: hrs !== null && hrs > 0 ? hrs : prev.jamOvertime
                          }));
                        }}
                      />

                      <TimeInput24
                        label="Pulang"
                        value={pVal}
                        onChange={(newP) => {
                          const hrs = calculateEditHoursDiff(editingRecord.shift, mVal, newP, editingRecord.isHoliday);
                          setEditingRecord(prev => ({
                            ...prev,
                            jamPulang: newP,
                            jamOvertime: hrs !== null && hrs > 0 ? hrs : prev.jamOvertime
                          }));
                        }}
                      />
                    </div>
                  );
                })()}

                {/* 8. DURASI OVERTIME */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                      <Flame size={13} style={{ display: 'inline', marginRight: 5 }} />
                      DURASI OVERTIME (JAM)
                    </label>
                    <span style={{ fontSize: '0.70rem', color: '#8CC1E9', fontWeight: 600 }}>
                      ✓ Otomatis dari Jam Masuk - Pulang
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    className="form-input"
                    value={editingRecord.jamOvertime}
                    onChange={(e) => {
                      const dur = e.target.value;
                      const num = parseFloat(dur);
                      const start = editingRecord.jamMasuk || '17:00';
                      setEditingRecord(prev => ({
                        ...prev,
                        jamOvertime: dur,
                        jamPulang: !isNaN(num) && num > 0 ? addEditHours(start, num) : prev.jamPulang
                      }));
                    }}
                    required
                  />

                  {/* Quick Hour Chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {['1', '1.5', '2', '3', '4', '8'].map(hrs => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => {
                          const start = editingRecord.jamMasuk || '17:00';
                          setEditingRecord(prev => ({
                            ...prev,
                            jamOvertime: hrs,
                            jamPulang: addEditHours(start, parseFloat(hrs))
                          }));
                        }}
                        style={{
                          backgroundColor: String(editingRecord.jamOvertime) === hrs ? 'rgba(0, 85, 160, 0.45)' : 'rgba(255, 255, 255, 0.04)',
                          border: String(editingRecord.jamOvertime) === hrs ? '1px solid #8CC1E9' : '1px solid rgba(140, 193, 233, 0.15)',
                          color: String(editingRecord.jamOvertime) === hrs ? '#FFF8E7' : '#8CC1E9',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {hrs} Jam
                      </button>
                    ))}
                  </div>
                </div>

                {/* 9. LIVE TUL PREVIEW BOX & FORMULA BREAKDOWN */}
                <div
                  style={{
                    backgroundColor: editingRecord.isHoliday ? 'rgba(245, 158, 11, 0.12)' : 'rgba(18, 40, 75, 0.75)',
                    border: editingRecord.isHoliday ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(140, 193, 233, 0.35)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF8E7', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calculator size={15} color={editingRecord.isHoliday ? '#fbbf24' : '#8CC1E9'} />
                      TOTAL TUL HASIL EDIT ({editingRecord.isHoliday ? 'HARI LIBUR & MINGGU' : 'HARI KERJA'})
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(prev => ({ ...prev, isHoliday: false }))}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: !editingRecord.isHoliday ? '1px solid #00d2ff' : '1px solid rgba(67, 139, 196, 0.3)',
                          background: !editingRecord.isHoliday ? 'rgba(0, 136, 255, 0.4)' : 'rgba(10, 22, 45, 0.6)',
                          color: !editingRecord.isHoliday ? '#FFF8E7' : '#8CC1E9'
                        }}
                      >
                        D.O.T
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(prev => ({ ...prev, isHoliday: true }))}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: editingRecord.isHoliday ? '1px solid #fbbf24' : '1px solid rgba(67, 139, 196, 0.3)',
                          background: editingRecord.isHoliday ? 'rgba(245, 158, 11, 0.35)' : 'rgba(10, 22, 45, 0.6)',
                          color: editingRecord.isHoliday ? '#fbbf24' : '#8CC1E9'
                        }}
                      >
                        H.O.T
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '0.76rem', color: editingRecord.isHoliday ? '#fbbf24' : '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {getTULBreakdown(editingRecord.jamOvertime, editingRecord.isHoliday).formula}
                    </div>
                    <span style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: editingRecord.isHoliday ? '#fbbf24' : '#FFF8E7' }}>
                      {calculateTUL(editingRecord.jamOvertime, editingRecord.isHoliday)} <span style={{ fontSize: '0.8rem', color: '#8CC1E9' }}>TUL</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(140, 193, 233, 0.2)',
                    color: '#8CC1E9',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-export"
                  style={{
                    background: 'linear-gradient(135deg, #0055A0, #438BC4)',
                    padding: '8px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255, 248, 231, 0.3)',
                    color: '#FFF8E7'
                  }}
                >
                  <Save size={16} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT OPTIONS MODAL DIALOG */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, width: '92%' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: 'rgba(0, 85, 160, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #8CC1E9'
                  }}
                >
                  <Download size={18} color="#8CC1E9" />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF8E7' }}>
                    PILIHAN EKSPOR DATA OVERTIME
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8CC1E9' }}>
                    Pilih format file dan cakupan data yang ingin diunduh
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowExportModal(false)}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 24px' }}>
              {/* SECTION 1: PILIH FORMAT EKSPOR */}
              <div>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                  1. PILIH FORMAT FILE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {/* Format 1: Microsoft Excel (.xls) */}
                  <div
                    onClick={() => setExportFormat('excel')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: exportFormat === 'excel' ? '2px solid #8CC1E9' : '1px solid rgba(140, 193, 233, 0.2)',
                      backgroundColor: exportFormat === 'excel' ? 'rgba(0, 85, 160, 0.35)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <FileSpreadsheet size={22} color={exportFormat === 'excel' ? '#8CC1E9' : '#94a3b8'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportFormat === 'excel' ? '#FFF8E7' : '#e2e8f0' }}>
                        Microsoft Excel (.xls)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8CC1E9', marginTop: 2 }}>
                        Format tabel spreadsheet siap olah dengan styling rapi
                      </div>
                    </div>
                  </div>

                  {/* Format 2: CSV File (.csv) */}
                  <div
                    onClick={() => setExportFormat('csv')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: exportFormat === 'csv' ? '2px solid #8CC1E9' : '1px solid rgba(140, 193, 233, 0.2)',
                      backgroundColor: exportFormat === 'csv' ? 'rgba(0, 85, 160, 0.35)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <FileText size={22} color={exportFormat === 'csv' ? '#8CC1E9' : '#94a3b8'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportFormat === 'csv' ? '#FFF8E7' : '#e2e8f0' }}>
                        CSV Spreadsheet (.csv)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        Format standar universal kompatibel semua aplikasi
                      </div>
                    </div>
                  </div>

                  {/* Format 3: Copy Clipboard */}
                  <div
                    onClick={() => setExportFormat('copy')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: exportFormat === 'copy' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: exportFormat === 'copy' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <Copy size={22} color={exportFormat === 'copy' ? '#a855f7' : '#94a3b8'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportFormat === 'copy' ? '#c084fc' : '#e2e8f0' }}>
                        Salin ke Clipboard
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        Langsung tempel (Ctrl+V) ke Excel atau WhatsApp
                      </div>
                    </div>
                  </div>

                  {/* Format 4: Cetak / Print PDF */}
                  <div
                    onClick={() => setExportFormat('print')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: exportFormat === 'print' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: exportFormat === 'print' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <Printer size={22} color={exportFormat === 'print' ? '#f59e0b' : '#94a3b8'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: exportFormat === 'print' ? '#fbbf24' : '#e2e8f0' }}>
                        Cetak / PDF
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        Buka dialog print browser untuk cetak atau simpan PDF
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CAKUPAN DATA */}
              <div>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                  2. CAKUPAN DATA YANG DIEKSPOR
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Scope 1: Filtered */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: exportScope === 'filtered' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: exportScope === 'filtered' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'filtered'}
                        onChange={() => setExportScope('filtered')}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                          Data Hasil Filter Saat Ini
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                          Hanya mengekspor data yang sesuai filter aktif di layar
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                      {filteredRecords.length} Baris
                    </span>
                  </label>

                  {/* Scope 2: All */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: exportScope === 'all' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: exportScope === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'all'}
                        onChange={() => setExportScope('all')}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                          Semua Data Lembur (Master Record)
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                          Mengekspor seluruh data transaksi lembur tanpa terpengaruh filter
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                      {overtimeRecords.length} Baris
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowExportModal(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="btn-export"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  padding: '8px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Download size={16} />
                <span>
                  {exportFormat === 'copy' ? 'Salin Sekarang' : exportFormat === 'print' ? 'Cetak Sekarang' : 'Unduh File'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

