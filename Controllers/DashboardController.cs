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
    public class DashboardController : Controller
    {
        private readonly QWorksDbContext _context;
        private readonly IAuthService _authService;
        private readonly IOvertimeCalculatorService _calcService;

        public DashboardController(
            QWorksDbContext context,
            IAuthService authService,
            IOvertimeCalculatorService calcService)
        {
            _context = context;
            _authService = authService;
            _calcService = calcService;
        }

        [HttpGet]
        public async Task<IActionResult> Index(
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            // Check role access
            if (user.IsKaryawan)
            {
                var allowed = _authService.GetAllowedDashboards(user).Select(d => d.Id).ToList();
                if (!allowed.Contains("all-plants"))
                {
                    string def = _authService.GetDefaultDashboardView(user);
                    return RedirectToAction("Plant", new { id = def });
                }
            }

            var vm = await BuildDashboardViewModel("all-plants", "Dashboard Over Time", "All", months, days, shifts, plants, employees);
            return View(vm);
        }

        [HttpGet]
        [Route("Dashboard/Plant/{id}")]
        public async Task<IActionResult> Plant(
            string id,
            [FromQuery] string[]? months,
            [FromQuery] string[]? days,
            [FromQuery] string[]? shifts,
            [FromQuery] string[]? plants,
            [FromQuery] string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            string plantId = (id ?? "hose").ToLowerInvariant();
            if (plantId == "lab-mixing" || plantId == "lab_mixing") plantId = "mixing";

            string plantName = plantId switch
            {
                "hose" => "Plant Hose",
                "molded" => "Plant Molded",
                "subcont" => "Plant Subcont",
                "mixing" => "Plant Lab Mixing",
                "rvi" => "Plant RVI",
                "qre" => "Plant QRE",
                _ => "Plant Hose"
            };

            // Check if user allowed
            if (user.IsKaryawan)
            {
                var allowed = _authService.GetAllowedDashboards(user).Select(d => d.Id).ToList();
                string checkId = plantId == "mixing" ? "lab-mixing" : plantId;
                if (!allowed.Contains(checkId) && !allowed.Contains(plantId))
                {
                    string def = _authService.GetDefaultDashboardView(user);
                    return RedirectToAction("Plant", new { id = def });
                }
            }

            string title = $"Dashboard Over Time - {plantName}";
            var vm = await BuildDashboardViewModel(plantId, title, plantName, months, days, shifts, plants, employees);
            return View("Plant", vm);
        }

        private async Task<DashboardViewModel> BuildDashboardViewModel(
            string viewMode,
            string title,
            string plantFilter,
            string[]? months,
            string[]? days,
            string[]? shifts,
            string[]? plants,
            string[]? employees)
        {
            var user = _authService.GetCurrentUser();
            var query = _context.OvertimeRequests.AsQueryable();

            // Filter by department if in plant view
            if (viewMode == "hose") query = query.Where(r => r.Department == "hose");
            else if (viewMode == "molded") query = query.Where(r => r.Department == "molded");
            else if (viewMode == "subcont") query = query.Where(r => r.Department == "subcont");
            else if (viewMode == "mixing" || viewMode == "lab-mixing") query = query.Where(r => r.Department == "mixing" || r.Department == "lab-mixing");
            else if (viewMode == "rvi") query = query.Where(r => r.Department == "rvi");
            else if (viewMode == "qre") query = query.Where(r => r.Department == "qre");

            // Filter criteria (safely filter out empty strings and whitespace)
            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => e.Trim()).ToList() ?? new List<string>();

            int maxDays = GetDaysInMonthString(selMonths.FirstOrDefault());
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

            // Target setting
            var targetSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "TargetJamOT");
            double targetJam = 50;
            if (targetSetting != null && double.TryParse(targetSetting.Value, out double parsedTarget))
            {
                targetJam = parsedTarget;
            }

            // Summary Metrics
            double totalJam = records.Sum(r => r.JamOvertime);
            double totalTul = records.Sum(r => r.TotalTul);
            int uniqueEmps = records.Select(r => r.UserNpk).Distinct().Count();
            int totalReqs = records.Count;

            // Plant Summaries
            var plantOrder = new Dictionary<string, int>
            {
                { "Plant Hose", 1 }, { "Plant Molded", 2 }, { "Plant Subcont", 3 },
                { "Plant Lab Mixing", 4 }, { "Plant RVI", 5 }, { "Plant QRE", 6 }
            };

            var plantSummaries = records
                .GroupBy(r => r.Plant)
                .Select(g => new PlantSummaryItem
                {
                    PlantName = g.Key,
                    Dept = g.First().Department,
                    TotalJam = Math.Round(g.Sum(r => r.JamOvertime), 2),
                    TotalTul = Math.Round(g.Sum(r => r.TotalTul), 2),
                    EmployeeCount = g.Select(r => r.UserNpk).Distinct().Count(),
                    RequestCount = g.Count()
                })
                .OrderBy(p => plantOrder.ContainsKey(p.PlantName) ? plantOrder[p.PlantName] : 99)
                .ToList();

            // Shift Summaries
            var shiftSummaries = records
                .GroupBy(r => r.ShiftName)
                .Select(g => new ShiftSummaryItem
                {
                    ShiftName = g.Key,
                    TotalJam = Math.Round(g.Sum(r => r.JamOvertime), 2),
                    Percentage = totalJam > 0 ? Math.Round((g.Sum(r => r.JamOvertime) / totalJam) * 100.0, 1) : 0
                })
                .OrderBy(s => s.ShiftName)
                .ToList();

            // Daily Summaries
            var dailySummaries = records
                .GroupBy(r => r.WorkDate.Date)
                .Select(g => new DailySummaryItem
                {
                    Day = g.Key.Day.ToString(),
                    DateLabel = g.Key.ToString("dd MMM"),
                    TotalJam = Math.Round(g.Sum(r => r.JamOvertime), 2),
                    TotalTul = Math.Round(g.Sum(r => r.TotalTul), 2),
                    IsHoliday = g.Any(r => r.IsHoliday)
                })
                .OrderBy(d => int.Parse(d.Day))
                .ToList();

            // Top 10 Employees
            var topEmployees = records
                .GroupBy(r => new { r.UserNpk, r.UserName, r.Plant })
                .Select(g => new TopEmployeeItem
                {
                    Npk = g.Key.UserNpk,
                    Name = g.Key.UserName,
                    Plant = g.Key.Plant,
                    TotalJam = Math.Round(g.Sum(r => r.JamOvertime), 2),
                    TotalTul = Math.Round(g.Sum(r => r.TotalTul), 2),
                    Frequency = g.Count()
                })
                .OrderByDescending(e => e.TotalJam)
                .Take(10)
                .ToList();

            // Master data for filters
            var allEmployees = await _context.Users.Where(u => u.Role == "karyawan").OrderBy(u => u.Name).ToListAsync();
            if (viewMode != "all-plants")
            {
                string vmLower = viewMode.ToLowerInvariant();
                allEmployees = allEmployees
                    .Where(u => (u.Department != null && u.Department.ToLowerInvariant() == vmLower) ||
                                (u.Plant != null && u.Plant.ToLowerInvariant().Contains(vmLower)) ||
                                (vmLower == "mixing" && u.Department != null && (u.Department.Contains("lab") || u.Department.Contains("mixing"))))
                    .ToList();
            }

            var allShifts = await _context.Shifts.Select(s => s.ShiftName).ToListAsync();
            var monthList = await _context.OvertimeRequests
                .Where(r => !string.IsNullOrEmpty(r.Month))
                .OrderByDescending(r => r.WorkDate)
                .Select(r => r.Month)
                .Distinct()
                .ToListAsync();
            if (monthList.Count == 0) monthList = new List<string> { "September 2026" };

            var allowedPlants = _authService.GetAllowedDashboards(user);

            // Dynamic Active Date label
            string activeDate;
            if (selDays.Count > 0 && selMonths.Count > 0)
            {
                activeDate = $"{selDays[0]} {selMonths[0]}";
            }
            else if (selDays.Count > 0)
            {
                activeDate = $"Tanggal {selDays[0]}";
            }
            else if (selMonths.Count > 0)
            {
                activeDate = selMonths[0];
            }
            else if (records.Count > 0)
            {
                activeDate = records.First().WorkDate.ToString("dd MMM yyyy");
            }
            else
            {
                activeDate = DateTime.Today.ToString("dd MMM yyyy");
            }

            return new DashboardViewModel
            {
                ViewMode = viewMode,
                PageTitle = title,
                CurrentPlant = plantFilter,
                ActiveDate = activeDate,
                TotalJamOvertime = Math.Round(totalJam, 2),
                TotalTUL = Math.Round(totalTul, 2),
                UniqueEmployees = uniqueEmps,
                TotalRecords = totalReqs,
                TargetJamOT = targetJam,
                SelectedMonths = selMonths,
                SelectedDays = selDays,
                SelectedShifts = selShifts,
                SelectedPlants = selPlants,
                SelectedEmployees = selEmployees,
                FilteredRecords = records,
                PlantSummaries = plantSummaries,
                ShiftSummaries = shiftSummaries,
                DailySummaries = dailySummaries,
                TopEmployees = topEmployees,
                AllowedPlants = allowedPlants,
                AllEmployees = allEmployees,
                AllShifts = allShifts,
                MonthList = monthList,
                DayList = dayList
            };
        }

        public static int GetDaysInMonthString(string? monthString)
        {
            if (string.IsNullOrWhiteSpace(monthString)) return 31;

            var parts = monthString.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2 && int.TryParse(parts[1], out int year))
            {
                int monthNum = parts[0].ToLowerInvariant() switch
                {
                    "januari" => 1,
                    "februari" => 2,
                    "maret" => 3,
                    "april" => 4,
                    "mei" => 5,
                    "juni" => 6,
                    "juli" => 7,
                    "agustus" => 8,
                    "september" => 9,
                    "oktober" => 10,
                    "november" => 11,
                    "desember" => 12,
                    _ => 0
                };

                if (monthNum >= 1 && monthNum <= 12 && year >= 2000 && year <= 2100)
                {
                    return DateTime.DaysInMonth(year, monthNum);
                }
            }

            return 31;
        }
    }
}
