using System;
using QWorks.Models;

namespace QWorks.Services
{
    public class OvertimeCalculatorService
    {
        public static (TimeSpan Start, TimeSpan End, bool IsOvernight) GetShiftConfig(string shiftName)
        {
            if (shiftName.Equals("Shift 2", StringComparison.OrdinalIgnoreCase))
            {
                return (new TimeSpan(7, 30, 0), new TimeSpan(16, 30, 0), false);
            }
            // Default Shift 1: 22:30 s/d 07:30 (Lintas Malam)
            return (new TimeSpan(22, 30, 0), new TimeSpan(7, 30, 0), true);
        }

        public static (DateTime ShiftStart, DateTime ShiftEnd) GetShiftWindow(DateTime workDate, string shiftName)
        {
            var config = GetShiftConfig(shiftName);
            DateTime shiftStart = workDate.Date.Add(config.Start);
            DateTime shiftEnd = config.IsOvernight 
                ? workDate.Date.AddDays(1).Add(config.End) 
                : workDate.Date.Add(config.End);

            return (shiftStart, shiftEnd);
        }

        public static DateTime ParseTime(DateTime workDate, string timeStr, string shiftName)
        {
            var parts = timeStr.Split(':');
            int h = int.Parse(parts[0]);
            int m = int.Parse(parts[1]);

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

        public static double CalculateTul(double jamOvertime, bool isHoliday)
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

        public static OvertimeCalculationResult Calculate(
            string shiftName, 
            DateTime workDate, 
            string startTimeStr, 
            string endTimeStr, 
            bool isHoliday)
        {
            if (string.IsNullOrWhiteSpace(startTimeStr) || string.IsNullOrWhiteSpace(endTimeStr))
            {
                return new OvertimeCalculationResult(false, "Waktu mulai dan selesai wajib diisi.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false);
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
                    return new OvertimeCalculationResult(false, "Waktu selesai harus lebih besar dari waktu mulai.", null, "UNKNOWN", "Unknown", 0, 0, 0, 0, false);
                }

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
                            false
                        );
                    }

                    int countedMin = Math.Max(0, rawMinutes - 60);
                    bool isTol = countedMin == 0;
                    double jamOt = Math.Round(countedMin / 60.0, 2);
                    double tul = CalculateTul(jamOt, true);

                    return new OvertimeCalculationResult(
                        true,
                        isTol ? "Durasi ≤ 1 Jam (setelah dipotong 1 jam bernilai 0 jam lembur)" : null,
                        isTol ? "Durasi lembur dipotong 1 jam, sehingga total jam lembur sah adalah 0 jam." : null,
                        "OFF_DAY",
                        "Lembur Hari Libur (H.O.T)",
                        rawMinutes,
                        countedMin,
                        jamOt,
                        tul,
                        isTol
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
                        false
                    );
                }

                bool isTolerance = rawMinutes < 30;
                int countedMinutes = isTolerance ? 0 : rawMinutes;
                double jamOvertime = Math.Round(countedMinutes / 60.0, 2);
                double totalTul = CalculateTul(jamOvertime, false);

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
                    isTolerance
                );
            }
            catch (Exception ex)
            {
                return new OvertimeCalculationResult(false, $"Gagal memproses waktu: {ex.Message}", null, "ERROR", "Error", 0, 0, 0, 0, false);
            }
        }
    }
}
