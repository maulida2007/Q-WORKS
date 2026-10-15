export const PLANTS = [
  { id: 'plant-hose', name: 'Plant Hose', dept: 'hose' },
  { id: 'plant-molded', name: 'Plant Molded', dept: 'molded' },
  { id: 'plant-subcont', name: 'Plant Subcont', dept: 'subcont' },
  { id: 'plant-lab-mixing', name: 'Plant Lab Mixing', dept: 'lab-mixing' },
  { id: 'plant-rvi', name: 'Plant RVI', dept: 'rvi' },
  { id: 'plant-qre', name: 'Plant QRE', dept: 'qre' },
];

export const sortEmployeesByPlant = (empList) => {
  if (!Array.isArray(empList)) return [];
  const plantOrder = {
    'Plant Hose': 1,
    'Plant Molded': 2,
    'Plant Subcont': 3,
    'Plant Lab Mixing': 4,
    'Plant Mixing': 4,
    'Plant RVI': 5,
    'Plant QRE': 6
  };
  return [...empList].sort((a, b) => {
    const orderA = plantOrder[a.plant] || 99;
    const orderB = plantOrder[b.plant] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || a.nama || '').localeCompare(b.name || b.nama || '');
  });
};

export const getAllowedDashboards = (user) => {
  if (!user || user.role === 'admin') {
    return [
      { id: 'all-plants', label: 'Dashboard ALL PLANT', plant: 'All' },
      { id: 'hose', label: 'Dashboard HOSE', plant: 'Plant Hose' },
      { id: 'molded', label: 'Dashboard MOLDED', plant: 'Plant Molded' },
      { id: 'subcont', label: 'Dashboard SUBCONT', plant: 'Plant Subcont' },
      { id: 'lab-mixing', label: 'Dashboard LAB MIXING', plant: 'Plant Lab Mixing' },
      { id: 'rvi', label: 'Dashboard RVI', plant: 'Plant RVI' },
      { id: 'qre', label: 'Dashboard QRE', plant: 'Plant QRE' },
    ];
  }

  const p = String(user.plant || user.dept || '').toLowerCase();

  if (p.includes('hose')) {
    return [{ id: 'hose', label: 'Dashboard HOSE', plant: 'Plant Hose' }];
  }
  if (p.includes('molded')) {
    return [{ id: 'molded', label: 'Dashboard MOLDED', plant: 'Plant Molded' }];
  }
  if (p.includes('rvi')) {
    return [{ id: 'rvi', label: 'Dashboard RVI', plant: 'Plant RVI' }];
  }
  if (p.includes('qre')) {
    return [{ id: 'qre', label: 'Dashboard QRE', plant: 'Plant QRE' }];
  }
  if (p.includes('subcont') || p.includes('mixing') || p.includes('lab')) {
    return [
      { id: 'subcont', label: 'Dashboard SUBCONT', plant: 'Plant Subcont' },
      { id: 'lab-mixing', label: 'Dashboard LAB MIXING', plant: 'Plant Lab Mixing' },
    ];
  }

  return [{ id: 'hose', label: 'Dashboard HOSE', plant: 'Plant Hose' }];
};

export const getAllowedPlants = (user) => {
  if (!user || user.role === 'admin') {
    return ['Plant Hose', 'Plant Molded', 'Plant Subcont', 'Plant Lab Mixing', 'Plant RVI', 'Plant QRE'];
  }
  const p = String(user.plant || user.dept || '').toLowerCase();
  if (p.includes('hose')) return ['Plant Hose'];
  if (p.includes('molded')) return ['Plant Molded'];
  if (p.includes('rvi')) return ['Plant RVI'];
  if (p.includes('qre')) return ['Plant QRE'];
  if (p.includes('subcont') || p.includes('mixing') || p.includes('lab')) {
    return ['Plant Subcont', 'Plant Lab Mixing'];
  }
  return ['Plant Hose'];
};

export const getDefaultDashboardView = (user) => {
  if (!user || user.role === 'admin') {
    return 'all-plants';
  }
  const p = String(user.plant || user.dept || '').toLowerCase();
  if (p.includes('hose')) return 'hose';
  if (p.includes('molded')) return 'molded';
  if (p.includes('rvi')) return 'rvi';
  if (p.includes('qre')) return 'qre';
  if (p.includes('subcont')) return 'subcont';
  if (p.includes('mixing') || p.includes('lab')) return 'lab-mixing';
  return 'hose';
};

export const EMPLOYEES = [
  // ===================== PLANT HOSE (13 Karyawan) =====================
  { npk: '1747', name: 'GILANG', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1796', name: 'OCHA', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1726', name: 'JUNIAR', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1797', name: 'MELA', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1611', name: 'ALIF', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1303', name: 'ISKANDAR', plant: 'Plant Hose', dept: 'hose' },
  { npk: '0227', name: 'ARIYANTO', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1506', name: 'DENI', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1795', name: 'INDAH', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1798', name: 'DINI', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1727', name: 'SYIFA', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1519', name: 'RICO', plant: 'Plant Hose', dept: 'hose' },
  { npk: '1592', name: 'AZIS', plant: 'Plant Hose', dept: 'hose' },

  // ===================== PLANT MOLDED (13 Karyawan) =====================
  { npk: '1670', name: 'KATIM', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1423', name: 'SAHRUL', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1376', name: 'SALAM', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1378', name: 'ANDRY', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1580', name: 'MIFTAH', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1586', name: 'KELVIN', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1392', name: 'YAYANG', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1590', name: 'HAMDAN', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1728', name: 'HILMI', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1707', name: 'EKA', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1773', name: 'RIZKI', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1488', name: 'RIKI', plant: 'Plant Molded', dept: 'molded' },
  { npk: '1391', name: 'YAYA', plant: 'Plant Molded', dept: 'molded' },

  // ===================== PLANT SUBCONT (4 Karyawan) =====================
  { npk: '0201', name: 'KIKI', plant: 'Plant Subcont', dept: 'subcont' },
  { npk: '0228', name: 'ANDI', plant: 'Plant Subcont', dept: 'subcont' },
  { npk: '1459', name: 'SANDY', plant: 'Plant Subcont', dept: 'subcont' },
  { npk: '1722', name: 'SAHRIL', plant: 'Plant Subcont', dept: 'subcont' },

  // ===================== PLANT LAB MIXING (3 Karyawan) =====================
  { npk: '1705', name: 'RAYHAN', plant: 'Plant Lab Mixing', dept: 'lab-mixing' },
  { npk: '0031', name: 'ACA', plant: 'Plant Lab Mixing', dept: 'lab-mixing' },
  { npk: '1379', name: 'DANDA', plant: 'Plant Lab Mixing', dept: 'lab-mixing' },

  // ===================== PLANT RVI (10 Karyawan) =====================
  { npk: '1443', name: 'ARIF', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '0052', name: 'WILLY', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1353', name: 'ACU', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1427', name: 'WAHYU', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1460', name: 'KEKEN', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '0458', name: 'WIKATMA', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1422', name: 'ROBI', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1659', name: 'RIAN', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1520', name: 'RIDWAN', plant: 'Plant RVI', dept: 'rvi' },
  { npk: '1800', name: 'SUHDIN', plant: 'Plant RVI', dept: 'rvi' },

  // ===================== PLANT QRE / RQE (3 Karyawan) =====================
  { npk: '0222', name: 'SADIYAH', plant: 'Plant QRE', dept: 'qre' },
  { npk: '1321', name: 'ATIM', plant: 'Plant QRE', dept: 'qre' },
  { npk: '1605', name: 'AHMAD', plant: 'Plant QRE', dept: 'qre' },
];

export const SHIFTS = ['Shift 1', 'Shift 2'];

const indonesianMonthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const getDynamicMonthList = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const list = [];
  for (let m = currentMonthIdx; m >= 0; m--) {
    list.push(`${indonesianMonthNames[m]} ${currentYear}`);
  }
  return list.length > 0 ? list : ['September 2026'];
};

export const MONTH_LIST = getDynamicMonthList();

export const JENIS_NG_LIST = [
  'KARAT REGULER',
  'BURRY',
  'BURRY KE PRES',
  'UNFILL',
  'ROBEK',
  'OVER FINISHING',
  'PEEL OFF STOPPER',
  'COMPOUND KERING',
  'PAINTING',
  'KOTOR/NGERAK',
  'METAL CACAT',
  'PEEL OFF INNER',
  'REPAIR',
  'BUBBLE',
  'DEFOR',
  'PEEL OFF',
  'NG SV',
  'CRACK',
  'RUNNER',
  'WELD',
  'Other'
];

export const KRITERIA_NG_LIST = [
  'Minor',
  'Major',
  'Critical',
  'Appearance',
  'Dimension',
  'Function'
];

export const LINE_LIST = [
  'Line 1',
  'Line 2',
  'Line 3',
  'Line 4',
  'Line 5',
  'Line 6'
];

export const PART_CODES_LIST = [
  'NA2000-AI',
  'NA2000',
  'TA0900',
  'NA3050',
  'NA1700',
  'NA1710',
  'TA0850',
  'TA0870',
  'NA3050-AI',
  'HY0010'
];

/**
 * Daftar Hari Libur Nasional & Cuti Bersama Indonesia (YYYY-MM-DD atau MM-DD untuk tanggal tetap)
 */
export const INDONESIAN_HOLIDAYS = [
  '01-01', // Tahun Baru Masehi
  '05-01', // Hari Buruh Internasional
  '06-01', // Hari Lahir Pancasila
  '08-17', // Hari Kemerdekaan RI
  '12-25', // Hari Raya Natal
  // 2026 Holidays
  '2026-01-01', '2026-01-16', '2026-02-17', '2026-03-20', '2026-03-21', '2026-03-22',
  '2026-04-03', '2026-05-01', '2026-05-14', '2026-05-31', '2026-06-01', '2026-06-27',
  '2026-07-16', '2026-08-17', '2026-08-25', '2026-12-25',
  // 2025 Holidays
  '2025-01-01', '2025-01-27', '2025-01-29', '2025-03-29', '2025-03-31', '2025-04-01',
  '2025-04-18', '2025-05-01', '2025-05-12', '2025-05-29', '2025-06-01', '2025-06-07',
  '2025-06-27', '2025-08-17', '2025-09-05', '2025-12-25'
];

/**
 * Cek apakah tanggal adalah Hari Minggu (0) atau Hari Libur Nasional / Tanggal Merah
 * Catatan: Hari Sabtu termasuk Hari Kerja.
 */
export const isWeekendOrHoliday = (dateStr) => {
  if (!dateStr) return false;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay(); // 0 = Minggu, 6 = Sabtu
      if (dayOfWeek === 0) {
        return true; // Hari Minggu = Hari Libur
      }
    }
    const mmdd = dateStr.length >= 10 ? dateStr.slice(5) : '';
    if (INDONESIAN_HOLIDAYS.includes(dateStr) || (mmdd && INDONESIAN_HOLIDAYS.includes(mmdd))) {
      return true; // Tanggal Merah / Libur Nasional = Hari Libur
    }
  } catch (e) {
    console.error('Error parsing date for holiday check', e);
  }
  return false;
};

/**
 * Informasi detail tipe hari: 'Hari Kerja' vs 'Hari Libur'
 */
export const getDayTypeInfo = (dateStr) => {
  const isHol = isWeekendOrHoliday(dateStr);
  return {
    isHoliday: isHol,
    label: isHol ? 'Hari Libur' : 'Hari Kerja'
  };
};

/**
 * TABEL PERHITUNGAN TUL LEMBUR (Sesuai Standar Resmi QC Q-WORKS)
 * 
 * 1. Hari Kerja (Senin - Sabtu):
 *    - Jam 1: x 1.5
 *    - Jam 2 dst: x 2.0
 *    Formula: jam <= 1 ? jam * 1.5 : 1.5 + (jam - 1) * 2
 * 
 * 2. Hari Libur (Hari Minggu & Libur Nasional):
 *    - Jam 1 - 7: x 2.0 (Maks 14 TUL di jam ke-7)
 *    - Jam 8: x 3.0 (+3 TUL -> Total 17 TUL di jam ke-8)
 *    - Jam 9 dst: x 4.0 (+4 TUL per jam berikutnya)
 *    Formula: jam <= 7 ? jam * 2 : (jam <= 8 ? 14 + (jam - 7) * 3 : 17 + (jam - 8) * 4)
 * 
 * Nilai 1 TUL = Gaji Pokok / 173 (173 = 40 jam kerja/minggu × 4.33 minggu/bulan)
 */
export const calculateTUL = (jamOvertime, isHoliday = false) => {
  const jam = parseFloat(jamOvertime) || 0;
  if (jam <= 0) return 0;

  if (isHoliday) {
    if (jam <= 7) {
      return Number((jam * 2).toFixed(2));
    } else if (jam <= 8) {
      return Number((14 + (jam - 7) * 3).toFixed(2));
    } else {
      return Number((17 + (jam - 8) * 4).toFixed(2));
    }
  } else {
    // Hari Kerja (Senin - Sabtu)
    if (jam <= 1) {
      return Number((jam * 1.5).toFixed(2));
    } else {
      return Number((1.5 + (jam - 1) * 2).toFixed(2));
    }
  }
};

/**
 * Breakdown penjelasan rumus TUL secara matematis
 */
export const getTULBreakdown = (jamOvertime, isHoliday = false) => {
  const jam = parseFloat(jamOvertime) || 0;
  if (jam <= 0) return { formula: '0 Jam = 0 TUL', tul: 0, rule: '0 Jam' };

  if (isHoliday) {
    if (jam <= 7) {
      const tul = Number((jam * 2).toFixed(2));
      return {
        formula: `${jam} jam × 2.0 = ${tul} TUL`,
        tul,
        rule: 'Hari Libur / Minggu (Jam 1-7: ×2.0)'
      };
    } else if (jam <= 8) {
      const sisa8 = Number((jam - 7).toFixed(2));
      const tul = Number((14 + sisa8 * 3).toFixed(2));
      return {
        formula: `7 jam (14 TUL) + ${sisa8} jam × 3.0 = ${tul} TUL`,
        tul,
        rule: 'Hari Libur / Minggu (Jam ke-8: ×3.0)'
      };
    } else {
      const sisa9 = Number((jam - 8).toFixed(2));
      const tul = Number((17 + sisa9 * 4).toFixed(2));
      return {
        formula: `7 jam (14 TUL) + 1 jam (3 TUL) + ${sisa9} jam × 4.0 = ${tul} TUL`,
        tul,
        rule: 'Hari Libur / Minggu (Jam ke-9+: ×4.0)'
      };
    }
  } else {
    if (jam <= 1) {
      const tul = Number((jam * 1.5).toFixed(2));
      return {
        formula: `${jam} jam × 1.5 = ${tul} TUL`,
        tul,
        rule: 'Hari Kerja (Jam ke-1: ×1.5)'
      };
    } else {
      const sisa = Number((jam - 1).toFixed(2));
      const tul = Number((1.5 + sisa * 2).toFixed(2));
      return {
        formula: `1 jam (1.5 TUL) + ${sisa} jam × 2.0 = ${tul} TUL`,
        tul,
        rule: 'Hari Kerja (Jam ke-2+: ×2.0)'
      };
    }
  }
};

// Initial Overtime Records (otomatis dihitung berdasarkan tanggal dan formula TUL resmi)
const RAW_OVERTIME_RECORDS = [
  // ===================== PLANT HOSE =====================
  {
    id: 'OT-20260908-001',
    plant: 'Plant Hose',
    nama: 'GILANG',
    npk: '1747',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:15:20'
  },
  {
    id: 'OT-20260908-002',
    plant: 'Plant Hose',
    nama: 'OCHA',
    npk: '1796',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:10:00'
  },
  {
    id: 'OT-20260908-003',
    plant: 'Plant Hose',
    nama: 'JUNIAR',
    npk: '1726',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:05:00'
  },
  {
    id: 'OT-20260908-004',
    plant: 'Plant Hose',
    nama: 'MELA',
    npk: '1797',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:50:00'
  },
  {
    id: 'OT-20260908-005',
    plant: 'Plant Hose',
    nama: 'ALIF',
    npk: '1611',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:40:00'
  },
  {
    id: 'OT-20260908-006',
    plant: 'Plant Hose',
    nama: 'ISKANDAR',
    npk: '1303',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:30:00'
  },
  {
    id: 'OT-20260908-007',
    plant: 'Plant Hose',
    nama: 'ARIYANTO',
    npk: '0227',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2.5,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260908-008',
    plant: 'Plant Hose',
    nama: 'DENI',
    npk: '1506',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260907-009',
    plant: 'Plant Hose',
    nama: 'INDAH',
    npk: '1795',
    shift: 'Shift 2',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 23:00:00'
  },
  {
    id: 'OT-20260907-010',
    plant: 'Plant Hose',
    nama: 'GILANG',
    npk: '1747',
    shift: 'Shift 1',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'hose',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 17:00:00'
  },

  // ===================== PLANT MOLDED =====================
  {
    id: 'OT-20260908-011',
    plant: 'Plant Molded',
    nama: 'KATIM',
    npk: '1670',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:15:20'
  },
  {
    id: 'OT-20260908-012',
    plant: 'Plant Molded',
    nama: 'SAHRUL',
    npk: '1423',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:10:00'
  },
  {
    id: 'OT-20260908-013',
    plant: 'Plant Molded',
    nama: 'SALAM',
    npk: '1376',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:05:00'
  },
  {
    id: 'OT-20260908-014',
    plant: 'Plant Molded',
    nama: 'ANDRY',
    npk: '1378',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:50:00'
  },
  {
    id: 'OT-20260908-015',
    plant: 'Plant Molded',
    nama: 'MIFTAH',
    npk: '1580',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:40:00'
  },
  {
    id: 'OT-20260908-016',
    plant: 'Plant Molded',
    nama: 'KELVIN',
    npk: '1586',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:30:00'
  },
  {
    id: 'OT-20260908-017',
    plant: 'Plant Molded',
    nama: 'YAYANG',
    npk: '1392',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 17:00:00'
  },
  {
    id: 'OT-20260908-018',
    plant: 'Plant Molded',
    nama: 'HAMDAN',
    npk: '1590',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2.5,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260907-019',
    plant: 'Plant Molded',
    nama: 'HILMI',
    npk: '1728',
    shift: 'Shift 2',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 23:00:00'
  },
  {
    id: 'OT-20260907-020',
    plant: 'Plant Molded',
    nama: 'EKA',
    npk: '1707',
    shift: 'Shift 2',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 23:00:00'
  },
  {
    id: 'OT-20260906-021',
    plant: 'Plant Molded',
    nama: 'KATIM',
    npk: '1670',
    shift: 'Shift 1',
    tglOvertime: '2026-09-06',
    month: 'September 2026',
    day: '6',
    jamOvertime: 3,
    dept: 'molded',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-06 17:00:00'
  },

  // ===================== PLANT SUBCONT =====================
  {
    id: 'OT-20260908-022',
    plant: 'Plant Subcont',
    nama: 'KIKI',
    npk: '0201',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'subcont',
    kegiatan: 'GL',
    timestamp: '2026-09-08 09:15:20'
  },
  {
    id: 'OT-20260908-023',
    plant: 'Plant Subcont',
    nama: 'ANDI',
    npk: '0228',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'subcont',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:10:00'
  },
  {
    id: 'OT-20260908-024',
    plant: 'Plant Subcont',
    nama: 'SANDY',
    npk: '1459',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'subcont',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:05:00'
  },
  {
    id: 'OT-20260908-025',
    plant: 'Plant Subcont',
    nama: 'SAHRIL',
    npk: '1722',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'subcont',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:50:00'
  },
  {
    id: 'OT-20260907-026',
    plant: 'Plant Subcont',
    nama: 'KIKI',
    npk: '0201',
    shift: 'Shift 1',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'subcont',
    kegiatan: 'GL',
    timestamp: '2026-09-07 17:00:00'
  },
  {
    id: 'OT-20260907-027',
    plant: 'Plant Subcont',
    nama: 'ANDI',
    npk: '0228',
    shift: 'Shift 1',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'subcont',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 17:00:00'
  },

  // ===================== PLANT LAB MIXING =====================
  {
    id: 'OT-20260908-028',
    plant: 'Plant Lab Mixing',
    nama: 'RAYHAN',
    npk: '1705',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'lab-mixing',
    kegiatan: 'TESTING',
    timestamp: '2026-09-08 09:15:20'
  },
  {
    id: 'OT-20260908-029',
    plant: 'Plant Lab Mixing',
    nama: 'ACA',
    npk: '0031',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'lab-mixing',
    kegiatan: 'TESTING',
    timestamp: '2026-09-08 09:10:00'
  },
  {
    id: 'OT-20260908-030',
    plant: 'Plant Lab Mixing',
    nama: 'DANDA',
    npk: '1379',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2.5,
    dept: 'lab-mixing',
    kegiatan: 'MIXING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260907-031',
    plant: 'Plant Lab Mixing',
    nama: 'RAYHAN',
    npk: '1705',
    shift: 'Shift 1',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'lab-mixing',
    kegiatan: 'TESTING',
    timestamp: '2026-09-07 17:00:00'
  },

  // ===================== PLANT RVI =====================
  {
    id: 'OT-20260908-032',
    plant: 'Plant RVI',
    nama: 'ARIF',
    npk: '1443',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:15:20'
  },
  {
    id: 'OT-20260908-033',
    plant: 'Plant RVI',
    nama: 'WILLY',
    npk: '0052',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:10:00'
  },
  {
    id: 'OT-20260908-034',
    plant: 'Plant RVI',
    nama: 'ACU',
    npk: '1353',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 09:05:00'
  },
  {
    id: 'OT-20260908-035',
    plant: 'Plant RVI',
    nama: 'WAHYU',
    npk: '1427',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 1.5,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 08:50:00'
  },
  {
    id: 'OT-20260908-036',
    plant: 'Plant RVI',
    nama: 'KEKEN',
    npk: '1460',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2.5,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260908-037',
    plant: 'Plant RVI',
    nama: 'WIKATMA',
    npk: '0458',
    shift: 'Shift 2',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-08 23:00:00'
  },
  {
    id: 'OT-20260907-038',
    plant: 'Plant RVI',
    nama: 'ROBI',
    npk: '1422',
    shift: 'Shift 2',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 23:00:00'
  },
  {
    id: 'OT-20260907-039',
    plant: 'Plant RVI',
    nama: 'RIAN',
    npk: '1659',
    shift: 'Shift 1',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-07 17:00:00'
  },
  {
    id: 'OT-20260906-040',
    plant: 'Plant RVI',
    nama: 'RIDWAN',
    npk: '1520',
    shift: 'Shift 2',
    tglOvertime: '2026-09-06',
    month: 'September 2026',
    day: '6',
    jamOvertime: 3,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-06 23:00:00'
  },
  {
    id: 'OT-20260905-041',
    plant: 'Plant RVI',
    nama: 'SUHDIN',
    npk: '1800',
    shift: 'Shift 2',
    tglOvertime: '2026-09-05',
    month: 'September 2026',
    day: '5',
    jamOvertime: 2,
    dept: 'rvi',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-05 23:00:00'
  },
  {
    id: 'OT-20260909-042',
    plant: 'Plant QRE',
    nama: 'SADIYAH',
    npk: '0222',
    shift: 'Shift 1',
    tglOvertime: '2026-09-09',
    month: 'September 2026',
    day: '9',
    jamOvertime: 2.5,
    dept: 'qre',
    kegiatan: 'CHECKING',
    timestamp: '2026-09-09 17:00:00'
  },
  {
    id: 'OT-20260908-043',
    plant: 'Plant QRE',
    nama: 'ATIM',
    npk: '1321',
    shift: 'Shift 1',
    tglOvertime: '2026-09-08',
    month: 'September 2026',
    day: '8',
    jamOvertime: 2,
    dept: 'qre',
    kegiatan: 'PENGUKURAN',
    timestamp: '2026-09-08 17:30:00'
  },
  {
    id: 'OT-20260907-044',
    plant: 'Plant QRE',
    nama: 'AHMAD',
    npk: '1605',
    shift: 'Shift 2',
    tglOvertime: '2026-09-07',
    month: 'September 2026',
    day: '7',
    jamOvertime: 3,
    dept: 'qre',
    kegiatan: 'VALIDASI SAMPLE',
    timestamp: '2026-09-07 23:00:00'
  }
];

export const getFallbackJamWaktu = (shift = 'Shift 1', jamOvertime = 2, isHoliday = false) => {
  const dur = Number(jamOvertime) || 2;
  const isShift2 = String(shift).includes('2');
  
  if (isHoliday) {
    const startH = 7;
    const startM = 30;
    const endMinutes = startH * 60 + startM + Math.round(dur * 60);
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  if (isShift2) {
    const startH = 0;
    const startM = 30;
    const endMinutes = startH * 60 + startM + Math.round(dur * 60);
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `00:30 - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  const startH = 16;
  const startM = 30;
  const endMinutes = startH * 60 + startM + Math.round(dur * 60);
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  return `16:30 - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

export const INITIAL_OVERTIME_RECORDS = RAW_OVERTIME_RECORDS.map(item => {
  const isHoliday = item.isHoliday !== undefined ? item.isHoliday : isWeekendOrHoliday(item.tglOvertime);
  const tul = calculateTUL(item.jamOvertime, isHoliday);
  const jamWaktu = (item.jamWaktu && item.jamWaktu !== '-')
    ? item.jamWaktu
    : getFallbackJamWaktu(item.shift, item.jamOvertime, isHoliday);
  return {
    ...item,
    isHoliday,
    tipeHari: isHoliday ? 'libur' : 'kerja',
    totalTUL: tul,
    jamWaktu
  };
});


