/**
 * Q-WORKS OVERTIME MANAGEMENT CALCULATOR & VALIDATOR
 * 
 * Aturan Shift Karyawan:
 * - Shift 1: 22:30 s/d 07:30 (Overnight / Lintas Tengah Malam)
 * - Shift 2: 07:30 s/d 16:30 (Reguler Pagi)
 * 
 * Aturan Lembur:
 * - Waktu di luar jam shift resmi dihitung sebagai lembur (Pre-Shift atau Post-Shift).
 * - Minimal durasi lembur: 30 menit (di bawah 30 menit = toleransi 0 menit / tidak dihitung).
 * - Tidak boleh overlap/bertabrakan dengan jam shift resmi.
 * - Lembur sah jika di-approve atasan.
 */

export const SHIFT_DEFINITIONS = {
  'Shift 1': {
    name: 'Shift 1',
    label: 'Shift 1 (22:30 - 07:30 Malam Lintas Hari)',
    shortLabel: '22:30 - 07:30',
    startTime: '22:30',
    endTime: '07:30',
    isOvernight: true,
    color: '#818cf8', // Indigo
    defaultPreOt: { start: '20:30', end: '22:30' },
    defaultPostOt: { start: '07:30', end: '09:30' }
  },
  'Shift 2': {
    name: 'Shift 2',
    label: 'Shift 2 (07:30 - 16:30 Pagi)',
    shortLabel: '07:30 - 16:30',
    startTime: '07:30',
    endTime: '16:30',
    isOvernight: false,
    color: '#38bdf8', // Sky Blue
    defaultPreOt: { start: '05:30', end: '07:30' },
    defaultPostOt: { start: '16:30', end: '18:30' }
  }
};

/**
 * Membangun Date object absolut untuk jadwal shift berdasarkan tanggal kerja
 */
export function getShiftWindow(workDateStr, shiftName) {
  const shift = SHIFT_DEFINITIONS[shiftName] || SHIFT_DEFINITIONS['Shift 1'];
  const baseDate = new Date(workDateStr);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);

  const shiftStart = new Date(year, month, day, startH, startM, 0, 0);
  let shiftEnd;

  if (shift.isOvernight) {
    // Berakhir keesokan harinya (H+1)
    shiftEnd = new Date(year, month, day + 1, endH, endM, 0, 0);
  } else {
    shiftEnd = new Date(year, month, day, endH, endM, 0, 0);
  }

  return {
    shift,
    shiftStart,
    shiftEnd
  };
}

/**
 * Mengonversi string waktu 'HH:mm' dan tanggal menjadi Date object absolut
 * dengan memperhitungkan potensi lintas hari.
 */
export function parseOvertimeDateTime(workDateStr, timeStr, shiftName, type = 'AUTO') {
  if (!timeStr || !timeStr.includes(':')) return null;
  const shift = SHIFT_DEFINITIONS[shiftName] || SHIFT_DEFINITIONS['Shift 1'];
  const baseDate = new Date(workDateStr);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const [hours, minutes] = timeStr.split(':').map(Number);

  if (shift.isOvernight) {
    // Pada Shift 1 (22:30 H sampai 07:30 H+1):
    // Jam 12:00 - 23:59 berada di hari H (sebelum shift atau awal shift)
    // Jam 00:00 - 12:00 berada di hari H+1 (akhir shift atau post-shift pagi)
    if (hours >= 12) {
      return new Date(year, month, day, hours, minutes, 0, 0);
    } else {
      return new Date(year, month, day + 1, hours, minutes, 0, 0);
    }
  } else {
    // Shift 2 (07:30 - 16:30): Semua terjadi pada hari H
    return new Date(year, month, day, hours, minutes, 0, 0);
  }
}

/**
 * Validasi dan perhitungan durasi lembur lengkap
 */
export function calculateOvertimeDuration({
  workDate,
  shiftName = 'Shift 1',
  jamMasuk,      // Start Overtime (HH:mm)
  jamPulang,     // End Overtime (HH:mm)
  isHoliday = false,
  overtimeType = 'AUTO' // 'AUTO' | 'PRE_SHIFT' | 'POST_SHIFT' | 'OFF_DAY'
}) {
  if (!jamMasuk || !jamPulang) {
    return {
      isValid: false,
      errorMessage: 'Waktu mulai dan selesai lembur wajib diisi.',
      rawMinutes: 0,
      countedMinutes: 0,
      jamOvertime: 0,
      overtimeType: 'UNKNOWN',
      isTolerance: false
    };
  }

  const shiftWindow = getShiftWindow(workDate, shiftName);
  let startDt = parseOvertimeDateTime(workDate, jamMasuk, shiftName, overtimeType);
  let endDt = parseOvertimeDateTime(workDate, jamPulang, shiftName, overtimeType);

  if (!startDt || !endDt) {
    return {
      isValid: false,
      errorMessage: 'Format waktu tidak valid.',
      rawMinutes: 0,
      countedMinutes: 0,
      jamOvertime: 0,
      overtimeType: 'UNKNOWN',
      isTolerance: false
    };
  }

  // Jika jam pulang lebih kecil dari jam masuk (melewati tengah malam)
  if (endDt <= startDt) {
    endDt = new Date(endDt.getTime() + 24 * 60 * 60 * 1000);
  }

  const rawMinutes = Math.round((endDt - startDt) / (1000 * 60));
  const rawHours = Number((rawMinutes / 60).toFixed(2));

  if (rawMinutes <= 0) {
    return {
      isValid: false,
      errorMessage: 'Waktu selesai lembur harus lebih besar dari waktu mulai.',
      rawMinutes: 0,
      rawHours: 0,
      countedMinutes: 0,
      jamOvertime: 0,
      overtimeType: 'UNKNOWN',
      isTolerance: false
    };
  }

  // Cek Hari Libur / Off-Day (H.O.T)
  if (isHoliday || overtimeType === 'OFF_DAY') {
    // Validasi Maksimal Hari Libur (H.O.T): Maksimal 7 Jam input, tidak boleh lebih
    if (rawHours > 7) {
      return {
        isValid: false,
        errorMessage: `Lembur Hari Libur (H.O.T) maksimal 7 Jam (tidak boleh lebih). Durasi input saat ini: ${rawHours} Jam.`,
        warningMessage: 'Lembur pada hari libur (H.O.T) dibatasi maksimal 7 jam.',
        rawMinutes,
        rawHours,
        countedMinutes: 0,
        jamOvertime: 0,
        overtimeType: 'OFF_DAY',
        overtimeTypeLabel: 'Lembur Hari Libur (H.O.T)',
        isTolerance: false,
        startDt,
        endDt,
        shiftWindow
      };
    }

    // Setiap input jam lembur dikurangi 1 jam (60 menit)
    const countedMinutes = Math.max(0, rawMinutes - 60);
    const jamOvertime = Number((countedMinutes / 60).toFixed(2));
    const isTolerance = countedMinutes === 0;

    return {
      isValid: true,
      errorMessage: isTolerance ? 'Durasi ≤ 1 Jam (setelah dipotong 1 jam bernilai 0 jam lembur)' : null,
      warningMessage: isTolerance ? 'Durasi lembur dipotong 1 jam, sehingga total jam lembur sah adalah 0 jam.' : null,
      rawMinutes,
      rawHours,
      countedMinutes,
      jamOvertime,
      overtimeType: 'OFF_DAY',
      overtimeTypeLabel: 'Lembur Hari Libur (H.O.T)',
      isTolerance,
      startDt,
      endDt,
      shiftWindow
    };
  }

  // Deteksi Pre-Shift, Post-Shift, atau Overlap (Hari Kerja / D.O.T)
  let detectedType = overtimeType;
  let isOverlap = false;

  // Cek Overlap dengan Jam Kerja Shift Resmi
  // Overlap terjadi jika rentang lembur [startDt, endDt] bertabrakan dengan rentang shift [shiftStart, shiftEnd]
  // Overlap condition: startDt < shiftEnd && endDt > shiftStart
  if (startDt < shiftWindow.shiftEnd && endDt > shiftWindow.shiftStart) {
    // Jika ada yang tepat berbatasan di batas awal atau akhir shift:
    if (endDt <= shiftWindow.shiftStart) {
      // Pre-shift sah
      detectedType = 'PRE_SHIFT';
    } else if (startDt >= shiftWindow.shiftEnd) {
      // Post-shift sah
      detectedType = 'POST_SHIFT';
    } else {
      isOverlap = true;
    }
  } else if (endDt <= shiftWindow.shiftStart) {
    detectedType = 'PRE_SHIFT';
  } else if (startDt >= shiftWindow.shiftEnd) {
    detectedType = 'POST_SHIFT';
  } else {
    detectedType = 'OUTSIDE_SHIFT';
  }

  if (isOverlap) {
    return {
      isValid: false,
      errorMessage: `Waktu lembur bertabrakan dengan Jam Shift Resmi (${shiftWindow.shift.shortLabel}). Lembur hanya boleh dilakukan sebelum atau sesudah shift resmi.`,
      rawMinutes,
      rawHours,
      countedMinutes: 0,
      jamOvertime: 0,
      overtimeType: 'OVERLAP',
      isTolerance: false,
      startDt,
      endDt,
      shiftWindow
    };
  }

  // Setiap input jam lembur dikurangi 1 jam (60 menit)
  const countedMinutes = Math.max(0, rawMinutes - 60);
  const jamOvertime = Number((countedMinutes / 60).toFixed(2));
  const isTolerance = countedMinutes === 0;

  const typeLabels = {
    'PRE_SHIFT': 'Pre-Shift (Sebelum Shift)',
    'POST_SHIFT': 'Post-Shift (Setelah Shift)',
    'OFF_DAY': 'Lembur Hari Libur (H.O.T)',
    'OUTSIDE_SHIFT': 'Di Luar Shift'
  };

  return {
    isValid: true,
    errorMessage: isTolerance ? 'Durasi ≤ 1 Jam (setelah dipotong 1 jam bernilai 0 jam lembur)' : null,
    warningMessage: isTolerance ? 'Durasi lembur dipotong 1 jam, sehingga total jam lembur sah adalah 0 jam.' : null,
    rawMinutes,
    rawHours,
    countedMinutes,
    jamOvertime,
    overtimeType: detectedType,
    overtimeTypeLabel: typeLabels[detectedType] || detectedType,
    isTolerance,
    startDt,
    endDt,
    shiftWindow
  };
}
