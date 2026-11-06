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

        public static (List<string> PlantNames, List<string> DeptNames) NormalizePlantCriteria(IEnumerable<string>? rawPlants)
        {
            var plantNames = new List<string>();
            var deptNames = new List<string>();
            if (rawPlants == null) return (plantNames, deptNames);

            foreach (var p in rawPlants)
            {
                if (string.IsNullOrWhiteSpace(p) || 
                    p.Equals("ALL", StringComparison.OrdinalIgnoreCase) || 
                    p.Equals("Semua", StringComparison.OrdinalIgnoreCase) ||
                    p.Equals("all-plants", StringComparison.OrdinalIgnoreCase)) continue;

                string clean = p.Trim();
                string lower = clean.ToLowerInvariant();

                if (lower.Contains("hose"))
                {
                    plantNames.Add("Plant Hose");
                    deptNames.Add("hose");
                }
                else if (lower.Contains("molded"))
                {
                    plantNames.Add("Plant Molded");
                    deptNames.Add("molded");
                }
                else if (lower.Contains("subcont"))
                {
                    plantNames.Add("Plant Subcont");
                    deptNames.Add("subcont");
                }
                else if (lower.Contains("mixing") || lower.Contains("lab"))
                {
                    plantNames.Add("Plant Lab Mixing");
                    deptNames.Add("lab-mixing");
                    deptNames.Add("mixing");
                }
                else if (lower.Contains("rvi"))
                {
                    plantNames.Add("Plant RVI");
                    deptNames.Add("rvi");
                }
                else if (lower.Contains("qre"))
                {
                    plantNames.Add("Plant QRE");
                    deptNames.Add("qre");
                }
                else
                {
                    plantNames.Add(clean);
                    deptNames.Add(clean);
                }
            }

            return (plantNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList(), 
                    deptNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList());
        }

        public static (int MonthNum, int Year)? ParseMonthString(string? monthString)
        {
            if (string.IsNullOrWhiteSpace(monthString)) return null;
            var parts = monthString.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2 && int.TryParse(parts[1], out int year))
            {
                int monthNum = parts[0].ToLowerInvariant() switch
                {
                    "januari" or "january" or "jan" => 1,
                    "februari" or "february" or "feb" => 2,
                    "maret" or "march" or "mar" => 3,
                    "april" or "apr" => 4,
                    "mei" or "may" => 5,
                    "juni" or "june" or "jun" => 6,
                    "juli" or "july" or "jul" => 7,
                    "agustus" or "august" or "agu" or "aug" => 8,
                    "september" or "sep" or "sept" => 9,
                    "oktober" or "october" or "okt" or "oct" => 10,
                    "november" or "nov" => 11,
                    "desember" or "december" or "des" or "dec" => 12,
                    _ => 0
                };

                if (monthNum >= 1 && monthNum <= 12 && year >= 2000 && year <= 2100)
                {
                    return (monthNum, year);
                }
            }
            return null;
        }

        public static string NormalizeToIndonesianMonth(string? monthString)
        {
            if (string.IsNullOrWhiteSpace(monthString)) return "";
            var parsed = ParseMonthString(monthString);
            if (parsed.HasValue)
            {
                string[] indoMonths = { "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" };
                return $"{indoMonths[parsed.Value.MonthNum - 1]} {parsed.Value.Year}";
            }
            return monthString.Trim();
        }

        public static int GetDaysInMonthString(string? monthString)
        {
            var parsed = ParseMonthString(monthString);
            if (parsed.HasValue)
            {
                return DateTime.DaysInMonth(parsed.Value.Year, parsed.Value.MonthNum);
            }
            return 31;
        }

        public static IQueryable<OvertimeRequest> FilterOvertimeQuery(
            IQueryable<OvertimeRequest> query,
            ref List<string> selMonths,
            ref List<string> selDays,
            ref List<string> selShifts,
            ref List<string> selPlants,
            ref List<string> selEmployees,
            List<User> availableEmployeesForPlant)
        {
            var currentMonths = selMonths;
            var currentDays = selDays;
            var currentShifts = selShifts;
            var currentPlants = selPlants;
            var currentEmployees = selEmployees;

            // 1. Month Filter (supports English & Indonesian month names and multiple selections)
            int maxDays = 31;
            if (currentMonths.Count > 0)
            {
                var expandedMonths = new List<string>();
                string[] indoMonths = { "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" };
                string[] engMonths = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" };

                foreach (var m in currentMonths)
                {
                    expandedMonths.Add(m);
                    var parsed = ParseMonthString(m);
                    if (parsed.HasValue)
                    {
                        int dm = DateTime.DaysInMonth(parsed.Value.Year, parsed.Value.MonthNum);
                        if (dm > maxDays) maxDays = dm;
                        expandedMonths.Add($"{indoMonths[parsed.Value.MonthNum - 1]} {parsed.Value.Year}");
                        expandedMonths.Add($"{engMonths[parsed.Value.MonthNum - 1]} {parsed.Value.Year}");
                    }
                }
                expandedMonths = expandedMonths.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                query = query.Where(r => expandedMonths.Contains(r.Month));
            }

            // 2. Day Filter (validate against maxDays)
            if (currentDays.Count > 0)
            {
                var dayInts = currentDays
                    .Select(d => int.TryParse(d.Replace("Tanggal ", "").Trim(), out int val) ? val : 0)
                    .Where(v => v >= 1 && v <= maxDays)
                    .ToList();

                // If day was invalid for this month, update selDays to reflect sanitized state
                selDays = dayInts.Select(d => d.ToString()).ToList();

                if (dayInts.Count > 0)
                {
                    query = query.Where(r => dayInts.Contains(r.Day) || dayInts.Contains(r.WorkDate.Day));
                }
            }

            // 3. Shift Filter (match ShiftName or ShiftId safely)
            if (currentShifts.Count > 0)
            {
                var shiftNames = new List<string>();
                var shiftIds = new List<int>();
                foreach (var s in currentShifts)
                {
                    if (string.IsNullOrWhiteSpace(s)) continue;
                    string st = s.Trim();
                    shiftNames.Add(st);
                    if (int.TryParse(st, out int sid))
                    {
                        shiftIds.Add(sid);
                        shiftNames.Add($"Shift {sid}");
                    }
                    else if (st.StartsWith("Shift ", StringComparison.OrdinalIgnoreCase) &&
                             int.TryParse(st.Substring(6).Trim(), out int sid2))
                    {
                        shiftIds.Add(sid2);
                        shiftNames.Add(st);
                    }
                }
                shiftNames = shiftNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                shiftIds = shiftIds.Distinct().ToList();

                query = query.Where(r => shiftNames.Contains(r.ShiftName) || (shiftIds.Count > 0 && shiftIds.Contains(r.ShiftId)));
            }

            // 4. Plant Filter (match by Plant name or Department)
            var normPlants = NormalizePlantCriteria(currentPlants);
            if (normPlants.PlantNames.Count > 0)
            {
                var pNames = normPlants.PlantNames;
                var dNames = normPlants.DeptNames;
                query = query.Where(r => pNames.Contains(r.Plant) || dNames.Contains(r.Department));
            }

            // Invalidate selected employee if they do not belong to the selected plant
            if (currentEmployees.Count > 0 && normPlants.PlantNames.Count > 0 && availableEmployeesForPlant.Count > 0)
            {
                var validEmpNpks = availableEmployeesForPlant.Select(e => e.Npk).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var validEmpIds = availableEmployeesForPlant.Select(e => e.Id.ToString()).ToHashSet();
                currentEmployees = currentEmployees.Where(e => validEmpNpks.Contains(e) || validEmpIds.Contains(e)).ToList();
                selEmployees = currentEmployees;
            }

            // 5. Employee Filter (match by NPK or User ID safely)
            if (currentEmployees.Count > 0)
            {
                var empNpks = currentEmployees.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var empIds = currentEmployees.Select(e => int.TryParse(e, out int id) ? id : 0).Where(id => id > 0).Distinct().ToList();

                query = query.Where(r => empNpks.Contains(r.UserNpk) || (empIds.Count > 0 && empIds.Contains(r.UserId)));
            }

            return query;
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

            // Restricted karyawan only sees allowed plants
            if (user != null && user.IsKaryawan)
            {
                var userAllowedPlants = _authService.GetAllowedPlants(user);
                query = query.Where(r => userAllowedPlants.Contains(r.Plant));
            }

            // Filter by department if in plant view
            if (viewMode == "hose") query = query.Where(r => r.Department == "hose" || r.Plant == "Plant Hose");
            else if (viewMode == "molded") query = query.Where(r => r.Department == "molded" || r.Plant == "Plant Molded");
            else if (viewMode == "subcont") query = query.Where(r => r.Department == "subcont" || r.Plant == "Plant Subcont");
            else if (viewMode == "mixing" || viewMode == "lab-mixing") query = query.Where(r => r.Department == "mixing" || r.Department == "lab-mixing" || r.Plant == "Plant Lab Mixing");
            else if (viewMode == "rvi") query = query.Where(r => r.Department == "rvi" || r.Plant == "Plant RVI");
            else if (viewMode == "qre") query = query.Where(r => r.Department == "qre" || r.Plant == "Plant QRE");

            // Filter criteria (safely filter out empty strings and placeholder terms)
            var selMonths = months?.Where(m => !string.IsNullOrWhiteSpace(m) && !m.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !m.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(m => m.Trim()).ToList() ?? new List<string>();
            var selDays = days?.Where(d => !string.IsNullOrWhiteSpace(d) && !d.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !d.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(d => d.Trim()).ToList() ?? new List<string>();
            var selShifts = shifts?.Where(s => !string.IsNullOrWhiteSpace(s) && !s.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !s.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(s => s.Trim()).ToList() ?? new List<string>();
            var selPlants = plants?.Where(p => !string.IsNullOrWhiteSpace(p) && !p.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !p.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(p => p.Trim()).ToList() ?? new List<string>();
            var selEmployees = employees?.Where(e => !string.IsNullOrWhiteSpace(e) && !e.Equals("Semua", StringComparison.OrdinalIgnoreCase) && !e.Equals("ALL", StringComparison.OrdinalIgnoreCase)).Select(e => e.Trim()).ToList() ?? new List<string>();

            // Master data employee query scoped by plant viewmode or plant filter
            var allEmployeesQuery = _context.Users.Where(u => u.Role == "karyawan" && u.IsActive).OrderBy(u => u.Name).AsQueryable();
            if (user != null && user.IsKaryawan)
            {
                var userAllowedPlants = _authService.GetAllowedPlants(user);
                allEmployeesQuery = allEmployeesQuery.Where(u => userAllowedPlants.Contains(u.Plant));
            }

            var normPlants = NormalizePlantCriteria(selPlants);
            if (viewMode != "all-plants")
            {
                var (targetPlants, targetDepts) = NormalizePlantCriteria(new[] { viewMode });
                allEmployeesQuery = allEmployeesQuery.Where(u => targetPlants.Contains(u.Plant) || targetDepts.Contains(u.Department));
            }
            else if (normPlants.PlantNames.Count > 0)
            {
                allEmployeesQuery = allEmployeesQuery.Where(u => normPlants.PlantNames.Contains(u.Plant) || normPlants.DeptNames.Contains(u.Department));
            }

            var allEmployees = await allEmployeesQuery.ToListAsync();

            // Apply unified filters with AND logic and dependency handling
            query = FilterOvertimeQuery(query, ref selMonths, ref selDays, ref selShifts, ref selPlants, ref selEmployees, allEmployees);

            var records = await query.OrderByDescending(r => r.WorkDate).ThenByDescending(r => r.CreatedAt).ToListAsync();

            int maxDays = GetDaysInMonthString(selMonths.FirstOrDefault());
            var dayList = Enumerable.Range(1, maxDays).Select(d => d.ToString()).ToList();

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

            var allShifts = await _context.Shifts.Where(s => s.IsActive).Select(s => s.ShiftName).ToListAsync();
            var dbMonths = await _context.OvertimeRequests
                .Where(r => !string.IsNullOrEmpty(r.Month))
                .OrderByDescending(r => r.WorkDate)
                .Select(r => r.Month)
                .Distinct()
                .ToListAsync();

            var standardMonths = new List<string>
            {
                "Oktober 2026",
                "September 2026",
                "Agustus 2026",
                "Juli 2026",
                "Juni 2026",
                "Mei 2026",
                "April 2026",
                "Maret 2026",
                "Februari 2026",
                "Januari 2026"
            };

            var monthList = new List<string>();
            foreach (var sm in standardMonths)
            {
                if (!monthList.Any(m => m.Equals(sm, StringComparison.OrdinalIgnoreCase)))
                {
                    monthList.Add(sm);
                }
            }
            foreach (var dm in dbMonths)
            {
                string normalizedDm = NormalizeToIndonesianMonth(dm);
                if (!string.IsNullOrEmpty(normalizedDm) && !monthList.Any(m => m.Equals(normalizedDm, StringComparison.OrdinalIgnoreCase)))
                {
                    monthList.Add(normalizedDm);
                }
            }

            var allowedPlants = _authService.GetAllowedDashboards(user);

            // Dynamic Active Date label
            string activeDate;
            if (selDays.Count > 0 && selMonths.Count > 0)
            {
                activeDate = $"{selDays[0]} {NormalizeToIndonesianMonth(selMonths[0])}";
            }
            else if (selDays.Count > 0)
            {
                activeDate = $"Tanggal {selDays[0]}";
            }
            else if (selMonths.Count > 0)
            {
                activeDate = NormalizeToIndonesianMonth(selMonths[0]);
            }
            else if (records.Count > 0)
            {
                activeDate = NormalizeToIndonesianMonth(records.First().Month);
            }
            else
            {
                activeDate = "Oktober 2026";
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
    }
}
