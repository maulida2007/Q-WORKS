import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  User,
  Calendar,
  Layers,
  Sparkles,
  Check,
  Building2,
  FileText,
  Calculator,
  Flame,
  UserPlus,
  X,
  ClipboardPenLine,
  Table,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Moon,
  Sun,
  Send,
  Search,
  ChevronDown
} from 'lucide-react';
import { useQC } from '../context/QCContext';
import { isWeekendOrHoliday, getDayTypeInfo, getTULBreakdown } from '../data/mockData';
import {
  SHIFT_DEFINITIONS,
  getShiftWindow,
  calculateOvertimeDuration
} from '../utils/overtimeCalculator';

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
        {/* Hour Input Box */}
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
          title="Jam 24-Format (00 s/d 23). Ketik angka atau tekan panah atas/bawah."
        />

        <span style={{ color: '#00d2ff', fontWeight: 900, fontSize: '1.05rem' }}>:</span>

        {/* Minute Input Box */}
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

        {/* Quick Steppers */}
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

export const InputDataQC = () => {
  const {
    currentView,
    plants,
    employees,
    shifts,
    addEmployee,
    addOvertimeRecord,
    calculateTUL,
    showToast,
    setCurrentView,
    currentUser,
    isAdmin,
    isKaryawan
  } = useQC();

  // Helper to determine initial plant from active dashboard view
  const getInitialPlant = () => {
    if (currentUser?.role === 'karyawan' && currentUser.plant) {
      return currentUser.plant;
    }
    switch (currentView) {
      case 'hose': return 'Plant Hose';
      case 'rvi': return 'Plant RVI';
      case 'qre': return 'Plant QRE';
      case 'subcont': return 'Plant Subcont';
      case 'mixing':
      case 'lab-mixing': return 'Plant Lab Mixing';
      case 'molded': return 'Plant Molded';
      default: return 'Plant Hose';
    }
  };

  const initialPlant = getInitialPlant();
  const initialEmp = currentUser?.role === 'karyawan'
    ? { name: currentUser.name, npk: currentUser.npk, plant: currentUser.plant || initialPlant }
    : (employees.find(e => e.plant === initialPlant) || employees[0]);
  const initialShift = initialEmp ? (initialEmp.shift || 'Shift 1') : 'Shift 1';

  // Form Fields State
  const [plant, setPlant] = useState(initialPlant);
  const [nama, setNama] = useState(initialEmp ? initialEmp.name : 'GILANG');
  const [npk, setNpk] = useState(initialEmp ? initialEmp.npk : '1747');
  const [shift, setShift] = useState(initialShift);
  const [tglOvertime, setTglOvertime] = useState(new Date().toISOString().split('T')[0]);

  // Synchronize when currentUser changes
  useEffect(() => {
    if (currentUser?.role === 'karyawan') {
      if (currentUser.name) setNama(currentUser.name);
      if (currentUser.npk) setNpk(currentUser.npk);
      if (currentUser.plant) setPlant(currentUser.plant);
    }
  }, [currentUser]);

  // Overtime category: 'POST_SHIFT' | 'PRE_SHIFT' | 'OFF_DAY' | 'CUSTOM'
  const [overtimeCategory, setOvertimeCategory] = useState('POST_SHIFT');

  // Default start & end time based on Shift 1 post-shift (07:30 - 09:30)
  const [jamMasuk, setJamMasuk] = useState('07:30');
  const [jamPulang, setJamPulang] = useState('09:30');
  const [reason, setReason] = useState('Penyortiran QC dan penuntasan target produksi');

  // Day type: auto-detected or manual override ('kerja' | 'libur' | null)
  const [manualDayType, setManualDayType] = useState(null);

  // Automatic calendar detection: Minggu & Tanggal Merah = Libur, Senin-Sabtu = Hari Kerja
  const autoDayInfo = getDayTypeInfo(tglOvertime);
  const isHoliday = manualDayType !== null ? manualDayType === 'libur' : autoDayInfo.isHoliday;
  const dayLabel = isHoliday ? 'Hari Libur & Minggu' : 'Hari Kerja (Senin - Sabtu)';

  // Real-time calculation using robust calculator
  const calcResult = useMemo(() => {
    return calculateOvertimeDuration({
      workDate: tglOvertime,
      shiftName: shift,
      jamMasuk,
      jamPulang,
      isHoliday,
      overtimeType: overtimeCategory
    });
  }, [tglOvertime, shift, jamMasuk, jamPulang, isHoliday, overtimeCategory]);

  // Live TUL calculation
  const liveTUL = useMemo(() => {
    return calculateTUL(calcResult.jamOvertime, isHoliday);
  }, [calcResult.jamOvertime, isHoliday, calculateTUL]);

  // Live TUL detailed formula breakdown
  const tulBreakdown = useMemo(() => {
    return getTULBreakdown(calcResult.jamOvertime, isHoliday);
  }, [calcResult.jamOvertime, isHoliday]);

  // Quick Add Employee Modal State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickNpk, setQuickNpk] = useState('');
  const [quickNama, setQuickNama] = useState('');
  const [quickPlant, setQuickPlant] = useState(initialPlant);

  const [showTulTableModal, setShowTulTableModal] = useState(false);

  // Filter employees for the currently selected plant
  const plantEmployees = employees.filter(e => e.plant === plant);

  // Searchable Employee Select Dropdown State
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const empDropdownRef = useRef(null);

  // Filter plant employees by search query
  const filteredPlantEmployees = useMemo(() => {
    if (!empSearchQuery.trim()) return plantEmployees;
    const q = empSearchQuery.toLowerCase().trim();
    return plantEmployees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.npk.toLowerCase().includes(q)
    );
  }, [plantEmployees, empSearchQuery]);

  // Click outside listener for employee dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setIsEmpDropdownOpen(false);
      }
    }
    if (isEmpDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmpDropdownOpen]);

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

  // When plant changes, automatically switch to the employees of that plant
  const handlePlantChange = (newPlant) => {
    setPlant(newPlant);
    const emps = employees.filter(e => e.plant === newPlant);
    if (emps.length > 0) {
      setNama(emps[0].name);
      setNpk(emps[0].npk);
      setShift(emps[0].shift || 'Shift 1');
      applyPresetTiming(emps[0].shift || 'Shift 1', overtimeCategory);
    } else {
      setNama('');
      setNpk('');
    }
  };

  // When employee is selected or typed manually
  const handleEmployeeChange = (selectedName) => {
    setNama(selectedName);
    const emp = employees.find(e => e.plant === plant && e.name.toLowerCase() === selectedName.trim().toLowerCase()) ||
      employees.find(e => e.name.toLowerCase() === selectedName.trim().toLowerCase());
    if (emp) {
      setNpk(emp.npk);
    }
  };

  // Preset timing helper based on Shift and Category
  const applyPresetTiming = (targetShift, targetCategory) => {
    const shiftDef = SHIFT_DEFINITIONS[targetShift] || SHIFT_DEFINITIONS['Shift 1'];

    if (targetCategory === 'PRE_SHIFT') {
      setJamMasuk(shiftDef.defaultPreOt.start);
      setJamPulang(shiftDef.defaultPreOt.end);
    } else if (targetCategory === 'POST_SHIFT') {
      setJamMasuk(shiftDef.defaultPostOt.start);
      setJamPulang(shiftDef.defaultPostOt.end);
    } else if (targetCategory === 'OFF_DAY') {
      setJamMasuk('08:00');
      setJamPulang('16:00');
    }
  };

  // Handle Shift Switch
  const handleShiftChange = (newShift) => {
    setShift(newShift);
    applyPresetTiming(newShift, overtimeCategory);
  };

  // Handle Category Switch (Pre-Shift vs Post-Shift vs Off-Day)
  const handleCategoryChange = (category) => {
    setOvertimeCategory(category);
    applyPresetTiming(shift, category);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!plant) {
      showToast('Silakan pilih Plant terlebih dahulu.', 'warning');
      return;
    }
    if (!nama.trim()) {
      showToast('Silakan pilih atau isi Nama Karyawan.', 'warning');
      return;
    }
    if (!npk.trim()) {
      showToast('Silakan isi NPK Karyawan.', 'warning');
      return;
    }
    if (!jamMasuk.trim() || !jamPulang.trim()) {
      showToast('Silakan isi Jam Mulai dan Jam Selesai Lembur.', 'warning');
      return;
    }

    // Validation Check
    if (!calcResult.isValid) {
      showToast(calcResult.errorMessage || 'Waktu lembur tidak valid.', 'danger');
      return;
    }

    if (calcResult.isTolerance && calcResult.countedMinutes === 0) {
      showToast('Perhatian: Durasi di bawah 30 menit dianggap toleransi dan tidak bernilai jam lembur.', 'warning');
    }

    // Determine dept from plant
    let dept = 'hose';
    if (plant.toLowerCase().includes('molded')) dept = 'molded';
    else if (plant.toLowerCase().includes('subcont')) dept = 'subcont';
    else if (plant.toLowerCase().includes('lab') || plant.toLowerCase().includes('mixing')) dept = 'lab-mixing';
    else if (plant.toLowerCase().includes('rvi')) dept = 'rvi';
    else if (plant.toLowerCase().includes('qre')) dept = 'qre';
    else if (plant.toLowerCase().includes('hose')) dept = 'hose';

    const formattedJamWaktu = `${jamMasuk} - ${jamPulang}`;

    // Submit Record
    addOvertimeRecord({
      plant,
      nama,
      npk: npk.toUpperCase(),
      shift,
      tglOvertime,
      isHoliday,
      tipeHari: isHoliday ? 'libur' : 'kerja',
      jamMasuk,
      jamPulang,
      jamWaktu: formattedJamWaktu,
      overtimeType: calcResult.overtimeType,
      overtimeTypeLabel: calcResult.overtimeTypeLabel,
      rawDurationMinutes: calcResult.rawMinutes,
      countedDurationMinutes: calcResult.countedMinutes,
      isTolerance: calcResult.isTolerance,
      jamOvertime: calcResult.jamOvertime,
      totalTUL: liveTUL,
      reason: reason.trim() || 'Lembur operasional QC & finishing',
      dept
    });

    // Reset nama & npk untuk input berikutnya, pertahankan plant/shift/tgl
    setNama('');
    setNpk('');
    setEmpSearchQuery('');
    setReason('');
  };

  const shiftInfo = SHIFT_DEFINITIONS[shift] || SHIFT_DEFINITIONS['Shift 1'];

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
            <ClipboardPenLine size={22} color="#ffffff" />
          </div>
          <div className="hero-text-block">
            <span className="hero-dept-tag">QUALITY CONTROL</span>
            <h1 className="hero-main-title">Input Data Lembur</h1>
            <span className="hero-desc">
              Pencatatan data lembur harian QC dengan kalkulasi durasi dan TUL otomatis.
            </span>
          </div>
        </div>

        {/* Live Status Right */}
        <div className="hero-live-status-card">
          <div className="hero-live-clock-icon">
            <Clock size={15} color="#38bdf8" />
          </div>
          <div className="hero-status-texts">
            <span className="hero-status-label">Waktu Sistem</span>
            <span className="hero-status-time">{currentDateTime}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM CONTAINER */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
        <div
          className="filter-parameter-mockup-card"
          style={{
            padding: '24px 28px',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(9, 24, 52, 0.75)'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid rgba(67, 139, 196, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardPenLine size={20} color="#00d2ff" />
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF8E7', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}>
                FORMULIR INPUT DATA LEMBUR
              </span>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setQuickNpk('');
                  setQuickNama('');
                  setQuickPlant(plant || 'Plant Hose');
                  setShowQuickAddModal(true);
                }}
                className="btn-master-primary"
                style={{ padding: '7px 16px', fontSize: '0.82rem', gap: 6 }}
                title={`Tambah pekerja baru ke ${plant}`}
              >
                <UserPlus size={14} />
                <span>+ Tambah Pekerja</span>
              </button>
            )}
          </div>

          {/* 1. PLANT */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 6 }}>
              <Building2 size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
              PLANT
            </label>
            <select
              className="form-select"
              value={plant}
              onChange={(e) => handlePlantChange(e.target.value)}
              required
              style={{ padding: '11px 16px', fontSize: '0.92rem', background: 'rgba(10, 22, 45, 0.85)', borderRadius: 8, height: 44 }}
            >
              <option value="">- Pilih plant -</option>
              {plants.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 2. NAMA KARYAWAN (SEARCHABLE SELECTOR) */}
          <div className="form-group" style={{ marginBottom: 0, position: 'relative' }} ref={empDropdownRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 0 }}>
                <User size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
                NAMA KARYAWAN
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.76rem', color: '#8CC1E9' }}>
                  {plantEmployees.length} Karyawan ({plant})
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickNpk('');
                      setQuickNama('');
                      setQuickPlant(plant || 'Plant Hose');
                      setShowQuickAddModal(true);
                    }}
                    style={{
                      background: 'rgba(0, 136, 255, 0.18)',
                      border: '1px solid rgba(0, 210, 255, 0.4)',
                      borderRadius: 4,
                      color: '#00d2ff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Tambah pekerja baru langsung ke master"
                  >
                    <UserPlus size={11} />
                    <span>+ Tambah</span>
                  </button>
                )}
              </div>
            </div>

            {/* Trigger Box */}
            <div
              onClick={() => {
                setIsEmpDropdownOpen(!isEmpDropdownOpen);
                setEmpSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                height: 44,
                background: 'rgba(10, 22, 45, 0.95)',
                border: isEmpDropdownOpen ? '1.5px solid #00d2ff' : '1.5px solid rgba(67, 139, 196, 0.45)',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: isEmpDropdownOpen ? '0 0 12px rgba(0, 210, 255, 0.25)' : 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '0.92rem', fontWeight: nama ? 700 : 500, color: nama ? '#FFF8E7' : '#64748b' }}>
                {nama || '- Pilih / Cari Nama Karyawan -'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={14} color="#8CC1E9" />
                <ChevronDown
                  size={16}
                  color="#8CC1E9"
                  style={{
                    transform: isEmpDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Dropdown Popup with Integrated Search Bar */}
            {isEmpDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  background: 'linear-gradient(180deg, #091a38 0%, #061124 100%)',
                  border: '1.5px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: 10,
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 16px rgba(0, 136, 255, 0.25)',
                  overflow: 'hidden'
                }}
              >
                {/* Search Input */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 40, 85, 0.4)' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} color="#38bdf8" style={{ position: 'absolute', left: 10 }} />
                    <input
                      type="text"
                      autoFocus
                      value={empSearchQuery}
                      onChange={(e) => setEmpSearchQuery(e.target.value)}
                      placeholder="Cari nama karyawan..."
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 10px 0 32px',
                        background: 'rgba(10, 22, 45, 0.95)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: 6,
                        color: '#FFF8E7',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {empSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEmpSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 2
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Employee List */}
                <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
                  {filteredPlantEmployees.length === 0 ? (
                    <div style={{ padding: '16px 12px', textAlign: 'center', color: '#8ca8cf', fontSize: '0.82rem' }}>
                      Tidak ada karyawan yang cocok dengan pencarian "{empSearchQuery}"
                    </div>
                  ) : (
                    filteredPlantEmployees.map((emp) => {
                      const isSelected = nama === emp.name;
                      const initialLetter = emp.name ? emp.name.charAt(0).toUpperCase() : 'U';

                      return (
                        <div
                          key={emp.npk}
                          onClick={() => {
                            handleEmployeeChange(emp.name);
                            setIsEmpDropdownOpen(false);
                            setEmpSearchQuery('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(0, 136, 255, 0.25)' : 'transparent',
                            borderLeft: isSelected ? '3px solid #00d2ff' : '3px solid transparent',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: isSelected
                                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                flexShrink: 0
                              }}
                            >
                              {initialLetter}
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                              {emp.name}
                            </span>
                          </div>

                          {isSelected && (
                            <Check size={15} color="#00d2ff" strokeWidth={3} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Quick chips */}
            {plantEmployees.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {plantEmployees.slice(0, 8).map(emp => (
                  <button
                    key={emp.npk}
                    type="button"
                    onClick={() => handleEmployeeChange(emp.name)}
                    style={{
                      backgroundColor: nama === emp.name ? 'rgba(0, 136, 255, 0.4)' : 'rgba(255, 255, 255, 0.04)',
                      border: nama === emp.name ? '1px solid #00d2ff' : '1px solid rgba(140, 193, 233, 0.18)',
                      color: nama === emp.name ? '#FFF8E7' : '#8CC1E9',
                      fontSize: '0.78rem',
                      fontWeight: nama === emp.name ? 800 : 500,
                      padding: '4px 10px',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ROW: NPK & SHIFT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 3. NPK */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 22 }}>
                <label className="form-label" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 0 }}>
                  <FileText size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
                  NPK
                </label>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, background: 'rgba(52, 211, 153, 0.12)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                  ✓ Terisi Otomatis
                </span>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="NPK Karyawan"
                value={npk}
                onChange={(e) => setNpk(e.target.value)}
                required
                style={{ padding: '0 16px', fontSize: '0.92rem', background: 'rgba(10, 22, 45, 0.85)', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, height: 44, border: '1px solid rgba(67, 139, 196, 0.35)', color: '#FFF8E7', boxSizing: 'border-box' }}
              />
            </div>

            {/* 4. SHIFT SELECTION */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 22 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 0, whiteSpace: 'nowrap' }}>
                  <Layers size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
                  PILIH SHIFT
                </label>
                <span style={{
                  fontSize: '0.72rem',
                  color: shift === 'Shift 1' ? '#818cf8' : '#38bdf8',
                  fontWeight: 700,
                  background: shift === 'Shift 1' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: shift === 'Shift 1' ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {shift === 'Shift 1' ? <Moon size={11} /> : <Sun size={11} />}
                  {shift === 'Shift 1' ? '22:30 - 07:30 (Malam)' : '07:30 - 16:30 (Pagi)'}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                height: 44,
                background: 'rgba(10, 22, 45, 0.85)',
                padding: 4,
                borderRadius: 8,
                border: '1px solid rgba(67, 139, 196, 0.35)',
                boxSizing: 'border-box'
              }}>
                {['Shift 1', 'Shift 2'].map(s => {
                  const isActive = shift === s;
                  const isS1 = s === 'Shift 1';
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleShiftChange(s)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        height: '100%',
                        borderRadius: 6,
                        border: isActive
                          ? (isS1 ? '1px solid #818cf8' : '1px solid #38bdf8')
                          : '1px solid transparent',
                        background: isActive
                          ? (isS1
                            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.45) 0%, rgba(129, 140, 248, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(2, 132, 199, 0.45) 0%, rgba(56, 189, 248, 0.3) 100%)')
                          : 'transparent',
                        color: isActive
                          ? (isS1 ? '#c7d2fe' : '#bae6fd')
                          : '#8CC1E9',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isS1 ? <Moon size={14} /> : <Sun size={14} />}
                      <span>{isS1 ? 'Shift 1 (Malam)' : 'Shift 2 (Pagi)'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ROW: TGL OVERTIME & JAM / WAKTU OVERTIME */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 6. TGL OVERTIME & TIPE HARI */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 22 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 0, whiteSpace: 'nowrap' }}>
                  <Calendar size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
                  TGL SHIFT / LEMBUR
                </label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setManualDayType('kerja')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: !isHoliday ? '1px solid #00d2ff' : '1px solid rgba(67, 139, 196, 0.3)',
                      background: !isHoliday ? 'rgba(0, 136, 255, 0.4)' : 'rgba(10, 22, 45, 0.6)',
                      color: !isHoliday ? '#FFF8E7' : '#8CC1E9',
                      transition: 'all 0.15s'
                    }}
                    title="D.O.T (Hari Kerja: Jam 1: 1.5x, Jam 2+: 2.0x)"
                  >
                    D.O.T
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualDayType('libur')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isHoliday ? '1px solid #fbbf24' : '1px solid rgba(67, 139, 196, 0.3)',
                      background: isHoliday ? 'rgba(245, 158, 11, 0.35)' : 'rgba(10, 22, 45, 0.6)',
                      color: isHoliday ? '#fbbf24' : '#8CC1E9',
                      transition: 'all 0.15s'
                    }}
                    title="H.O.T (Hari Libur: Jam 1-7: 2x, Jam 8: 3x, Jam 9+: 4x)"
                  >
                    H.O.T
                  </button>
                </div>
              </div>
              <input
                type="date"
                className="form-input"
                value={tglOvertime}
                onChange={(e) => {
                  setTglOvertime(e.target.value);
                  setManualDayType(null); // Reset to auto-detect on date change
                }}
                required
                style={{ padding: '0 14px', fontSize: '0.92rem', background: 'rgba(10, 22, 45, 0.85)', borderRadius: 8, height: 44, border: '1px solid rgba(67, 139, 196, 0.35)', color: '#FFF8E7', colorScheme: 'dark', boxSizing: 'border-box' }}
              />
            </div>

            {/* 7. JAM / WAKTU (ACTUAL) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 22 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.04em', marginBottom: 0, whiteSpace: 'nowrap' }}>
                  <Clock size={15} style={{ display: 'inline', marginRight: 6, color: '#00d2ff' }} />
                  RENTANG JAM LEMBUR
                </label>
                <span style={{
                  fontSize: '0.72rem',
                  color: calcResult.isValid ? '#34d399' : '#ef4444',
                  fontWeight: 700,
                  background: calcResult.isValid ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: calcResult.isValid ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.35)',
                  whiteSpace: 'nowrap'
                }}>
                  {calcResult.isValid ? `${calcResult.rawMinutes} Menit Total` : 'Invalid Time'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10, height: 44 }}>
                <TimeInput24
                  label="Mulai"
                  value={jamMasuk}
                  onChange={(val) => setJamMasuk(val)}
                />

                <span style={{ color: '#00d2ff', fontWeight: 800, fontSize: '0.95rem' }}>→</span>

                <TimeInput24
                  label="Selesai"
                  value={jamPulang}
                  onChange={(val) => setJamPulang(val)}
                />
              </div>
            </div>
          </div>

          {/* 8. REALTIME OVERTIME VALIDATION & CALCULATION SUMMARY CARD */}
          <div
            style={{
              backgroundColor: calcResult.isValid
                ? (calcResult.isTolerance ? 'rgba(245, 158, 11, 0.12)' : 'rgba(9, 26, 56, 0.95)')
                : 'rgba(239, 68, 68, 0.15)',
              border: calcResult.isValid
                ? (calcResult.isTolerance ? '1.5px solid rgba(245, 158, 11, 0.5)' : '1.5px solid rgba(0, 210, 255, 0.45)')
                : '1.5px solid rgba(239, 68, 68, 0.6)',
              borderRadius: 14,
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Header Validation Result */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {calcResult.isValid ? (
                  calcResult.isTolerance ? (
                    <AlertTriangle size={20} color="#fbbf24" />
                  ) : (
                    <CheckCircle2 size={20} color="#10b981" />
                  )
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
                <span style={{
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  color: calcResult.isValid ? (calcResult.isTolerance ? '#fbbf24' : '#FFF8E7') : '#ef4444'
                }}>
                  {calcResult.isValid
                    ? (calcResult.isTolerance ? 'STATUS: TOLERANSI (< 30 MENIT)' : `STATUS: SAH (${calcResult.overtimeTypeLabel})`)
                    : `STATUS: TIDAK VALID (${calcResult.errorMessage ? calcResult.errorMessage.replace(/\.$/, '') : 'OVERLAP DENGAN SHIFT'})`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowTulTableModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  borderRadius: 6,
                  background: 'rgba(0, 85, 160, 0.45)',
                  border: '1.5px solid rgba(0, 210, 255, 0.55)',
                  color: '#00d2ff',
                  cursor: 'pointer'
                }}
              >
                <Table size={13} />
                <span>Lihat Tabel Acuan TUL</span>
              </button>
            </div>

            {/* Error or Warning Message Banner */}
            {!calcResult.isValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#fca5a5' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{calcResult.errorMessage}</span>
              </div>
            )}

            {calcResult.isValid && calcResult.isTolerance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#fde68a' }}>
                <Info size={15} style={{ flexShrink: 0 }} />
                <span><strong>Ketentuan Potong 1 Jam:</strong> Durasi input {calcResult.rawHours || (calcResult.rawMinutes / 60)} Jam ({calcResult.rawMinutes} menit) setelah dipotong 1 jam bernilai <strong>0 Jam lembur sah</strong>.</span>
              </div>
            )}

            {/* 3 Metric Badges: Raw Minutes, Counted Hours, Total TUL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: '1px solid rgba(67, 139, 196, 0.2)', paddingTop: 12 }}>
              {/* Box 1: Raw Duration */}
              <div style={{ background: 'rgba(10, 22, 45, 0.7)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(67, 139, 196, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', color: '#8CC1E9', fontWeight: 600 }}>Durasi Kotor (Gross)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFF8E7', fontFamily: 'JetBrains Mono, monospace' }}>
                  {calcResult.rawMinutes} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8CC1E9' }}>Menit ({calcResult.rawHours} Jam)</span>
                </div>
              </div>

              {/* Box 2: Counted Overtime */}
              <div style={{ background: 'rgba(10, 22, 45, 0.7)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(67, 139, 196, 0.2)' }}>
                <div style={{ fontSize: '0.72rem', color: '#8CC1E9', fontWeight: 600 }}>Jam Lembur Sah (Net - 1 Jam)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: calcResult.jamOvertime > 0 ? '#34d399' : '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
                  {calcResult.jamOvertime} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8CC1E9' }}>Jam</span>
                </div>
              </div>

              {/* Box 3: Total TUL */}
              <div style={{ background: 'rgba(10, 22, 45, 0.7)', padding: '10px 14px', borderRadius: 8, border: isHoliday ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(0, 210, 255, 0.45)' }}>
                <div style={{ fontSize: '0.72rem', color: isHoliday ? '#fbbf24' : '#00d2ff', fontWeight: 700 }}>
                  Total Estimasi TUL ({isHoliday ? 'H.O.T' : 'D.O.T'})
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'Outfit, sans-serif' }}>
                  {liveTUL} <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isHoliday ? '#fbbf24' : '#00d2ff' }}>TUL</span>
                </div>
              </div>
            </div>

            {/* Detailed Calculation Breakdown Row */}
            {calcResult.isValid && calcResult.jamOvertime > 0 && (
              <div style={{
                background: isHoliday ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 85, 160, 0.18)',
                border: isHoliday ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(0, 210, 255, 0.35)',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: '#8CC1E9' }}>Rincian Perhitungan ({dayLabel}): </span>
                  <strong style={{ color: isHoliday ? '#fbbf24' : '#38bdf8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.84rem' }}>
                    {tulBreakdown.formula}
                  </strong>
                </div>
                <div style={{ color: '#FFF8E7', fontWeight: 700, fontSize: '0.74rem' }}>
                  Aturan: {isHoliday ? '1-7 (2x) | 8 (3x) | 9+ (4x)' : 'Jam 1 (1.5x) | Jam 2+ (2.0x)'}
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!calcResult.isValid}
            className="btn-master-primary"
            style={{
              width: '100%',
              height: 52,
              fontSize: '1.05rem',
              fontWeight: 900,
              justifyContent: 'center',
              marginTop: 4,
              letterSpacing: '0.04em',
              opacity: calcResult.isValid ? 1 : 0.5,
              cursor: calcResult.isValid ? 'pointer' : 'not-allowed',
              boxShadow: calcResult.isValid ? '0 6px 24px rgba(0, 136, 255, 0.5)' : 'none'
            }}
          >
            <Check size={22} strokeWidth={3} />
            <span>UPDATE OVERTIME</span>
          </button>
        </div>
      </form>

      {/* TABEL PERHITUNGAN TUL LEMBUR MODAL */}
      {showTulTableModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#091833',
            border: '1.5px solid rgba(0, 210, 255, 0.5)',
            borderRadius: 18,
            padding: '20px 24px',
            maxWidth: 880,
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 210, 255, 0.25)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(67, 139, 196, 0.25)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg, #0055A0, #00d2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8E7' }}>
                  <Table size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFF8E7', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    TABEL PERHITUNGAN TUL LEMBUR
                    <span style={{ fontSize: '0.72rem', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                      Lengkap s/d Jam 24
                    </span>
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#8CC1E9' }}>
                    Acuan Resmi Standar Perhitungan TUL (Senin - Sabtu & Minggu / Libur)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTulTableModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#8CC1E9', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body: Two Side-by-Side Tables + Right Summary Column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 14, flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {/* TABLE 1: HARI KERJA (SENIN - SABTU) */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(10, 22, 45, 0.75)', border: '1.5px solid rgba(0, 210, 255, 0.4)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #0055A0, #0088ff)', padding: '8px 10px', textAlign: 'center', color: '#FFF8E7' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.04em' }}>HARI KERJA</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700 }}>SENIN - SABTU</div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: 370 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#0088ff', color: '#FFF8E7', position: 'sticky', top: 0, zIndex: 5 }}>
                        <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '50%' }}>JAM KE</th>
                        <th style={{ padding: '6px 8px', width: '50%' }}>TUL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { jam: '0', tul: '0' },
                        { jam: '1', tul: '1,5' },
                        { jam: '1,25', tul: '2' },
                        { jam: '1,5', tul: '2,5' },
                        { jam: '1,75', tul: '3' },
                        { jam: '2', tul: '3,5' },
                        { jam: '2,25', tul: '4' },
                        { jam: '2,5', tul: '4,5' },
                        { jam: '2,75', tul: '5' },
                        { jam: '3', tul: '5,5' },
                        { jam: '3,25', tul: '6' },
                        { jam: '3,5', tul: '6,5' },
                        { jam: '3,75', tul: '7' },
                        { jam: '4', tul: '7,5' },
                        { jam: '4,5', tul: '8,5' },
                        { jam: '4,75', tul: '9' },
                        { jam: '5', tul: '9,5' },
                        { jam: '5,5', tul: '10,5' },
                        { jam: '6', tul: '11,5' },
                        { jam: '6,25', tul: '12' },
                        { jam: '6,5', tul: '12,5' },
                        { jam: '7', tul: '13,5' },
                        { jam: '7,5', tul: '14,5' },
                        { jam: '8', tul: '15,5' },
                        { jam: '8,5', tul: '16,5' },
                        { jam: '9', tul: '17,5' },
                        { jam: '9,25', tul: '18' },
                        { jam: '9,5', tul: '18,5' },
                        { jam: '10', tul: '19,5' },
                        { jam: '10,5', tul: '20,5' },
                        { jam: '11', tul: '21,5' },
                        { jam: '11,5', tul: '22,5' },
                        { jam: '12', tul: '23,5' },
                        { jam: '12,5', tul: '24,5' },
                        { jam: '13', tul: '25,5' },
                        { jam: '13,5', tul: '26,5' },
                        { jam: '14', tul: '27,5' },
                        { jam: '14,5', tul: '28,5' },
                        { jam: '15', tul: '29,5' },
                        { jam: '15,5', tul: '30,5' },
                        { jam: '16', tul: '31,5' },
                        { jam: '16,5', tul: '32,5' },
                        { jam: '17', tul: '33,5' },
                        { jam: '17,5', tul: '34,5' },
                        { jam: '18', tul: '35,5' },
                        { jam: '18,5', tul: '36,5' },
                        { jam: '19', tul: '37,5' },
                        { jam: '19,5', tul: '38,5' },
                        { jam: '20', tul: '39,5' },
                        { jam: '20,5', tul: '40,5' },
                        { jam: '21', tul: '41,5' },
                        { jam: '21,5', tul: '42,5' },
                        { jam: '22', tul: '43,5' },
                        { jam: '22,5', tul: '44,5' },
                        { jam: '23', tul: '45,5' },
                        { jam: '23,5', tul: '46,5' },
                        { jam: '24', tul: '47,5' }
                      ].map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,85,160,0.12)', borderBottom: '1px solid rgba(67,139,196,0.15)' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 700, color: '#FFF8E7', borderRight: '1px solid rgba(67,139,196,0.2)' }}>{r.jam}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 800, color: '#38bdf8' }}>{r.tul}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 2: HARI MINGGU & LIBUR */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(10, 22, 45, 0.75)', border: '1.5px solid rgba(245, 158, 11, 0.45)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', padding: '8px 10px', textAlign: 'center', color: '#FFF8E7' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.04em' }}>HARI MINGGU & LIBUR</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700 }}>TANGGAL MERAH</div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: 370 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f59e0b', color: '#000', position: 'sticky', top: 0, zIndex: 5 }}>
                        <th style={{ padding: '6px 8px', borderRight: '1px solid rgba(0,0,0,0.2)', width: '50%' }}>JAM KE</th>
                        <th style={{ padding: '6px 8px', width: '50%' }}>TUL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { jam: '0', tul: '0' },
                        { jam: '1', tul: '2' },
                        { jam: '1,5', tul: '3' },
                        { jam: '2', tul: '4' },
                        { jam: '2,5', tul: '5' },
                        { jam: '3', tul: '6' },
                        { jam: '3,5', tul: '7' },
                        { jam: '4', tul: '8' },
                        { jam: '4,5', tul: '9' },
                        { jam: '5', tul: '10' },
                        { jam: '5,5', tul: '11' },
                        { jam: '6', tul: '12' },
                        { jam: '6,25', tul: '12,5' },
                        { jam: '6,5', tul: '13' },
                        { jam: '7', tul: '14' },
                        { jam: '7,5', tul: '15,5' },
                        { jam: '7,75', tul: '15,75' },
                        { jam: '8', tul: '17' },
                        { jam: '8,5', tul: '19' },
                        { jam: '9', tul: '21' },
                        { jam: '9,25', tul: '22' },
                        { jam: '9,5', tul: '23' },
                        { jam: '10', tul: '25' },
                        { jam: '10,5', tul: '27' },
                        { jam: '11', tul: '29' },
                        { jam: '11,5', tul: '31' },
                        { jam: '12', tul: '33' },
                        { jam: '12,5', tul: '35' },
                        { jam: '13', tul: '37' },
                        { jam: '13,5', tul: '39' },
                        { jam: '14', tul: '41' },
                        { jam: '14,5', tul: '43' },
                        { jam: '15', tul: '45' },
                        { jam: '15,5', tul: '47' },
                        { jam: '16', tul: '49' },
                        { jam: '16,5', tul: '51' },
                        { jam: '17', tul: '53' },
                        { jam: '17,5', tul: '55' },
                        { jam: '18', tul: '57' },
                        { jam: '18,5', tul: '59' },
                        { jam: '19', tul: '61' },
                        { jam: '19,5', tul: '63' },
                        { jam: '20', tul: '65' },
                        { jam: '20,5', tul: '67' },
                        { jam: '21', tul: '69' },
                        { jam: '21,5', tul: '71' },
                        { jam: '22', tul: '73' },
                        { jam: '22,5', tul: '75' },
                        { jam: '23', tul: '77' },
                        { jam: '23,5', tul: '79' },
                        { jam: '24', tul: '81' }
                      ].map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(67,139,196,0.15)' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 700, color: '#FFF8E7', borderRight: '1px solid rgba(67,139,196,0.2)' }}>{r.jam}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 800, color: '#fbbf24' }}>{r.tul}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT SUMMARY & FORMULA COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {/* Rate Table 1: Hari Kerja */}
                <div style={{ background: 'rgba(0, 85, 160, 0.22)', border: '1px solid rgba(0, 210, 255, 0.4)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00d2ff', marginBottom: 4, textAlign: 'center' }}>
                    D.O.T
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#0088ff', color: '#FFF8E7' }}>
                        <th style={{ padding: '4px' }}>JAM KE</th>
                        <th style={{ padding: '4px' }}>TUL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(67,139,196,0.2)' }}>
                        <td style={{ padding: '4px', color: '#FFF8E7' }}>1</td>
                        <td style={{ padding: '4px', fontWeight: 800, color: '#38bdf8' }}>x 1.5</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px', color: '#FFF8E7' }}>2 - Dst</td>
                        <td style={{ padding: '4px', fontWeight: 800, color: '#38bdf8' }}>x 2.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Rate Table 2: Hari Minggu & Libur */}
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', marginBottom: 4, textAlign: 'center' }}>
                    H.O.T
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f59e0b', color: '#000' }}>
                        <th style={{ padding: '4px' }}>JAM KE</th>
                        <th style={{ padding: '4px' }}>TUL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(67,139,196,0.2)' }}>
                        <td style={{ padding: '4px', color: '#FFF8E7' }}>1 - 7</td>
                        <td style={{ padding: '4px', fontWeight: 800, color: '#fbbf24' }}>x 2.0</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(67,139,196,0.2)' }}>
                        <td style={{ padding: '4px', color: '#FFF8E7' }}>8</td>
                        <td style={{ padding: '4px', fontWeight: 800, color: '#fbbf24' }}>x 3.0</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px', color: '#FFF8E7' }}>9 - Dst</td>
                        <td style={{ padding: '4px', fontWeight: 800, color: '#fbbf24' }}>x 4.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formula Upah Lembur */}
                <div style={{ background: 'rgba(10, 22, 45, 0.85)', border: '1px solid rgba(67, 139, 196, 0.35)', borderRadius: 8, padding: '10px', fontSize: '0.72rem', color: '#8CC1E9', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, color: '#00d2ff', marginBottom: 4 }}>
                    RUMUS TUL: GP / 173
                  </div>
                  <div style={{ color: '#FFF8E7', marginBottom: 6 }}>
                    CTH: 2.000.000 / 173 = -+ 11.560
                  </div>
                  <div style={{ borderTop: '1px solid rgba(67,139,196,0.2)', paddingTop: 6, fontSize: '0.7rem' }}>
                    • Dalam 1 tahun ada 52 Minggu<br />
                    • 1 bulan = 52/12 = 4,33 Minggu<br />
                    • Total jam kerja/minggu = 40 jam<br />
                    • Total jam kerja 1 bulan = 40 x 4,33 = <strong>173,33</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowTulTableModal(false)}
                className="btn-master-primary"
                style={{ padding: '7px 24px', fontSize: '0.86rem' }}
              >
                Tutup Acuan TUL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD EMPLOYEE MODAL */}
      {showQuickAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#0a162d',
            border: '1.5px solid rgba(0, 210, 255, 0.5)',
            borderRadius: 16,
            padding: '24px',
            maxWidth: 440,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(67, 139, 196, 0.25)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} color="#00d2ff" />
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF8E7' }}>Tambah Pekerja ke Plant</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#8CC1E9', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8CC1E9', display: 'block', marginBottom: 4 }}>NPK (Nomor Pokok Karyawan)</label>
                <input
                  type="text"
                  placeholder="Contoh: NPK-8899"
                  value={quickNpk}
                  onChange={(e) => setQuickNpk(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(67, 139, 196, 0.4)', borderRadius: 6, color: '#FFF8E7', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8CC1E9', display: 'block', marginBottom: 4 }}>Nama Lengkap Pekerja</label>
                <input
                  type="text"
                  placeholder="Contoh: Farhan Pratama"
                  value={quickNama}
                  onChange={(e) => setQuickNama(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(67, 139, 196, 0.4)', borderRadius: 6, color: '#FFF8E7', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8CC1E9', display: 'block', marginBottom: 4 }}>Plant Penugasan</label>
                <select
                  value={quickPlant}
                  onChange={(e) => setQuickPlant(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#0a162d', border: '1px solid rgba(67, 139, 196, 0.4)', borderRadius: 6, color: '#FFF8E7', fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {plants.map(p => (
                    <option key={p.id || p} value={p.name || p} style={{ background: '#0a162d', color: '#FFF8E7' }}>
                      {p.name || p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#8CC1E9', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickNpk.trim() || !quickNama.trim()) {
                    showToast('NPK dan Nama Karyawan wajib diisi.', 'warning');
                    return;
                  }
                  const success = addEmployee({
                    npk: quickNpk.trim().toUpperCase(),
                    name: quickNama.trim(),
                    plant: quickPlant
                  });
                  if (success) {
                    setPlant(quickPlant);
                    setNama(quickNama.trim());
                    setNpk(quickNpk.trim().toUpperCase());
                    setQuickNpk('');
                    setQuickNama('');
                    setShowQuickAddModal(false);
                  }
                }}
                className="btn-master-primary"
                style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
              >
                Simpan Pekerja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
