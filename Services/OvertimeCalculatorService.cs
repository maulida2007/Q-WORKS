using System;
using System.Collections.Generic;
using QWorks.Models.ViewModels;

namespace QWorks.Services
{
    public interface IOvertimeCalculatorService
    {
        bool IsWeekendOrHoliday(DateTime date);
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
        private static readonly HashSet<string> IndonesianHolidays = new()
        {
            "01-01", "05-01", "06-01", "08-17", "12-25",
            // 2026
            "2026-01-01", "2026-01-16", "2026-02-17", "2026-03-20", "2026-03-21", "2026-03-22",
            "2026-04-03", "2026-05-01", "2026-05-14", "2026-05-31", "2026-06-01", "2026-06-27",
            "2026-07-16", "2026-08-17", "2026-08-25", "2026-12-25",
            // 2025
            "2025-01-01", "2025-01-27", "2025-01-29", "2025-03-29", "2025-03-31", "2025-04-01",
            "2025-04-18", "2025-05-01", "2025-05-12", "2025-05-29", "2025-06-01", "2025-06-07",
            "2025-06-27", "2025-08-17", "2025-09-05", "2025-12-25"
        };

        public bool IsWeekendOrHoliday(DateTime date)
        {
            if (date.DayOfWeek == DayOfWeek.Sunday)
            {
                return true;
            }

            string fullDateStr = date.ToString("yyyy-MM-dd");
            string mmddStr = date.ToString("MM-dd");

            return IndonesianHolidays.Contains(fullDateStr) || IndonesianHolidays.Contains(mmddStr);
        }

        public double CalculateTul(double jamOvertime, bool isHoliday)
        {
            if (jamOvertime <= 0) return 0;

            if (isHoliday)
            {
                if (jamOvertime <= 7)
                    return Math.Round(jamOvertime * 2.0, 2);
                else if (jamOvertime <= 8)
                    return Math.Round(14.0 + (jamOvertime - 7.0) * 3.0, 2);
                else
                    return Math.Round(17.0 + (jamOvertime - 8.0) * 4.0, 2);
            }
            else
            {
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
                    return $"{jamOvertime} jam × 2.0 = {tul} TUL (Hari Libur / Minggu Jam 1-7: ×2.0)";
                }
                else if (jamOvertime <= 8)
                {
                    double sisa = Math.Round(jamOvertime - 7.0, 2);
                    double tul = Math.Round(14.0 + sisa * 3.0, 2);
                    return $"7 jam (14 TUL) + {sisa} jam × 3.0 = {tul} TUL (Hari Libur Jam ke-8: ×3.0)";
                }
                else
                {
                    double sisa = Math.Round(jamOvertime - 8.0, 2);
                    double tul = Math.Round(17.0 + sisa * 4.0, 2);
                    return $"7 jam (14 TUL) + 1 jam (3 TUL) + {sisa} jam × 4.0 = {tul} TUL (Hari Libur Jam ke-9+: ×4.0)";
                }
            }
            else
            {
                if (jamOvertime <= 1)
                {
                    double tul = Math.Round(jamOvertime * 1.5, 2);
                    return $"{jamOvertime} jam × 1.5 = {tul} TUL (Hari Kerja Jam ke-1: ×1.5)";
                }
                else
                {
                    double sisa = Math.Round(jamOvertime - 1.0, 2);
                    double tul = Math.Round(1.5 + sisa * 2.0, 2);
                    return $"1 jam (1.5 TUL) + {sisa} jam × 2.0 = {tul} TUL (Hari Kerja Jam ke-2+: ×2.0)";
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

                // Cek Libur
                if (isHoliday)
                {
                    double rawHours = Math.Round(rawMinutes / 60.0, 2);
                    if (rawHours > 7)
                    {
                        return new OvertimeCalculationResult(
                            false,
                            $"Lembur Hari Libur (H.O.T) maksimal 7 Jam (tidak boleh lebih). Durasi input saat ini: {rawHours} Jam.",
                            "Lembur pada hari libur (H.O.T) dibatasi maksimal 7 jam.",
                            "OFF_DAY",
                            "Lembur Hari Libur (H.O.T)",
                            rawMinutes,
                            0,
                            0,
                            0,
                            false,
                            jamWaktu,
                            "0 TUL"
                        );
                    }

                    int countedMin = Math.Max(0, rawMinutes);
                    bool isTol = countedMin < 30;
                    if (isTol) countedMin = 0;

                    double jamOt = Math.Round(countedMin / 60.0, 2);
                    double tul = CalculateTul(jamOt, true);
                    string breakdown = GetTULBreakdown(jamOt, true);

                    return new OvertimeCalculationResult(
                        true,
                        isTol ? "Durasi < 30 menit (Toleransi 0 Jam lembur)" : null,
                        isTol ? "Durasi lembur di bawah 30 menit bernilai toleransi 0 jam." : null,
                        "OFF_DAY",
                        "Lembur Hari Libur (H.O.T)",
                        rawMinutes,
                        countedMin,
                        jamOt,
                        tul,
                        isTol,
                        jamWaktu,
                        breakdown
                    );
                }

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

                bool isTolerance = rawMinutes < 30;
                int countedMinutes = isTolerance ? 0 : rawMinutes;
                double jamOvertime = Math.Round(countedMinutes / 60.0, 2);
                double totalTul = CalculateTul(jamOvertime, false);
                string tulFormula = GetTULBreakdown(jamOvertime, false);

                string typeLabel = detectedType == "PRE_SHIFT" ? "Pre-Shift (Sebelum Shift)" : "Post-Shift (Setelah Shift)";

                return new OvertimeCalculationResult(
                    true,
                    isTolerance ? "Durasi < 30 menit (Toleransi 0 Jam)" : null,
                    isTolerance ? "Lembur < 30 menit dianggap toleransi." : null,
                    detectedType,
                    typeLabel,
                    rawMinutes,
                    countedMinutes,
                    jamOvertime,
                    totalTul,
                    isTolerance,
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
                return new OvertimeCalculationResult(false, "Jam lembur harus lebih besar dari 0.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false, "", "");
            }

            if (isHoliday && hours > 7)
            {
                return new OvertimeCalculationResult(false, "Lembur hari libur maksimal 7 jam.", null, "OFF_DAY", "Lembur Hari Libur (H.O.T)", (int)(hours * 60), 0, 0, 0, false, "", "");
            }

            int rawMinutes = (int)Math.Round(hours * 60.0);
            bool isTolerance = rawMinutes < 30;
            int countedMinutes = isTolerance ? 0 : rawMinutes;
            double jamOvertime = Math.Round(countedMinutes / 60.0, 2);
            double totalTul = CalculateTul(jamOvertime, isHoliday);
            string formula = GetTULBreakdown(jamOvertime, isHoliday);
            string jamWaktu = GetFallbackJamWaktu(shiftName, jamOvertime, isHoliday);

            return new OvertimeCalculationResult(
                true,
                null,
                null,
                isHoliday ? "OFF_DAY" : "POST_SHIFT",
                isHoliday ? "Lembur Hari Libur (H.O.T)" : "Post-Shift",
                rawMinutes,
                countedMinutes,
                jamOvertime,
                totalTul,
                isTolerance,
                jamWaktu,
                formula
            );
        }
    }
}
