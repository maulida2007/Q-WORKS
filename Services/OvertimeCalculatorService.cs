using System;
using System.Collections.Generic;
using QWorks.Models.ViewModels;

namespace QWorks.Services
{
    public interface IOvertimeCalculatorService
    {
        bool IsWeekendOrHoliday(DateTime date);
        (bool IsHoliday, string Description) CheckHoliday(DateTime date);
        double CalculateTul(double jamOvertime, bool isHoliday);
        string GetTULBreakdown(double jamOvertime, bool isHoliday);
        (TimeSpan Start, TimeSpan End, bool IsOvernight) GetShiftConfig(string shiftName);
        (DateTime ShiftStart, DateTime ShiftEnd) GetShiftWindow(DateTime workDate, string shiftName);
        DateTime ParseTime(DateTime workDate, string timeStr, string shiftName);
        string GetFallbackJamWaktu(string shiftName, double jamOvertime, bool isHoliday);
        OvertimeCalculationResult Calculate(string shiftName, DateTime workDate, string startTimeStr, string endTimeStr, bool isHoliday);
        OvertimeCalculationResult CalculateFromManualHours(string shiftName, DateTime workDate, double hours, bool isHoliday);
    }

    public class OvertimeCalculatorService : IOvertimeCalculatorService
    {
        // Hari Libur Nasional Berulang Tetap (MM-dd)
        private static readonly Dictionary<string, string> FixedAnnualHolidays = new()
        {
            { "01-01", "Tahun Baru Masehi" },
            { "05-01", "Hari Buruh Internasional" },
            { "06-01", "Hari Lahir Pancasila" },
            { "08-17", "Hari Proklamasi Kemerdekaan Republik Indonesia" },
            { "12-25", "Hari Raya Natal" }
        };

        // Hari Libur Nasional Dinamis Indonesia (Kalender Hijriah, Saka, Imlek, Masehi Dinamis)
        private static readonly Dictionary<string, string> DynamicNationalHolidays = new()
        {
            // --- TAHUN 2026 ---
            { "2026-01-01", "Tahun Baru 2026 Masehi" },
            { "2026-01-16", "Isra Mi'raj Nabi Muhammad SAW" },
            { "2026-02-17", "Tahun Baru Imlek 2577 Kongzili" },
            { "2026-03-20", "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
            { "2026-03-21", "Hari Raya Idul Fitri 1447 H (Hari Ke-1)" },
            { "2026-03-22", "Hari Raya Idul Fitri 1447 H (Hari Ke-2)" },
            { "2026-04-03", "Wafat Yesus Kristus (Jumat Agung)" },
            { "2026-04-05", "Hari Paskah" },
            { "2026-05-01", "Hari Buruh Internasional" },
            { "2026-05-14", "Kenaikan Yesus Kristus" },
            { "2026-05-31", "Hari Raya Waisak 2570 BE" },
            { "2026-06-01", "Hari Lahir Pancasila" },
            { "2026-06-27", "Hari Raya Idul Adha 1447 H" },
            { "2026-07-16", "Tahun Baru Islam 1448 H" },
            { "2026-08-17", "Hari Kemerdekaan RI Ke-81" },
            { "2026-08-25", "Maulid Nabi Muhammad SAW" },
            { "2026-12-25", "Hari Raya Natal" },

            // --- TAHUN 2025 ---
            { "2025-01-01", "Tahun Baru 2025 Masehi" },
            { "2025-01-27", "Isra Mi'raj Nabi Muhammad SAW" },
            { "2025-01-29", "Tahun Baru Imlek 2576 Kongzili" },
            { "2025-03-29", "Hari Suci Nyepi (Tahun Baru Saka 1947)" },
            { "2025-03-31", "Hari Raya Idul Fitri 1446 H (Hari Ke-1)" },
            { "2025-04-01", "Hari Raya Idul Fitri 1446 H (Hari Ke-2)" },
            { "2025-04-18", "Wafat Yesus Kristus (Jumat Agung)" },
            { "2025-04-20", "Hari Paskah" },
            { "2025-05-01", "Hari Buruh Internasional" },
            { "2025-05-12", "Hari Raya Waisak 2569 BE" },
            { "2025-05-29", "Kenaikan Yesus Kristus" },
            { "2025-06-01", "Hari Lahir Pancasila" },
            { "2025-06-07", "Hari Raya Idul Adha 1446 H" },
            { "2025-06-27", "Tahun Baru Islam 1447 H" },
            { "2025-08-17", "Hari Kemerdekaan RI Ke-80" },
            { "2025-09-05", "Maulid Nabi Muhammad SAW" },
            { "2025-12-25", "Hari Raya Natal" },

            // --- TAHUN 2024 ---
            { "2024-01-01", "Tahun Baru 2024 Masehi" },
            { "2024-02-08", "Isra Mi'raj Nabi Muhammad SAW" },
            { "2024-02-10", "Tahun Baru Imlek 2575 Kongzili" },
            { "2024-03-11", "Hari Suci Nyepi (Tahun Baru Saka 1946)" },
            { "2024-03-29", "Wafat Yesus Kristus" },
            { "2024-04-10", "Hari Raya Idul Fitri 1445 H (Hari Ke-1)" },
            { "2024-04-11", "Hari Raya Idul Fitri 1445 H (Hari Ke-2)" },
            { "2024-05-01", "Hari Buruh Internasional" },
            { "2024-05-09", "Kenaikan Yesus Kristus" },
            { "2024-05-23", "Hari Raya Waisak 2568 BE" },
            { "2024-06-01", "Hari Lahir Pancasila" },
            { "2024-06-17", "Hari Raya Idul Adha 1445 H" },
            { "2024-07-07", "Tahun Baru Islam 1446 H" },
            { "2024-08-17", "Hari Kemerdekaan RI Ke-79" },
            { "2024-09-16", "Maulid Nabi Muhammad SAW" },
            { "2024-12-25", "Hari Raya Natal" }
        };

        public (bool IsHoliday, string Description) CheckHoliday(DateTime date)
        {
            if (date.DayOfWeek == DayOfWeek.Sunday)
            {
                return (true, "Hari Minggu");
            }

            string fullDate = date.ToString("yyyy-MM-dd");
            if (DynamicNationalHolidays.TryGetValue(fullDate, out var holidayDesc))
            {
                return (true, holidayDesc);
            }

            string mmdd = date.ToString("MM-dd");
            if (FixedAnnualHolidays.TryGetValue(mmdd, out var fixedDesc))
            {
                return (true, fixedDesc);
            }

            return (false, "Hari Kerja Biasa");
        }

        public bool IsWeekendOrHoliday(DateTime date)
        {
            return CheckHoliday(date).IsHoliday;
        }

        public double CalculateTul(double jamOvertime, bool isHoliday)
        {
            if (jamOvertime <= 0) return 0;

            if (isHoliday)
            {
                // Hari Libur / Minggu:
                // Jam ke 1-7: x2.0
                // Jam ke-8: x3.0
                // Jam ke-9+: x4.0
                if (jamOvertime <= 7)
                    return Math.Round(jamOvertime * 2.0, 2);
                else if (jamOvertime <= 8)
                    return Math.Round(14.0 + (jamOvertime - 7.0) * 3.0, 2);
                else
                    return Math.Round(17.0 + (jamOvertime - 8.0) * 4.0, 2);
            }
            else
            {
                // Hari Kerja Biasa:
                // Jam ke-1: x1.5
                // Jam ke-2+: x2.0
                if (jamOvertime <= 1)
                    return Math.Round(jamOvertime * 1.5, 2);
                else
                    return Math.Round(1.5 + (jamOvertime - 1.0) * 2.0, 2);
            }
        }

        public string GetTULBreakdown(double jamOvertime, bool isHoliday)
        {
            if (jamOvertime <= 0) return "0 Jam = 0 TUL";

            if (isHoliday)
            {
                if (jamOvertime <= 7)
                {
                    double tul = Math.Round(jamOvertime * 2.0, 2);
                    return $"{jamOvertime:0.#} jam kerja × 2.0 = {tul:0.#} TUL (Hari Libur: {jamOvertime:0.#} jam kerja bersih setelah istirahat 1 jam)";
                }
                else if (jamOvertime <= 8)
                {
                    double sisa = Math.Round(jamOvertime - 7.0, 2);
                    double tul = Math.Round(14.0 + sisa * 3.0, 2);
                    return $"7 jam (14 TUL) + {sisa:0.#} jam × 3.0 = {tul:0.#} TUL (Hari Libur Jam ke-8: ×3.0)";
                }
                else
                {
                    double sisa = Math.Round(jamOvertime - 8.0, 2);
                    double tul = Math.Round(17.0 + sisa * 4.0, 2);
                    return $"7 jam (14 TUL) + 1 jam (3 TUL) + {sisa:0.#} jam × 4.0 = {tul:0.#} TUL (Hari Libur Jam ke-9+: ×4.0)";
                }
            }
            else
            {
                if (jamOvertime <= 1)
                {
                    double tul = Math.Round(jamOvertime * 1.5, 2);
                    return $"{jamOvertime:0.#} jam × 1.5 = {tul:0.#} TUL (Hari Kerja Jam ke-1: ×1.5)";
                }
                else
                {
                    double sisa = Math.Round(jamOvertime - 1.0, 2);
                    double tul = Math.Round(1.5 + sisa * 2.0, 2);
                    return $"1 jam (1.5 TUL) + {sisa:0.#} jam × 2.0 = {tul:0.#} TUL (Hari Kerja: Jam 1 ×1.5, Jam 2+ ×2.0)";
                }
            }
        }

        public (TimeSpan Start, TimeSpan End, bool IsOvernight) GetShiftConfig(string shiftName)
        {
            if (shiftName != null && shiftName.Equals("Shift 2", StringComparison.OrdinalIgnoreCase))
            {
                return (new TimeSpan(7, 30, 0), new TimeSpan(16, 30, 0), false);
            }
            // Default Shift 1: 22:30 s/d 07:30 (Lintas Malam)
            return (new TimeSpan(22, 30, 0), new TimeSpan(7, 30, 0), true);
        }

        public (DateTime ShiftStart, DateTime ShiftEnd) GetShiftWindow(DateTime workDate, string shiftName)
        {
            var config = GetShiftConfig(shiftName);
            DateTime shiftStart = workDate.Date.Add(config.Start);
            DateTime shiftEnd = config.IsOvernight 
                ? workDate.Date.AddDays(1).Add(config.End) 
                : workDate.Date.Add(config.End);

            return (shiftStart, shiftEnd);
        }

        public DateTime ParseTime(DateTime workDate, string timeStr, string shiftName)
        {
            var parts = (timeStr ?? "07:30").Split(':');
            int h = int.Parse(parts[0]);
            int m = parts.Length > 1 ? int.Parse(parts[1]) : 0;

            var config = GetShiftConfig(shiftName);
            if (config.IsOvernight)
            {
                if (h >= 12)
                {
                    return workDate.Date.AddHours(h).AddMinutes(m);
                }
                else
                {
                    return workDate.Date.AddDays(1).AddHours(h).AddMinutes(m);
                }
            }
            else
            {
                return workDate.Date.AddHours(h).AddMinutes(m);
            }
        }

        public string GetFallbackJamWaktu(string shiftName, double jamOvertime, bool isHoliday)
        {
            double dur = jamOvertime > 0 ? jamOvertime : 2.0;
            bool isShift2 = shiftName != null && shiftName.Contains("2");

            if (isHoliday)
            {
                int startH = 7;
                int startM = 30;
                int endMinutes = startH * 60 + startM + (int)Math.Round(dur * 60);
                int endH = (endMinutes / 60) % 24;
                int endM = endMinutes % 60;
                return $"{startH:D2}:{startM:D2} - {endH:D2}:{endM:D2}";
            }

            if (isShift2)
            {
                int startH = 0;
                int startM = 30;
                int endMinutes = startH * 60 + startM + (int)Math.Round(dur * 60);
                int endH = (endMinutes / 60) % 24;
                int endM = endMinutes % 60;
                return $"00:30 - {endH:D2}:{endM:D2}";
            }
            else
            {
                int startH = 16;
                int startM = 30;
                int endMinutes = startH * 60 + startM + (int)Math.Round(dur * 60);
                int endH = (endMinutes / 60) % 24;
                int endM = endMinutes % 60;
                return $"16:30 - {endH:D2}:{endM:D2}";
            }
        }

        public OvertimeCalculationResult Calculate(
            string shiftName, 
            DateTime workDate, 
            string startTimeStr, 
            string endTimeStr, 
            bool isHoliday)
        {
            if (string.IsNullOrWhiteSpace(startTimeStr) || string.IsNullOrWhiteSpace(endTimeStr))
            {
                return new OvertimeCalculationResult(false, "Waktu mulai dan selesai wajib diisi.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false, "", "");
            }

            try
            {
                var shiftWindow = GetShiftWindow(workDate, shiftName);
                DateTime startDt = ParseTime(workDate, startTimeStr, shiftName);
                DateTime endDt = ParseTime(workDate, endTimeStr, shiftName);

                if (endDt <= startDt)
                {
                    endDt = endDt.AddDays(1);
                }

                int rawMinutes = (int)Math.Round((endDt - startDt).TotalMinutes);
                if (rawMinutes <= 0)
                {
                    return new OvertimeCalculationResult(false, "Waktu selesai harus lebih besar dari waktu mulai.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false, "", "");
                }

                string jamWaktu = $"{startTimeStr} - {endTimeStr}";
                double rawHours = Math.Round(rawMinutes / 60.0, 2);

                // ATURAN 3: Validasi durasi input minimal
                // Setiap lembur mendapatkan pengurangan tetap 1 jam (60 menit) untuk istirahat.
                // Jika input <= 1 jam (60 menit), durasi bersih <= 0 sehingga ditolak.
                if (rawMinutes <= 60)
                {
                    return new OvertimeCalculationResult(
                        false,
                        $"Durasi lembur input ({rawHours:0.#} jam / {rawMinutes} menit) tidak valid. Durasi input harus lebih dari 1 jam (60 menit) karena terdapat pengurangan tetap 1 jam untuk waktu istirahat.",
                        null,
                        "INVALID_DURATION",
                        "Durasi Input Tidak Valid",
                        rawMinutes,
                        0,
                        0,
                        0,
                        false,
                        jamWaktu,
                        "0 TUL"
                    );
                }

                // ATURAN 4: Penentuan Hari Libur
                var holidayInfo = CheckHoliday(workDate);
                bool isEffectiveHoliday = isHoliday || holidayInfo.IsHoliday;

                // ATURAN 2: Hari Libur (Hari Minggu atau Libur Nasional)
                // - Maksimal total durasi input lembur adalah 7 jam (420 menit), sudah termasuk 1 jam istirahat.
                // - Jam kerja efektif/bersih adalah maksimal 6 jam (durasi input - 1 jam istirahat).
                // - Semua karyawan tidak diperbolehkan memasukkan lebih dari 7 jam total input (6 jam kerja + 1 jam istirahat).
                if (isEffectiveHoliday)
                {
                    if (rawMinutes > 7 * 60)
                    {
                        return new OvertimeCalculationResult(
                            false,
                            $"Untuk hari libur ({holidayInfo.Description}), batas maksimal input adalah 7 jam (sudah termasuk 1 jam istirahat, sehingga jam kerja efektif cuma 6 jam). Durasi input Anda adalah {rawHours:0.#} jam ({rawMinutes} menit).",
                            null,
                            "EXCEEDS_HOLIDAY_LIMIT",
                            $"Melebihi Batas Hari Libur ({holidayInfo.Description})",
                            rawMinutes,
                            0,
                            0,
                            0,
                            false,
                            jamWaktu,
                            "0 TUL"
                        );
                    }

                    int countedMinutes = rawMinutes - 60; // kurangi 1 jam istirahat
                    double jamOvertime = Math.Round(countedMinutes / 60.0, 2);
                    double totalTul = CalculateTul(jamOvertime, true);
                    string breakdown = GetTULBreakdown(jamOvertime, true);

                    return new OvertimeCalculationResult(
                        true,
                        null,
                        null,
                        "OFF_DAY",
                        $"Lembur Hari Libur ({holidayInfo.Description})",
                        rawMinutes,
                        countedMinutes,
                        jamOvertime,
                        totalTul,
                        false,
                        jamWaktu,
                        breakdown
                    );
                }

                // ATURAN 1: Hari Kerja Biasa
                // - Tidak ada batas maksimal durasi lembur.
                // - Setiap karyawan mendapatkan pengurangan tetap 1 jam untuk istirahat.
                // - Rumus: durasi lembur bersih = durasi lembur input - 1 jam.

                // Cek Overlap dengan Jam Shift Resmi
                string detectedType = "POST_SHIFT";
                bool isOverlap = false;

                if (startDt < shiftWindow.ShiftEnd && endDt > shiftWindow.ShiftStart)
                {
                    if (endDt <= shiftWindow.ShiftStart)
                        detectedType = "PRE_SHIFT";
                    else if (startDt >= shiftWindow.ShiftEnd)
                        detectedType = "POST_SHIFT";
                    else
                        isOverlap = true;
                }
                else if (endDt <= shiftWindow.ShiftStart)
                {
                    detectedType = "PRE_SHIFT";
                }
                else if (startDt >= shiftWindow.ShiftEnd)
                {
                    detectedType = "POST_SHIFT";
                }
                else
                {
                    detectedType = "OUTSIDE_SHIFT";
                }

                if (isOverlap)
                {
                    string shiftLabel = shiftName.Equals("Shift 1", StringComparison.OrdinalIgnoreCase) 
                        ? "22:30 - 07:30" 
                        : "07:30 - 16:30";
                    return new OvertimeCalculationResult(
                        false,
                        $"Waktu lembur bertabrakan dengan Jam Kerja Shift Resmi ({shiftLabel}).",
                        null,
                        "OVERLAP",
                        "Bertabrakan dengan Jam Shift",
                        rawMinutes,
                        0,
                        0,
                        0,
                        false,
                        jamWaktu,
                        "0 TUL"
                    );
                }

                int countedMin = rawMinutes - 60; // Pengurangan tetap 1 jam istirahat
                double jamOt = Math.Round(countedMin / 60.0, 2);
                double tul = CalculateTul(jamOt, false);
                string tulFormula = GetTULBreakdown(jamOt, false);

                string typeLabel = detectedType == "PRE_SHIFT" ? "Pre-Shift (Sebelum Shift)" : "Post-Shift (Setelah Shift)";

                return new OvertimeCalculationResult(
                    true,
                    null,
                    null,
                    detectedType,
                    typeLabel,
                    rawMinutes,
                    countedMin,
                    jamOt,
                    tul,
                    false,
                    jamWaktu,
                    tulFormula
                );
            }
            catch (Exception ex)
            {
                return new OvertimeCalculationResult(false, $"Gagal memproses waktu: {ex.Message}", null, "ERROR", "Error", 0, 0, 0, 0, false, "", "");
            }
        }

        public OvertimeCalculationResult CalculateFromManualHours(string shiftName, DateTime workDate, double hours, bool isHoliday)
        {
            if (hours <= 0)
            {
                return new OvertimeCalculationResult(false, "Durasi lembur tidak valid atau bernilai 0.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false, "", "");
            }

            // ATURAN 3: Validasi input minimal
            if (hours <= 1.0)
            {
                return new OvertimeCalculationResult(
                    false, 
                    $"Durasi lembur ({hours:0.#} jam) tidak valid. Durasi input harus lebih dari 1 jam karena terdapat pengurangan tetap 1 jam untuk waktu istirahat.", 
                    null, 
                    "INVALID_DURATION", 
                    "Durasi Input Tidak Valid", 
                    (int)Math.Round(hours * 60.0), 
                    0, 
                    0, 
                    0, 
                    false, 
                    "", 
                    ""
                );
            }

            int rawMinutes = (int)Math.Round(hours * 60.0);
            var holidayInfo = CheckHoliday(workDate);
            bool isEffectiveHoliday = isHoliday || holidayInfo.IsHoliday;

            int countedMinutes;
            string? warning = null;

            if (isEffectiveHoliday)
            {
                if (rawMinutes > 7 * 60 || hours > 7.0)
                {
                    return new OvertimeCalculationResult(
                        false,
                        $"Untuk hari libur ({holidayInfo.Description}), batas maksimal input adalah 7 jam (sudah termasuk 1 jam istirahat, sehingga jam kerja efektif cuma 6 jam). Durasi input Anda adalah {hours:0.#} jam ({rawMinutes} menit).",
                        null,
                        "EXCEEDS_HOLIDAY_LIMIT",
                        $"Melebihi Batas Hari Libur ({holidayInfo.Description})",
                        rawMinutes,
                        0,
                        0,
                        0,
                        false,
                        "",
                        "0 TUL"
                    );
                }

                // ATURAN 2: durasi input - 1 jam
                countedMinutes = rawMinutes - 60;
            }
            else
            {
                // ATURAN 1: durasi input - 1 jam
                countedMinutes = rawMinutes - 60;
            }

            double jamOvertime = Math.Round(countedMinutes / 60.0, 2);
            double totalTul = CalculateTul(jamOvertime, isEffectiveHoliday);
            string formula = GetTULBreakdown(jamOvertime, isEffectiveHoliday);
            string jamWaktu = GetFallbackJamWaktu(shiftName, jamOvertime, isEffectiveHoliday);

            return new OvertimeCalculationResult(
                true,
                null,
                warning,
                isEffectiveHoliday ? "OFF_DAY" : "POST_SHIFT",
                isEffectiveHoliday ? $"Lembur Hari Libur ({holidayInfo.Description})" : "Post-Shift",
                rawMinutes,
                countedMinutes,
                jamOvertime,
                totalTul,
                false,
                jamWaktu,
                formula
            );
        }
    }
}
