using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models.ViewModels;
using QWorks.Services;

namespace QWorks.Controllers
{
    [Authorize]
    public class RiwayatPenginputController : Controller
    {
        private readonly QWorksDbContext _context;
        private readonly IAuthService _authService;
        private readonly IExcelService _excelService;

        public RiwayatPenginputController(
            QWorksDbContext context,
            IAuthService authService,
            IExcelService excelService)
        {
            _context = context;
            _authService = authService;
            _excelService = excelService;
        }

        [HttpGet]
        public async Task<IActionResult> Index(
            [FromQuery] string? search,
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Menu Riwayat Penginput hanya dapat diakses oleh Administrator.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index", "Dashboard");
            }

            var query = _context.OvertimeRequests.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string kw = search.Trim().ToLowerInvariant();
                query = query.Where(r => (r.CreatedByName != null && r.CreatedByName.ToLower().Contains(kw)) ||
                                         (r.CreatedByNpk != null && r.CreatedByNpk.ToLower().Contains(kw)) ||
                                         r.UserName.ToLower().Contains(kw) ||
                                         r.UserNpk.ToLower().Contains(kw) ||
                                         r.RequestNumber.ToLower().Contains(kw));
            }

            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m) && !m.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !m.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d) && !d.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !d.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s) && !s.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !s.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p) && !p.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !p.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e) && !e.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !e.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(e => e.Trim()).ToList() ?? new List<string>();

            var empQuery = _context.Users.Where(u => u.Role == "karyawan" && u.IsActive).OrderBy(u => u.Name).AsQueryable();
            var normPlants = DashboardController.NormalizePlantCriteria(selPlants);
            if (normPlants.PlantNames.Count > 0)
            {
                empQuery = empQuery.Where(u => normPlants.PlantNames.Contains(u.Plant) || normPlants.DeptNames.Contains(u.Department));
            }
            var empList = await empQuery.ToListAsync();

            // Apply unified filters with AND logic
            query = DashboardController.FilterOvertimeQuery(query, ref selMonths, ref selDays, ref selShifts, ref selPlants, ref selEmployees, empList);

            var records = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            int maxDays = DashboardController.GetDaysInMonthString(selMonths.FirstOrDefault());
            var dayList = Enumerable.Range(1, maxDays).Select(d => d.ToString()).ToList();

            var dbMonths = await _context.OvertimeRequests
                .Where(r => !string.IsNullOrEmpty(r.Month))
                .OrderByDescending(r => r.WorkDate)
                .Select(r => r.Month)
                .Distinct()
                .ToListAsync();

            var standardMonths = new List<string>
            {
                "Oktober 2026", "September 2026", "Agustus 2026", "Juli 2026", "Juni 2026",
                "Mei 2026", "April 2026", "Maret 2026", "Februari 2026", "Januari 2026"
            };

            var monthList = new List<string>();
            foreach (var sm in standardMonths)
            {
                if (!monthList.Any(m => m.Equals(sm, StringComparison.OrdinalIgnoreCase)))
                    monthList.Add(sm);
            }
            foreach (var dm in dbMonths)
            {
                string norm = DashboardController.NormalizeToIndonesianMonth(dm);
                if (!string.IsNullOrEmpty(norm) && !monthList.Any(m => m.Equals(norm, StringComparison.OrdinalIgnoreCase)))
                    monthList.Add(norm);
            }

            var shiftList = await _context.Shifts.Where(s => s.IsActive).Select(s => s.ShiftName).ToListAsync();
            var plantList = _authService.GetAllowedPlants(user);

            var vm = new RiwayatPenginputViewModel
            {
                Records = records,
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

        [HttpGet]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? search,
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index", "Dashboard");
            }

            var query = _context.OvertimeRequests.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string kw = search.Trim().ToLowerInvariant();
                query = query.Where(r => (r.CreatedByName != null && r.CreatedByName.ToLower().Contains(kw)) ||
                                         (r.CreatedByNpk != null && r.CreatedByNpk.ToLower().Contains(kw)) ||
                                         r.UserName.ToLower().Contains(kw) ||
                                         r.UserNpk.ToLower().Contains(kw));
            }

            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m) && !m.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !m.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d) && !d.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !d.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s) && !s.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !s.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p) && !p.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !p.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e) && !e.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !e.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(e => e.Trim()).ToList() ?? new List<string>();

            var empQuery = _context.Users.Where(u => u.Role == "karyawan" && u.IsActive).OrderBy(u => u.Name).AsQueryable();
            var normPlants = DashboardController.NormalizePlantCriteria(selPlants);
            if (normPlants.PlantNames.Count > 0)
            {
                empQuery = empQuery.Where(u => normPlants.PlantNames.Contains(u.Plant) || normPlants.DeptNames.Contains(u.Department));
            }
            var empList = await empQuery.ToListAsync();

            query = DashboardController.FilterOvertimeQuery(query, ref selMonths, ref selDays, ref selShifts, ref selPlants, ref selEmployees, empList);

            var records = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            byte[] bytes = _excelService.ExportRiwayatPenginput(records);

            string filename = $"Riwayat_Penginput_QWORKS_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
        }
    }
}
