using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models;
using QWorks.Models.ViewModels;
using QWorks.Services;

namespace QWorks.Controllers
{
    [Authorize]
    public class MasterPekerjaController : Controller
    {
        private readonly QWorksDbContext _context;
        private readonly IAuthService _authService;
        private readonly IExcelService _excelService;
        private readonly IOvertimeCalculatorService _calcService;

        public MasterPekerjaController(
            QWorksDbContext context,
            IAuthService authService,
            IExcelService excelService,
            IOvertimeCalculatorService calcService)
        {
            _context = context;
            _authService = authService;
            _excelService = excelService;
            _calcService = calcService;
        }

        [HttpGet]
        public async Task<IActionResult> Index(
            [FromQuery] string? plant,
            [FromQuery] string? search,
            [FromQuery] int page = 1)
        {
            var user = _authService.GetCurrentUser();
            if (user == null) return RedirectToAction("Login", "Auth");

            var query = _context.Users.Where(u => u.Role == "karyawan").AsQueryable();
            var allowedPlants = _authService.GetAllowedPlants(user);

            // Scope worker to only see employees in their allowed plants (e.g. Gilang -> Plant Hose; Subcont/Mixing -> both)
            if (user.IsKaryawan)
            {
                if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL" && allowedPlants.Contains(plant))
                {
                    query = query.Where(u => u.Plant == plant);
                }
                else
                {
                    plant = allowedPlants.Count == 1 ? allowedPlants[0] : "ALL";
                    query = query.Where(u => allowedPlants.Contains(u.Plant));
                }
            }
            else if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL")
            {
                query = query.Where(u => u.Plant == plant);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string kw = search.Trim().ToLowerInvariant();
                query = query.Where(u => u.Name.ToLower().Contains(kw) || u.Nik.ToLower().Contains(kw));
            }

            var plantOrder = new Dictionary<string, int>
            {
                { "Plant Hose", 1 }, { "Plant Molded", 2 }, { "Plant Subcont", 3 },
                { "Plant Lab Mixing", 4 }, { "Plant RVI", 5 }, { "Plant QRE", 6 }
            };

            var allKaryawan = await _context.Users.Where(u => u.Role == "karyawan").ToListAsync();
            if (user.IsKaryawan)
            {
                allKaryawan = allKaryawan.Where(u => allowedPlants.Contains(u.Plant)).ToList();
            }

            var plantCounts = allKaryawan
                .GroupBy(u => u.Plant)
                .ToDictionary(g => g.Key, g => g.Count());

            int totalEmployees = await query.CountAsync();
            int pageSize = 10;
            int totalPages = (int)Math.Ceiling((double)totalEmployees / pageSize);
            if (totalPages < 1) totalPages = 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            var employees = (await query.ToListAsync())
                .OrderBy(u => plantOrder.ContainsKey(u.Plant) ? plantOrder[u.Plant] : 99)
                .ThenBy(u => u.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var vm = new MasterPekerjaViewModel
            {
                Employees = employees,
                PlantCounts = plantCounts,
                TotalEmployees = totalEmployees,
                SelectedPlant = plant ?? "ALL",
                SearchKeyword = search,
                AllowedPlants = allowedPlants,
                CurrentPage = page,
                TotalPages = totalPages,
                PageSize = pageSize
            };

            return View(vm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(
            [FromForm] string? nik,
            [FromForm] string? npk,
            [FromForm] string? name,
            [FromForm] string? nama,
            [FromForm] string? plant)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin menambah pekerja.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            string? rawNpk = !string.IsNullOrWhiteSpace(npk) ? npk : nik;
            string cleanNpk = (rawNpk ?? "").Trim().ToUpperInvariant();

            string? rawName = !string.IsNullOrWhiteSpace(name) ? name : nama;
            string cleanName = (rawName ?? "").Trim();
            string plantName = plant ?? "Plant Hose";
            string dept = plantName.ToLowerInvariant().Replace("plant ", "").Trim();
            if (dept.Contains("lab")) dept = "lab-mixing";

            if (string.IsNullOrWhiteSpace(cleanNpk) || string.IsNullOrWhiteSpace(cleanName))
            {
                TempData["ToastMessage"] = "NPK dan Nama Karyawan wajib diisi.";
                TempData["ToastType"] = "warning";
                return RedirectToAction("Index");
            }

            bool exists = await _context.Users.AnyAsync(u => u.Nik.ToUpper() == cleanNpk);
            if (exists)
            {
                TempData["ToastMessage"] = $"Karyawan dengan NPK {cleanNpk} sudah terdaftar!";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            _context.Users.Add(new User
            {
                Nik = cleanNpk,
                Name = cleanName,
                Plant = plantName,
                Department = dept,
                Role = "karyawan",
                RoleLabel = "Karyawan Quality",
                IsActive = true,
                IsUserAdded = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Pekerja {cleanName} ({cleanNpk}) berhasil ditambahkan ke {plantName}!";
            TempData["ToastType"] = "success";

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(
            [FromForm] int id,
            [FromForm] string? nik,
            [FromForm] string? npk,
            [FromForm] string? name,
            [FromForm] string? nama,
            [FromForm] string? plant)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin mengubah master pekerja.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            var emp = await _context.Users.FindAsync(id);
            if (emp == null)
            {
                string searchNpk = (!string.IsNullOrWhiteSpace(npk) ? npk : nik)?.Trim().ToUpperInvariant() ?? "";
                if (!string.IsNullOrWhiteSpace(searchNpk))
                {
                    emp = await _context.Users.FirstOrDefaultAsync(u => u.Nik.ToUpper() == searchNpk);
                }
            }

            if (emp == null)
            {
                TempData["ToastMessage"] = "Data pekerja tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            string oldNpk = emp.Nik;
            string? rawNpk = !string.IsNullOrWhiteSpace(npk) ? npk : nik;
            string cleanNpk = (rawNpk ?? "").Trim().ToUpperInvariant();

            string? rawName = !string.IsNullOrWhiteSpace(name) ? name : nama;
            string cleanName = (rawName ?? "").Trim();
            string plantName = plant ?? "Plant Hose";
            string dept = plantName.ToLowerInvariant().Replace("plant ", "").Trim();
            if (dept.Contains("lab")) dept = "lab-mixing";

            if (string.IsNullOrWhiteSpace(cleanNpk) || string.IsNullOrWhiteSpace(cleanName))
            {
                TempData["ToastMessage"] = "NPK dan Nama Karyawan wajib diisi.";
                TempData["ToastType"] = "warning";
                return RedirectToAction("Index");
            }

            if (cleanNpk != oldNpk.ToUpperInvariant())
            {
                bool exists = await _context.Users.AnyAsync(u => u.Nik.ToUpper() == cleanNpk && u.Id != emp.Id);
                if (exists)
                {
                    TempData["ToastMessage"] = $"NPK {cleanNpk} sudah digunakan karyawan lain!";
                    TempData["ToastType"] = "danger";
                    return RedirectToAction("Index");
                }
            }

            emp.Nik = cleanNpk;
            emp.Name = cleanName;
            emp.Plant = plantName;
            emp.Department = dept;
            emp.UpdatedAt = DateTime.UtcNow;

            // Also update overtime records
            var relatedOts = await _context.OvertimeRequests.Where(r => r.UserNpk == oldNpk).ToListAsync();
            foreach (var ot in relatedOts)
            {
                ot.UserNpk = cleanNpk;
                ot.UserName = cleanName;
                ot.Plant = plantName;
                ot.Department = dept;
            }

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Data pekerja {cleanName} ({cleanNpk}) berhasil diperbarui!";
            TempData["ToastType"] = "success";

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string? id, [FromForm] string? npk)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin menghapus master pekerja.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            string target = !string.IsNullOrWhiteSpace(id) ? id.Trim() : (npk ?? "").Trim();
            if (string.IsNullOrWhiteSpace(target))
            {
                TempData["ToastMessage"] = "Data pekerja tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            User? emp = null;

            // 1. Coba cari berdasarkan NPK (karena URL view mengirim /Delete/@emp.Npk)
            emp = await _context.Users.FirstOrDefaultAsync(u => u.Nik.ToUpper() == target.ToUpperInvariant());

            // 2. Jika tidak ditemukan berdasarkan NPK dan target berupa angka, cari berdasarkan database primary key (Id)
            if (emp == null && int.TryParse(target, out int numericId))
            {
                emp = await _context.Users.FindAsync(numericId);
            }

            if (emp == null)
            {
                TempData["ToastMessage"] = "Data pekerja tidak ditemukan.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            _context.Users.Remove(emp);
            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Pekerja {emp.Name} ({emp.Nik}) berhasil dihapus.";
            TempData["ToastType"] = "info";

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ImportExcel(IFormFile? file, IFormFile? excelFile, string mode = "merge")
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin mengimpor master pekerja.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            var uploaded = file ?? excelFile ?? (Request.Form.Files.Count > 0 ? Request.Form.Files[0] : null);

            if (uploaded == null || uploaded.Length == 0)
            {
                TempData["ToastMessage"] = "Pilih file Excel (.xlsx) terlebih dahulu.";
                TempData["ToastType"] = "warning";
                return RedirectToAction("Index");
            }

            MasterPekerjaImportResult report;
            using (var stream = uploaded.OpenReadStream())
            {
                report = _excelService.ParseMasterPekerjaExcelWithReport(stream);
            }

            if (report.ValidEmployees.Count == 0)
            {
                string errMsg = report.ErrorDetails.Count > 0 
                    ? string.Join(" | ", report.ErrorDetails.Take(5)) 
                    : "Tidak ada data karyawan yang valid dalam file Excel.";
                TempData["ToastMessage"] = $"Gagal Impor: {errMsg}";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (mode == "replace")
                {
                    var existingEmployees = await _context.Users.Where(u => u.Role == "karyawan").ToListAsync();
                    _context.Users.RemoveRange(existingEmployees);
                    _context.Users.AddRange(report.ValidEmployees);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    string msg = $"Sukses Ganti Master Pekerja: {report.SuccessCount} data berhasil disimpan.";
                    if (report.FailedCount > 0)
                    {
                        msg += $" Catatan ({report.FailedCount} baris gagal): " + string.Join(" | ", report.ErrorDetails.Take(3));
                    }
                    TempData["ToastMessage"] = msg;
                    TempData["ToastType"] = report.FailedCount > 0 ? "warning" : "success";
                    return RedirectToAction("Index");
                }

                int addedCount = 0;
                int updatedCount = 0;

                foreach (var item in report.ValidEmployees)
                {
                    var existing = await _context.Users.FirstOrDefaultAsync(u => u.Nik.ToUpper() == item.Nik.ToUpper());
                    if (existing != null)
                    {
                        existing.Name = item.Name;
                        existing.Plant = item.Plant;
                        existing.Department = item.Department;
                        existing.IsActive = true;
                        existing.UpdatedAt = DateTime.UtcNow;
                        updatedCount++;
                    }
                    else
                    {
                        _context.Users.Add(item);
                        addedCount++;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                string summary = $"Hasil Impor Master: {addedCount} Baru, {updatedCount} Diperbarui (Total {report.SuccessCount} Berhasil).";
                if (report.FailedCount > 0)
                {
                    summary += $" ({report.FailedCount} Baris Gagal: " + string.Join(" | ", report.ErrorDetails.Take(3)) + (report.ErrorDetails.Count > 3 ? $" +{report.ErrorDetails.Count - 3} lainnya" : "") + ")";
                }

                TempData["ToastMessage"] = summary;
                TempData["ToastType"] = report.FailedCount > 0 ? "warning" : "success";
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                TempData["ToastMessage"] = $"Terjadi kesalahan database saat impor: {ex.Message}";
                TempData["ToastType"] = "danger";
            }

            return RedirectToAction("Index");
        }

        [HttpGet]
        public async Task<IActionResult> ExportExcel([FromQuery] string? plant)
        {
            var user = _authService.GetCurrentUser();
            var query = _context.Users.Where(u => u.Role == "karyawan").AsQueryable();
            var allowedPlants = _authService.GetAllowedPlants(user);

            if (user != null && user.IsKaryawan)
            {
                if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL" && allowedPlants.Contains(plant))
                {
                    query = query.Where(u => u.Plant == plant);
                }
                else
                {
                    query = query.Where(u => allowedPlants.Contains(u.Plant));
                }
            }
            else if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL")
            {
                query = query.Where(u => u.Plant == plant);
            }

            var employees = await query.OrderBy(u => u.Plant).ThenBy(u => u.Name).ToListAsync();
            byte[] fileBytes = _excelService.ExportMasterPekerja(employees);

            string plantSuffix = user?.IsKaryawan == true
                ? (allowedPlants.Count == 1 ? user.Plant.Replace(" ", "_") + "_" : "Subcont_Mixing_")
                : (!string.IsNullOrWhiteSpace(plant) && plant != "ALL" ? plant.Replace(" ", "_") + "_" : "");

            string filename = $"Master_Pekerja_QWORKS_{plantSuffix}{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
        }

        [HttpGet]
        public IActionResult DownloadTemplate()
        {
            byte[] bytes = _excelService.GetMasterPekerjaTemplate();
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Template_Master_Pekerja_QWORKS.xlsx");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetDefault()
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Karyawan tidak memiliki izin mereset master pekerja.";
                TempData["ToastType"] = "danger";
                return RedirectToAction("Index");
            }

            var existing = await _context.Users.Where(u => u.Role == "karyawan").ToListAsync();
            _context.Users.RemoveRange(existing);
            await _context.SaveChangesAsync();

            DbInitializer.Initialize(_context, _calcService);

            TempData["ToastMessage"] = "Data master pekerja berhasil dikembalikan ke data awal pabrik.";
            TempData["ToastType"] = "info";

            return RedirectToAction("Index");
        }
    }
}
