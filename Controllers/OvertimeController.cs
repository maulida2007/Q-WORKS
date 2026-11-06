using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models;
using QWorks.Models.ViewModels;
using QWorks.Services;

namespace QWorks.Controllers
{
    [Authorize]
    public class OvertimeController : Controller
    {
        private readonly QWorksDbContext _context;
        private readonly IAuthService _authService;
        private readonly IOvertimeCalculatorService _calcService;
        private readonly IExcelService _excelService;

        public OvertimeController(
            QWorksDbContext context,
            IAuthService authService,
            IOvertimeCalculatorService calcService,
            IExcelService excelService)
        {
            _context = context;
            _authService = authService;
            _calcService = calcService;
            _excelService = excelService;
        }

        // ==========================================
        // 1. INPUT DATA QC
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Input()
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            var allowedPlants = _authService.GetAllowedPlants(user);

            var empQuery = _context.Users.Where(u => u.Role == "karyawan" && u.IsActive);
            if (user.IsKaryawan)
            {
                empQuery = empQuery.Where(u => allowedPlants.Contains(u.Plant));
            }

            var employees = await empQuery.OrderBy(u => u.Plant).ThenBy(u => u.Name).ToListAsync();
            var shifts = await _context.Shifts.Where(s => s.IsActive).ToListAsync();

            string defaultPlant = user.IsKaryawan ? user.Plant : (allowedPlants.FirstOrDefault() ?? "Plant Hose");

            var vm = new InputOvertimeViewModel
            {
                AvailableEmployees = employees,
                AllowedPlants = allowedPlants,
                AvailableShifts = shifts,
                DefaultPlant = defaultPlant,
                DefaultDate = DateTime.Now.ToString("yyyy-MM-dd"),
                DefaultShift = "Shift 1",
                TimeIn = "07:30",
                TimeOut = "09:30"
            };

            return View(vm);
        }

        [HttpPost]
        public IActionResult Preview([FromBody] PreviewOvertimeDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Data tidak valid." });

            DateTime workDate;
            if (!DateTime.TryParse(dto.WorkDate, out workDate))
            {
                workDate = DateTime.Today;
            }

            bool isHoliday = dto.IsHoliday || _calcService.IsWeekendOrHoliday(workDate);

            var result = _calcService.Calculate(
                dto.ShiftName,
                workDate,
                dto.StartTimeStr,
                dto.EndTimeStr,
                isHoliday
            );

            return Json(new { success = true, data = result });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Submit(
            [FromForm] string plant,
            [FromForm] string shiftName,
            [FromForm] string workDate,
            [FromForm] string jamMasuk,
            [FromForm] string jamPulang,
            [FromForm] double? manualJam,
            [FromForm] bool isHoliday,
            [FromForm] string reason,
            [FromForm] List<string> selectedNpks)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            if (selectedNpks == null || selectedNpks.Count == 0)
            {
                TempData["ToastMessage"] = "Pilih minimal 1 orang pekerja.";
                TempData["ToastType"] = "warning";
                return RedirectToAction("Input");
            }

            DateTime workDt;
            if (!DateTime.TryParse(workDate, out workDt))
            {
                workDt = DateTime.Today;
            }

            bool isHol = isHoliday || _calcService.IsWeekendOrHoliday(workDt);

            OvertimeCalculationResult calc;
            if (manualJam.HasValue && manualJam.Value > 0)
            {
                calc = _calcService.CalculateFromManualHours(shiftName, workDt, manualJam.Value, isHol);
            }
            else
            {
                calc = _calcService.Calculate(shiftName, workDt, jamMasuk, jamPulang, isHol);
            }

            if (!calc.IsValid)
            {
                TempData["ToastMessage"] = calc.ErrorMessage ?? "Kalkulasi lembur tidak valid.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Input");
            }

            string[] monthNames = { "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" };
            string month = $"{monthNames[workDt.Month - 1]} {workDt.Year}";
            int day = workDt.Day;

            string dept = plant.ToLowerInvariant().Replace("plant ", "").Trim();
            if (dept.Contains("lab")) dept = "lab-mixing";

            DateTime now = DateTime.UtcNow;
            var createdRequests = new List<OvertimeRequest>();

            var workers = await _context.Users
                .Where(u => selectedNpks.Contains(u.Nik))
                .ToListAsync();

            int seq = await _context.OvertimeRequests.CountAsync() + 1;

            foreach (var worker in workers)
            {
                string reqNumber = $"OT-{workDt:yyyyMMdd}-{seq:D3}";
                seq++;

                var req = new OvertimeRequest
                {
                    RequestNumber = reqNumber,
                    UserId = worker.Id,
                    UserNpk = worker.Nik,
                    UserName = worker.Name,
                    Plant = plant,
                    Department = dept,
                    ShiftName = shiftName,
                    WorkDate = workDt,
                    Month = month,
                    Day = day,
                    OvertimeType = calc.OvertimeType,
                    OvertimeTypeLabel = calc.OvertimeTypeLabel,
                    StartTime = _calcService.ParseTime(workDt, jamMasuk, shiftName),
                    EndTime = _calcService.ParseTime(workDt, jamPulang, shiftName),
                    JamWaktu = calc.JamWaktu,
                    RawDurationMinutes = calc.RawMinutes,
                    IsTolerance = calc.IsTolerance,
                    CountedDurationMinutes = calc.CountedMinutes,
                    JamOvertime = calc.JamOvertime,
                    TotalTul = calc.TotalTul,
                    IsHoliday = isHol,
                    DayType = isHol ? "libur" : "kerja",
                    Reason = string.IsNullOrWhiteSpace(reason) ? "Lembur operasional QC & finishing" : reason,
                    Status = "Approved",
                    ApproverName = "Supervisor QC",
                    ApprovedAt = now,
                    CreatedByName = user.Name,
                    CreatedByNpk = user.Npk,
                    CreatedByRole = user.Role,
                    CreatedByPlant = user.Plant,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                createdRequests.Add(req);
            }

            _context.OvertimeRequests.AddRange(createdRequests);

            // Add notification
            _context.NotificationItems.Add(new NotificationItem
            {
                Title = $"Input Lembur: {workers.Count} Pekerja ({plant})",
                Message = $"{workers.Count} Karyawan telah diinput lembur {calc.JamOvertime} Jam ({calc.TotalTul} TUL) pada {workDt:dd MMM yyyy}.",
                Type = "success",
                TimeAgo = "Baru saja",
                IsUnread = true,
                CreatedAt = now
            });

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Berhasil menambahkan data lembur untuk {workers.Count} pekerja!";
            TempData["ToastType"] = "success";

            return RedirectToAction("Rekap");
        }

        // ==========================================
        // 2. REKAP DATA QC
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> Rekap(
            [FromQuery] string? search,
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            var query = _context.OvertimeRequests.AsQueryable();

            // Restricted karyawan only sees allowed plant records
            if (user.IsKaryawan)
            {
                var allowedPlants = _authService.GetAllowedPlants(user);
                query = query.Where(r => allowedPlants.Contains(r.Plant));
            }

            // Keyword Search
            if (!string.IsNullOrWhiteSpace(search))
            {
                string kw = search.Trim().ToLowerInvariant();
                query = query.Where(r => r.UserName.ToLower().Contains(kw) ||
                                         r.UserNpk.ToLower().Contains(kw) ||
                                         r.Plant.ToLower().Contains(kw) ||
                                         r.RequestNumber.ToLower().Contains(kw));
            }

            // Filters (safely filter out empty strings and whitespace)
            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => e.Trim()).ToList() ?? new List<string>();

            int maxDays = DashboardController.GetDaysInMonthString(selMonths.FirstOrDefault());
            var dayList = Enumerable.Range(1, maxDays).Select(d => d.ToString()).ToList();

            // 1. Month Filter
            if (selMonths.Count > 0)
            {
                query = query.Where(r => selMonths.Contains(r.Month));
            }

            // 2. Day Filter
            if (selDays.Count > 0)
            {
                var dayInts = selDays
                    .Select(d => int.TryParse(d.Replace("Tanggal ", "").Trim(), out int val) ? val : 0)
                    .Where(v => v >= 1 && v <= maxDays)
                    .ToList();

                if (dayInts.Count > 0)
                {
                    query = query.Where(r => dayInts.Contains(r.Day));
                }
            }

            // 3. Shift Filter (match by Name or ID)
            if (selShifts.Count > 0)
            {
                var shiftCriteria = new List<string>();
                foreach (var s in selShifts)
                {
                    shiftCriteria.Add(s);
                    if (s == "1" || s.Equals("Shift 1", StringComparison.OrdinalIgnoreCase))
                    {
                        shiftCriteria.Add("1");
                        shiftCriteria.Add("Shift 1");
                    }
                    else if (s == "2" || s.Equals("Shift 2", StringComparison.OrdinalIgnoreCase))
                    {
                        shiftCriteria.Add("2");
                        shiftCriteria.Add("Shift 2");
                    }
                }
                shiftCriteria = shiftCriteria.Distinct().ToList();
                query = query.Where(r => shiftCriteria.Contains(r.ShiftName) || shiftCriteria.Contains(r.ShiftId.ToString()));
            }

            // 4. Plant Filter (match by Plant name or Department)
            if (selPlants.Count > 0)
            {
                query = query.Where(r => selPlants.Contains(r.Plant) || selPlants.Contains(r.Department));
            }

            // 5. Employee Filter (match by NPK or User ID)
            if (selEmployees.Count > 0)
            {
                query = query.Where(r => selEmployees.Contains(r.UserNpk) || selEmployees.Contains(r.UserId.ToString()));
            }

            var records = await query.OrderByDescending(r => r.WorkDate).ThenByDescending(r => r.CreatedAt).ToListAsync();

            double totalJam = Math.Round(records.Sum(r => r.JamOvertime), 2);
            double totalTul = Math.Round(records.Sum(r => r.TotalTul), 2);
            int uniqueEmps = records.Select(r => r.UserNpk).Distinct().Count();

            // Filter master data
            var monthList = await _context.OvertimeRequests
                .Where(r => !string.IsNullOrEmpty(r.Month))
                .OrderByDescending(r => r.WorkDate)
                .Select(r => r.Month)
                .Distinct()
                .ToListAsync();
            if (monthList.Count == 0) monthList = new List<string> { "September 2026" };

            var shiftList = await _context.Shifts.Select(s => s.ShiftName).ToListAsync();
            var plantList = _authService.GetAllowedPlants(user);
            var empList = await _context.Users.Where(u => u.Role == "karyawan").OrderBy(u => u.Name).ToListAsync();

            var vm = new RekapOvertimeViewModel
            {
                Records = records,
                TotalJamOvertime = totalJam,
                TotalTUL = totalTul,
                UniqueEmployees = uniqueEmps,
                TotalRecords = records.Count,
                SearchKeyword = search,
                SelectedMonths = selMonths,
                SelectedDays = selDays,
                SelectedShifts = selShifts,
                SelectedPlants = selPlants,
                SelectedEmployees = selEmployees,
                MonthList = monthList,
                DayList = dayList,
                ShiftList = shiftList,
                PlantList = plantList,
                EmployeeList = empList
            };

            return View(vm);
        }

        // ==========================================
        // 3. ACTIONS: APPROVE, REJECT, EDIT, DELETE
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Approve(int id, string? note)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin menyetujui pengajuan lembur.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            var req = await _context.OvertimeRequests.FindAsync(id);
            if (req == null)
            {
                TempData["ToastMessage"] = "Data pengajuan lembur tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            req.Status = "Approved";
            req.ApproverName = user.Name;
            req.ApprovedAt = DateTime.UtcNow;
            req.ApprovalNote = note;
            req.UpdatedAt = DateTime.UtcNow;

            _context.ApprovalLogs.Add(new ApprovalLog
            {
                OvertimeRequestId = req.Id,
                ActorId = user.Id,
                ActorName = user.Name,
                Action = "APPROVED",
                PreviousStatus = "Pending",
                NewStatus = "Approved",
                Note = note,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Pengajuan lembur {req.RequestNumber} ({req.UserName}) telah disetujui (Approved).";
            TempData["ToastType"] = "success";

            return RedirectToAction("Rekap");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Reject(int id, string? note)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin menolak pengajuan lembur.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            var req = await _context.OvertimeRequests.FindAsync(id);
            if (req == null)
            {
                TempData["ToastMessage"] = "Data pengajuan lembur tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            req.Status = "Rejected";
            req.ApproverName = user.Name;
            req.ApprovedAt = DateTime.UtcNow;
            req.ApprovalNote = note;
            req.UpdatedAt = DateTime.UtcNow;

            _context.ApprovalLogs.Add(new ApprovalLog
            {
                OvertimeRequestId = req.Id,
                ActorId = user.Id,
                ActorName = user.Name,
                Action = "REJECTED",
                PreviousStatus = req.Status,
                NewStatus = "Rejected",
                Note = note,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Pengajuan lembur {req.RequestNumber} telah ditolak (Rejected).";
            TempData["ToastType"] = "warning";

            return RedirectToAction("Rekap");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(
            [FromForm] int id,
            [FromForm] string workDate,
            [FromForm] string shiftName,
            [FromForm] string jamWaktu,
            [FromForm] double jamOvertime,
            [FromForm] string reason)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin mengubah data lembur.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            var req = await _context.OvertimeRequests.FindAsync(id);
            if (req == null)
            {
                TempData["ToastMessage"] = "Data tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            DateTime workDt;
            if (DateTime.TryParse(workDate, out workDt))
            {
                req.WorkDate = workDt;
                string[] monthNames = { "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" };
                req.Month = $"{monthNames[workDt.Month - 1]} {workDt.Year}";
                req.Day = workDt.Day;
                req.IsHoliday = _calcService.IsWeekendOrHoliday(workDt);
                req.DayType = req.IsHoliday ? "libur" : "kerja";
            }

            req.ShiftName = shiftName;
            req.JamWaktu = jamWaktu;
            req.JamOvertime = jamOvertime;
            req.TotalTul = _calcService.CalculateTul(jamOvertime, req.IsHoliday);
            req.Reason = reason;
            req.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Data lembur {req.UserName} berhasil diperbarui!";
            TempData["ToastType"] = "success";

            return RedirectToAction("Rekap");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin menghapus data lembur.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            var req = await _context.OvertimeRequests.FindAsync(id);
            if (req == null)
            {
                TempData["ToastMessage"] = "Data tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Rekap");
            }

            _context.OvertimeRequests.Remove(req);
            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = "Data lembur berhasil dihapus.";
            TempData["ToastType"] = "info";

            return RedirectToAction("Rekap");
        }

        // ==========================================
        // 4. EXPORT REKAP TO EXCEL
        // ==========================================
        [HttpGet]
        [Route("Overtime/Export")]
        [Route("Overtime/ExportExcel")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? search,
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            var query = _context.OvertimeRequests.AsQueryable();

            if (user.IsKaryawan)
            {
                var allowedPlants = _authService.GetAllowedPlants(user);
                query = query.Where(r => allowedPlants.Contains(r.Plant));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string kw = search.Trim().ToLowerInvariant();
                query = query.Where(r => r.UserName.ToLower().Contains(kw) ||
                                         r.UserNpk.ToLower().Contains(kw) ||
                                         r.Plant.ToLower().Contains(kw) ||
                                         r.RequestNumber.ToLower().Contains(kw));
            }

            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => e.Trim()).ToList() ?? new List<string>();

            if (selMonths.Count > 0)
            {
                query = query.Where(r => selMonths.Contains(r.Month));
            }

            if (selDays.Count > 0)
            {
                int maxDays = DashboardController.GetDaysInMonthString(selMonths.FirstOrDefault());
                var dayInts = selDays
                    .Select(d => int.TryParse(d.Replace("Tanggal ", "").Trim(), out int val) ? val : 0)
                    .Where(v => v >= 1 && v <= maxDays)
                    .ToList();

                if (dayInts.Count > 0)
                {
                    query = query.Where(r => dayInts.Contains(r.Day));
                }
            }

            if (selShifts.Count > 0)
            {
                var shiftCriteria = new List<string>();
                foreach (var s in selShifts)
                {
                    shiftCriteria.Add(s);
                    if (s == "1" || s.Equals("Shift 1", StringComparison.OrdinalIgnoreCase))
                    {
                        shiftCriteria.Add("1");
                        shiftCriteria.Add("Shift 1");
                    }
                    else if (s == "2" || s.Equals("Shift 2", StringComparison.OrdinalIgnoreCase))
                    {
                        shiftCriteria.Add("2");
                        shiftCriteria.Add("Shift 2");
                    }
                }
                shiftCriteria = shiftCriteria.Distinct().ToList();
                query = query.Where(r => shiftCriteria.Contains(r.ShiftName) || shiftCriteria.Contains(r.ShiftId.ToString()));
            }

            if (selPlants.Count > 0)
            {
                query = query.Where(r => selPlants.Contains(r.Plant) || selPlants.Contains(r.Department));
            }

            if (selEmployees.Count > 0)
            {
                query = query.Where(r => selEmployees.Contains(r.UserNpk) || selEmployees.Contains(r.UserId.ToString()));
            }

            var records = await query.OrderByDescending(r => r.WorkDate).ToListAsync();
            byte[] bytes = _excelService.ExportRekapOvertime(records);

            string filename = $"Rekap_Overtime_QWORKS_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
        }
    }
}
