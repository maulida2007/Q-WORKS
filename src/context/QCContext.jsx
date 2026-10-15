import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PLANTS,
  EMPLOYEES,
  SHIFTS,
  MONTH_LIST,
  JENIS_NG_LIST,
  KRITERIA_NG_LIST,
  LINE_LIST,
  PART_CODES_LIST,
  INITIAL_OVERTIME_RECORDS,
  calculateTUL,
  isWeekendOrHoliday,
  sortEmployeesByPlant,
  getAllowedDashboards,
  getDefaultDashboardView,
  getFallbackJamWaktu,
  getAllowedPlants
} from '../data/mockData';

const QCContext = createContext();

// Helper to exclude deleted test employees
const isExcludedWorker = (name = '', npk = '') => {
  const upperName = String(name || '').trim().toUpperCase();
  const upperNpk = String(npk || '').trim().toUpperCase();
  return (
    upperName.includes('MAWAR') ||
    upperName.includes('SITI') ||
    upperName.includes('UJANG') ||
    upperNpk.includes('MAWAR') ||
    upperNpk.includes('SITI') ||
    upperNpk.includes('UJANG')
  );
};

export const QCProvider = ({ children }) => {
  // Current Authenticated User (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qworks_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && (u.role === 'admin' || u.name === 'Administrator Quality')) {
          u.name = 'Admin';
          u.roleLabel = 'Admin';
        }
        return u;
      }
    } catch (e) {
      console.error('Error loading user from localStorage', e);
    }
    return null;
  });

  // Navigation State (disesuaikan dengan hak akses plant user)
  const [currentView, setCurrentView] = useState(() => getDefaultDashboardView(currentUser));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Guard dashboard access based on user role & plant permissions
  useEffect(() => {
    if (currentUser?.role === 'karyawan') {
      const allowedViews = getAllowedDashboards(currentUser).map(d => d.id);
      const isDashboardView = ['all-plants', 'hose', 'molded', 'subcont', 'lab-mixing', 'mixing', 'rvi', 'qre'].includes(currentView);
      if (isDashboardView && !allowedViews.includes(currentView)) {
        setCurrentView(getDefaultDashboardView(currentUser));
      }
    }
  }, [currentUser, currentView]);

  // Overtime Records Data (persisted in localStorage)
  const [overtimeRecords, setOvertimeRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('qworks_overtime_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasObsoletePlant = Array.isArray(parsed) && parsed.some(item => 
          item.plant === 'Plant BTR' || item.plant === 'Plant TPE' || item.dept === 'btr' || item.dept === 'tpe'
        );
        if (Array.isArray(parsed) && !hasObsoletePlant) {
          const cleaned = parsed.filter(item => !isExcludedWorker(item.nama || item.name, item.npk));
          const existingIds = new Set(cleaned.map(r => r.id));
          const missingDefaults = INITIAL_OVERTIME_RECORDS.filter(r => !existingIds.has(r.id) && !isExcludedWorker(r.nama || r.name, r.npk));
          const combined = missingDefaults.length > 0 ? [...cleaned, ...missingDefaults] : cleaned;
          return combined.map(item => {
            const isHol = item.isHoliday !== undefined ? item.isHoliday : isWeekendOrHoliday(item.tglOvertime);
            const jamWaktu = (item.jamWaktu && item.jamWaktu !== '-')
              ? item.jamWaktu
              : getFallbackJamWaktu(item.shift, item.jamOvertime, isHol);
            return {
              ...item,
              shift: item.shift === 'Shift 3' ? 'Shift 2' : (item.shift || 'Shift 1'),
              isHoliday: isHol,
              tipeHari: isHol ? 'libur' : 'kerja',
              totalTUL: calculateTUL(item.jamOvertime, isHol),
              jamWaktu
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading overtime data from localStorage', e);
    }
    return INITIAL_OVERTIME_RECORDS.filter(item => !isExcludedWorker(item.nama || item.name, item.npk));
  });

  useEffect(() => {
    try {
      const cleaned = overtimeRecords.filter(item => !isExcludedWorker(item.nama || item.name, item.npk));
      localStorage.setItem('qworks_overtime_data', JSON.stringify(cleaned));
    } catch (e) {
      console.error('Error saving overtime data to localStorage', e);
    }
  }, [overtimeRecords]);

  const [activeDate, setActiveDate] = useState('09 Sep 2026');
  const [targetJamOT, setTargetJamOT] = useState(50); // Target threshold jam lembur
  const [targetRR, setTargetRR] = useState(2.0); // Target Rejection Rate (%)
  
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('qworks_auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('qworks_auth_user');
      }
    } catch (e) {
      console.error('Error saving user to localStorage', e);
    }
  }, [currentUser]);

  // Login Functions
  const loginKaryawan = (namaInput, npkInput) => {
    const cleanNpk = String(npkInput || '').trim();
    const cleanNama = String(namaInput || '').trim();

    if (!cleanNpk || !cleanNama) {
      showToast('Nama dan NPK wajib diisi.', 'warning');
      return { success: false, message: 'Nama dan NPK wajib diisi.' };
    }

    const foundEmpByNpk = employees.find(
      e => e.npk && e.npk.toUpperCase() === cleanNpk.toUpperCase()
    );

    if (!foundEmpByNpk) {
      showToast('NPK tidak terdaftar dalam master data.', 'danger');
      return { success: false, message: `NPK ${cleanNpk} tidak terdaftar dalam sistem.` };
    }

    const isNameMatch = foundEmpByNpk.name && foundEmpByNpk.name.trim().toUpperCase() === cleanNama.toUpperCase();
    if (!isNameMatch) {
      showToast('Nama tidak sesuai dengan NPK yang dimasukkan.', 'danger');
      return { success: false, message: `Nama tidak sesuai dengan NPK ${cleanNpk}. Pastikan nama sesuai data terdaftar.` };
    }

    const userObj = {
      role: 'karyawan',
      roleLabel: 'Karyawan Quality',
      name: foundEmpByNpk.name,
      npk: foundEmpByNpk.npk,
      plant: foundEmpByNpk.plant || 'Plant Hose',
      dept: foundEmpByNpk.dept || 'hose',
      badge: `NPK-${foundEmpByNpk.npk}`,
      loginAt: new Date().toISOString()
    };

    const targetView = getDefaultDashboardView(userObj);
    setCurrentUser(userObj);
    setCurrentView(targetView);
    showToast(`Selamat datang, ${userObj.name} (${userObj.npk})!`, 'success');
    return { success: true, user: userObj };
  };

  const loginAdmin = (username, password) => {
    const u = String(username || '').trim();
    const p = String(password || '').trim();

    if (!u || !p) {
      showToast('Username dan Password admin wajib diisi.', 'warning');
      return { success: false, message: 'Username dan Password wajib diisi.' };
    }

    if (
      (u.toLowerCase() === 'admin' && (p === 'admin' || p === 'admin123' || p === '123456')) ||
      (u.toLowerCase() === 'qc_lead' && p === 'qclead123')
    ) {
      const userObj = {
        role: 'admin',
        roleLabel: 'Admin',
        name: 'Admin',
        username: u,
        badge: 'QUALITY-ADMIN-01',
        loginAt: new Date().toISOString()
      };
      setCurrentUser(userObj);
      setCurrentView('all-plants');
      showToast('Login berhasil sebagai Admin (Akses Penuh).', 'success');
      return { success: true, user: userObj };
    }

    showToast('Username atau Password Admin salah.', 'danger');
    return { success: false, message: 'Username atau Password salah. Silakan periksa kembali.' };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('all-plants');
    showToast('Anda telah berhasil keluar (Logout).', 'info');
  };

  // Filter States
  const [selectedMonths, setSelectedMonths] = useState(['September 2026']);
  const [selectedDay, setSelectedDay] = useState('ALL'); // 'ALL', '8', '7', etc.
  const [selectedDays, setSelectedDays] = useState([]); // Array of days e.g. ['8', '7'] or [] for all
  const [selectedShift, setSelectedShift] = useState('ALL'); // 'ALL', 'Shift 1', 'Shift 2'
  const [selectedShifts, setSelectedShifts] = useState([]); // Array e.g. ['Shift 1'] or [] for all
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedPlants, setSelectedPlants] = useState([]); // Array e.g. ['Plant Molded'] or [] for all
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Array e.g. ['NPK-8801'] or [] for all

  // Rejection Specific Filters
  const [selectedJenisNG, setSelectedJenisNG] = useState([]);
  const [selectedKriteriaNG, setSelectedKriteriaNG] = useState([]);
  const [selectedLine, setSelectedLine] = useState([]);
  const [selectedPartCode, setSelectedPartCode] = useState([]);

  // Modals
  const [showMonthFilterModal, setShowMonthFilterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Lembur Shift 1 Disetujui',
      message: '6 Karyawan Plant Hose telah diinput lembur total 10.5 Jam (21 TUL)',
      time: '15 menit yang lalu',
      unread: true,
      type: 'success'
    },
    {
      id: 2,
      title: 'Batas Maksimum Lembur',
      message: 'GILANG (1747) telah mencapai akumulasi 6 jam minggu ini',
      time: '1 jam yang lalu',
      unread: true,
      type: 'warning'
    }
  ]);

  // Toast message
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qworks_overtime_data', JSON.stringify(overtimeRecords));
    } catch (e) {
      console.error('Error saving overtime data to localStorage', e);
    }
  }, [overtimeRecords]);

  // Filtered Overtime Records based on Current View and Filters
  const filteredRecords = overtimeRecords.filter(item => {
    // Filter department if in specific dashboard
    if (currentView === 'hose' && item.dept !== 'hose') return false;
    if (currentView === 'molded' && item.dept !== 'molded') return false;
    if (currentView === 'subcont' && item.dept !== 'subcont') return false;
    if ((currentView === 'mixing' || currentView === 'lab-mixing') && item.dept !== 'mixing' && item.dept !== 'lab-mixing' && item.dept !== 'lab_mixing') return false;
    if (currentView === 'rvi' && item.dept !== 'rvi') return false;
    if (currentView === 'qre' && item.dept !== 'qre') return false;

    // Filter months
    if (selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes(item.month)) {
      return false;
    }

    // Filter day (checks selectedDays array if populated, otherwise selectedDay string)
    if (selectedDays && selectedDays.length > 0) {
      if (!selectedDays.includes(String(item.day))) return false;
    } else if (selectedDay !== 'ALL' && String(item.day) !== String(selectedDay)) {
      return false;
    }

    // Filter shift (checks selectedShifts array if populated, otherwise selectedShift string)
    if (selectedShifts && selectedShifts.length > 0) {
      if (!selectedShifts.includes(item.shift)) return false;
    } else if (selectedShift !== 'ALL' && item.shift !== selectedShift) {
      return false;
    }

    // Filter plant (checks selectedPlants array if populated, otherwise selectedPlant string)
    if (selectedPlants && selectedPlants.length > 0) {
      if (!selectedPlants.includes(item.plant)) return false;
    } else if (selectedPlant !== 'ALL' && item.plant !== selectedPlant) {
      return false;
    }

    // Filter employee (checks selectedEmployees array if populated, otherwise selectedEmployee string)
    if (selectedEmployees && selectedEmployees.length > 0) {
      if (!selectedEmployees.includes(item.npk)) return false;
    } else if (selectedEmployee !== 'ALL' && item.npk !== selectedEmployee) {
      return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalJamOvertime = filteredRecords.reduce((sum, item) => sum + (Number(item.jamOvertime) || 0), 0);
  const totalTUL = filteredRecords.reduce((sum, item) => sum + (Number(item.totalTUL) || 0), 0);
  const uniqueEmployees = new Set(filteredRecords.map(item => item.npk)).size;
  const totalRecords = filteredRecords.length;

  // Add new Overtime record
  const addOvertimeRecord = (record) => {
    const tgl = record.tglOvertime || new Date().toISOString().split('T')[0];
    const dateObj = new Date(tgl);
    const day = String(dateObj.getDate());
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    const isHoliday = isWeekendOrHoliday(tgl);
    const tul = calculateTUL(record.jamOvertime, isHoliday);

    // Exact Upload / Submission Timestamp
    const now = new Date();
    const currentUploadTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentUploadDate = now.toISOString().split('T')[0];
    const uploadTimestamp = `${currentUploadDate} ${currentUploadTime}`;

    const submitter = currentUser ? {
      name: currentUser.name,
      npk: currentUser.npk || (currentUser.role === 'admin' ? 'ADMIN-QUALITY' : record.npk),
      role: currentUser.role,
      roleLabel: currentUser.roleLabel || (currentUser.role === 'admin' ? 'Admin Quality' : 'Karyawan Quality'),
      plant: currentUser.plant || record.plant
    } : {
      name: record.nama,
      npk: record.npk,
      role: 'karyawan',
      roleLabel: 'Karyawan Quality',
      plant: record.plant
    };

    const newRecord = {
      id: `OT-${Date.now().toString().slice(-6)}`,
      timestamp: uploadTimestamp,
      tglOvertime: tgl,
      jamWaktu: record.jamWaktu || '07:30 - 09:30',
      month: month,
      day: day,
      isHoliday,
      tipeHari: isHoliday ? 'libur' : 'kerja',
      totalTUL: tul,
      overtimeType: record.overtimeType || 'POST_SHIFT',
      overtimeTypeLabel: record.overtimeTypeLabel || (record.overtimeType === 'PRE_SHIFT' ? 'Pre-Shift' : 'Post-Shift'),
      rawDurationMinutes: record.rawDurationMinutes || Math.round((Number(record.jamOvertime) || 0) * 60),
      countedDurationMinutes: record.countedDurationMinutes || Math.round((Number(record.jamOvertime) || 0) * 60),
      isTolerance: record.isTolerance || false,
      reason: record.reason || 'Lembur operasional QC & finishing',
      // Submitter Tracking Metadata
      createdBy: submitter,
      createdAt: new Date().toISOString(),
      ...record
    };

    setOvertimeRecords(prev => [newRecord, ...prev]);

    setNotifications(prev => [
      {
        id: Date.now(),
        title: `Data Overtime Berhasil Ditambahkan: ${record.nama} (${record.npk})`,
        message: `${record.jamOvertime} Jam (${tul} TUL) - ${record.plant} (${record.shift}) [${newRecord.overtimeTypeLabel}]`,
        time: 'Baru saja',
        unread: true,
        type: 'success'
      },
      ...prev
    ]);

    showToast(`Data Overtime ${record.nama} (${record.jamOvertime} Jam) berhasil ditambahkan!`, 'success');
  };

  // Approve Overtime Record
  const approveOvertimeRecord = (id, note = '', approverName = 'Supervisor QC') => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin menyetujui pengajuan lembur.', 'danger');
      return false;
    }
    setOvertimeRecords(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Approved',
          approverName: approverName || currentUser?.name || 'Supervisor QC',
          approvalNote: note,
          approvedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    setNotifications(prev => [
      {
        id: Date.now(),
        title: `Lembur Disetujui: ${id}`,
        message: `Pengajuan lembur ${id} telah disetujui oleh ${approverName || currentUser?.name || 'Supervisor QC'}. ${note ? `Catatan: ${note}` : ''}`,
        time: 'Baru saja',
        unread: true,
        type: 'success'
      },
      ...prev
    ]);

    showToast(`Pengajuan lembur ${id} berhasil disetujui (Approved)!`, 'success');
    return true;
  };

  // Reject Overtime Record
  const rejectOvertimeRecord = (id, reason = '', approverName = 'Supervisor QC') => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin menolak pengajuan lembur.', 'danger');
      return false;
    }
    setOvertimeRecords(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Rejected',
          approverName: approverName || currentUser?.name || 'Supervisor QC',
          approvalNote: reason,
          rejectedAt: new Date().toISOString()
        };
      }
      return item;
    }));

    setNotifications(prev => [
      {
        id: Date.now(),
        title: `Lembur Ditolak: ${id}`,
        message: `Pengajuan lembur ${id} ditolak oleh ${approverName || currentUser?.name || 'Supervisor QC'}. Alasan: ${reason || 'Tidak memenuhi kriteria'}`,
        time: 'Baru saja',
        unread: true,
        type: 'danger'
      },
      ...prev
    ]);

    showToast(`Pengajuan lembur ${id} telah ditolak (Rejected).`, 'warning');
    return true;
  };

  // Delete an overtime record
  const deleteOvertimeRecord = (id) => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin menghapus data lembur.', 'danger');
      return false;
    }
    setOvertimeRecords(prev => prev.filter(item => item.id !== id));
    showToast('Data lembur berhasil dihapus.', 'info');
    return true;
  };

  // Update an overtime record
  const updateOvertimeRecord = (updatedRecord) => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin mengubah data lembur.', 'danger');
      return false;
    }
    const tgl = updatedRecord.tglOvertime || new Date().toISOString().split('T')[0];
    const dateObj = new Date(tgl);
    const day = String(dateObj.getDate());
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    const isHoliday = isWeekendOrHoliday(tgl);
    const tul = calculateTUL(updatedRecord.jamOvertime, isHoliday);
    const manualTime = updatedRecord.jamWaktu ? (updatedRecord.jamWaktu.length === 5 ? `${updatedRecord.jamWaktu}:00` : updatedRecord.jamWaktu) : '17:00:00';

    setOvertimeRecords(prev => prev.map(item => {
      if (item.id === updatedRecord.id) {
        return {
          ...item,
          ...updatedRecord,
          tglOvertime: tgl,
          month: month,
          day: day,
          isHoliday,
          tipeHari: isHoliday ? 'libur' : 'kerja',
          totalTUL: tul,
          jamWaktu: updatedRecord.jamWaktu || manualTime.slice(0, 5),
          timestamp: `${tgl} ${manualTime}`
        };
      }
      return item;
    }));

    showToast(`Data Overtime ${updatedRecord.nama} berhasil diperbarui!`, 'success');
    return true;
  };

  // Reset to default data
  const resetToDefaultData = () => {
    setOvertimeRecords(INITIAL_OVERTIME_RECORDS);
    showToast('Data dikembalikan ke data awal pabrik.', 'info');
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Fullscreen error', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Master Employees Data (persisted in localStorage, murni 100% dari dokumen Excel resmi user)
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('qworks_employees_data_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validNpks = new Set(EMPLOYEES.map(e => e.npk.toUpperCase()));
          const validOnly = parsed.filter(item => validNpks.has(String(item.npk || '').toUpperCase()));
          const existingNpks = new Set(validOnly.map(e => String(e.npk || '').toUpperCase()));
          const missingDefaults = EMPLOYEES.filter(e => !existingNpks.has(String(e.npk || '').toUpperCase()));
          return sortEmployeesByPlant([...validOnly, ...missingDefaults]);
        }
      }
    } catch (e) {
      console.error('Error loading employees from localStorage', e);
    }
    return sortEmployeesByPlant(EMPLOYEES);
  });

  useEffect(() => {
    try {
      const validNpks = new Set(EMPLOYEES.map(e => e.npk.toUpperCase()));
      const cleaned = employees.filter(item => validNpks.has(String(item.npk || '').toUpperCase()) || item.isUserAdded);
      localStorage.setItem('qworks_employees_data_v3', JSON.stringify(cleaned));
      localStorage.setItem('qworks_employees_data', JSON.stringify(cleaned));
    } catch (e) {
      console.error('Error saving employees to localStorage', e);
    }
  }, [employees]);

  // Add new employee manually
  const addEmployee = (emp) => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin menambah pekerja baru.', 'danger');
      return false;
    }
    const cleanNpk = (emp.npk || '').trim().toUpperCase();
    const cleanName = (emp.name || emp.nama || '').trim();
    const plantName = emp.plant || 'Plant Hose';
    const dept = plantName.toLowerCase().replace('plant ', '').trim();

    if (!cleanNpk || !cleanName) {
      showToast('NPK dan Nama Karyawan wajib diisi.', 'warning');
      return false;
    }

    const exists = employees.some(e => e.npk.toUpperCase() === cleanNpk);
    if (exists) {
      showToast(`Karyawan dengan NPK ${cleanNpk} sudah terdaftar!`, 'danger');
      return false;
    }

    const newEmp = {
      npk: cleanNpk,
      name: cleanName,
      plant: plantName,
      dept: dept
    };

    setEmployees(prev => sortEmployeesByPlant([newEmp, ...prev]));
    showToast(`Pekerja ${cleanName} (${cleanNpk}) berhasil ditambahkan ke ${plantName}!`, 'success');
    return true;
  };

  // Update existing employee
  const updateEmployee = (originalNpk, updatedData) => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin mengubah master pekerja.', 'danger');
      return false;
    }
    const cleanNpk = (updatedData.npk || originalNpk).trim().toUpperCase();
    const cleanName = (updatedData.name || updatedData.nama || '').trim();
    const plantName = updatedData.plant || 'Plant Hose';
    const dept = plantName.toLowerCase().replace('plant ', '').trim();

    if (cleanNpk !== originalNpk.toUpperCase() && employees.some(e => e.npk.toUpperCase() === cleanNpk)) {
      showToast(`NPK ${cleanNpk} sudah digunakan karyawan lain!`, 'danger');
      return false;
    }

    setEmployees(prev => sortEmployeesByPlant(prev.map(e => {
      if (e.npk.toUpperCase() === originalNpk.toUpperCase()) {
        return {
          ...e,
          npk: cleanNpk,
          name: cleanName,
          plant: plantName,
          dept: dept
        };
      }
      return e;
    })));

    // Also update overtime records if NPK or Name changed
    setOvertimeRecords(prev => prev.map(ot => {
      if (ot.npk.toUpperCase() === originalNpk.toUpperCase()) {
        return {
          ...ot,
          npk: cleanNpk,
          nama: cleanName,
          plant: plantName,
          dept: dept
        };
      }
      return ot;
    }));

    showToast(`Data pekerja ${cleanName} berhasil diperbarui!`, 'success');
    return true;
  };

  // Delete employee
  const deleteEmployee = (npk) => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin menghapus data pekerja.', 'danger');
      return false;
    }
    setEmployees(prev => prev.filter(e => e.npk.toUpperCase() !== npk.toUpperCase()));
    showToast(`Pekerja dengan NPK ${npk} berhasil dihapus dari master data.`, 'info');
    return true;
  };

  // Bulk add / import employees from Excel or CSV
  const bulkAddEmployees = (importedList, mode = 'merge') => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin mengimpor atau menambah master pekerja.', 'danger');
      return 0;
    }
    if (!Array.isArray(importedList) || importedList.length === 0) {
      showToast('Tidak ada data karyawan yang valid untuk diimpor.', 'warning');
      return 0;
    }

    let addedCount = 0;
    let updatedCount = 0;

    const formattedList = importedList.map(item => {
      const cleanNpk = String(item.npk || '').trim().toUpperCase();
      const cleanName = String(item.name || item.nama || '').trim();
      let plant = String(item.plant || 'Plant Hose').trim();
      if (!plant.toLowerCase().startsWith('plant ')) {
        plant = `Plant ${plant}`;
      }
      // Validate plant
      const validPlantNames = ['Plant Hose', 'Plant Molded', 'Plant Subcont', 'Plant Mixing', 'Plant Lab Mixing', 'Plant RVI', 'Plant QRE'];
      const matchedPlant = validPlantNames.find(p => p.toLowerCase() === plant.toLowerCase()) || 'Plant Hose';
      const dept = matchedPlant.toLowerCase().replace('plant ', '').replace('lab mixing', 'mixing').replace('lab-mixing', 'mixing').trim();

      return {
        npk: cleanNpk,
        name: cleanName,
        plant: matchedPlant,
        dept: dept
      };
    }).filter(e => e.npk && e.name);

    if (mode === 'replace') {
      if (currentUser?.role === 'karyawan') {
        showToast('Akses ditolak: Karyawan tidak memiliki izin mengganti seluruh master data.', 'danger');
        return 0;
      }
      setEmployees(sortEmployeesByPlant(formattedList));
      showToast(`Berhasil mengganti seluruh master data dengan ${formattedList.length} pekerja!`, 'success');
      return formattedList.length;
    }

    setEmployees(prev => {
      const map = new Map();
      prev.forEach(e => map.set(e.npk.toUpperCase(), e));

      formattedList.forEach(item => {
        if (map.has(item.npk)) {
          map.set(item.npk, { ...map.get(item.npk), ...item });
          updatedCount++;
        } else {
          map.set(item.npk, item);
          addedCount++;
        }
      });

      return sortEmployeesByPlant(Array.from(map.values()));
    });

    showToast(`Sukses Impor: ${addedCount} Pekerja Baru, ${updatedCount} Diperbarui!`, 'success');
    return addedCount + updatedCount;
  };

  // Reset employees to default mock
  const resetEmployeesToDefault = () => {
    if (currentUser?.role === 'karyawan') {
      showToast('Akses ditolak: Karyawan tidak memiliki izin mereset master data.', 'danger');
      return false;
    }
    setEmployees(sortEmployeesByPlant(EMPLOYEES));
    showToast('Data master pekerja dikembalikan ke daftar awal.', 'info');
    return true;
  };

  const isAdmin = currentUser?.role === 'admin';
  const isKaryawan = currentUser?.role === 'karyawan';

  return (
    <QCContext.Provider
      value={{
        currentView,
        setCurrentView,
        sidebarCollapsed,
        setSidebarCollapsed,
        overtimeRecords,
        filteredRecords,
        totalJamOvertime,
        totalTUL,
        uniqueEmployees,
        totalRecords,
        targetJamOT,
        setTargetJamOT,
        targetRR,
        setTargetRR,
        activeDate,
        currentUser,
        setCurrentUser,
        loginKaryawan,
        loginAdmin,
        logout,
        isAdmin,
        isKaryawan,
        selectedMonths,
        setSelectedMonths,
        selectedDay,
        setSelectedDay,
        selectedDays,
        setSelectedDays,
        selectedShift,
        setSelectedShift,
        selectedShifts,
        setSelectedShifts,
        selectedPlant,
        setSelectedPlant,
        selectedPlants,
        setSelectedPlants,
        selectedEmployee,
        setSelectedEmployee,
        selectedEmployees,
        setSelectedEmployees,
        selectedJenisNG,
        setSelectedJenisNG,
        selectedKriteriaNG,
        setSelectedKriteriaNG,
        selectedLine,
        setSelectedLine,
        selectedPartCode,
        setSelectedPartCode,
        showMonthFilterModal,
        setShowMonthFilterModal,
        showSettingsModal,
        setShowSettingsModal,
        showNotificationModal,
        setShowNotificationModal,
        notifications,
        setNotifications,
        toast,
        showToast,
        addOvertimeRecord,
        approveOvertimeRecord,
        rejectOvertimeRecord,
        updateOvertimeRecord,
        deleteOvertimeRecord,
        resetToDefaultData,
        toggleFullscreen,
        plants: PLANTS,
        employees,
        setEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        bulkAddEmployees,
        resetEmployeesToDefault,
        shifts: SHIFTS,
        monthList: MONTH_LIST,
        jenisNgList: JENIS_NG_LIST,
        kriteriaNgList: KRITERIA_NG_LIST,
        lineList: LINE_LIST,
        partCodesList: PART_CODES_LIST,
        calculateTUL,
        getAllowedDashboards: () => getAllowedDashboards(currentUser),
        getDefaultDashboardView: () => getDefaultDashboardView(currentUser),
        getAllowedPlants: () => getAllowedPlants(currentUser)
      }}
    >
      {children}
    </QCContext.Provider>
  );
};

export const useQC = () => useContext(QCContext);
