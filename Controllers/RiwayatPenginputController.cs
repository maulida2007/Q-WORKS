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
            [FromQuery] string? plant,
            [FromQuery] string? submitter)
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

            if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL")
            {
                query = query.Where(r => r.CreatedByPlant == plant || r.Plant == plant);
            }

            if (!string.IsNullOrWhiteSpace(submitter) && submitter != "ALL")
            {
                query = query.Where(r => r.CreatedByName == submitter);
            }

            var records = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var submitters = await _context.OvertimeRequests
                .Where(r => r.CreatedByName != null)
                .Select(r => r.CreatedByName!)
                .Distinct()
                .ToListAsync();

            var plants = await _context.OvertimeRequests
                .Select(r => r.Plant)
                .Distinct()
                .ToListAsync();

            var vm = new RiwayatPenginputViewModel
            {
                Records = records,
                TotalRecords = records.Count,
                SearchKeyword = search,
                SelectedPlant = plant ?? "ALL",
                SelectedSubmitter = submitter ?? "ALL",
                SubmitterNames = submitters,
                PlantList = plants
            };

            return View(vm);
        }

        [HttpGet]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? search,
            [FromQuery] string? plant,
            [FromQuery] string? submitter)
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

            if (!string.IsNullOrWhiteSpace(plant) && plant != "ALL")
            {
                query = query.Where(r => r.CreatedByPlant == plant || r.Plant == plant);
            }

            if (!string.IsNullOrWhiteSpace(submitter) && submitter != "ALL")
            {
                query = query.Where(r => r.CreatedByName == submitter);
            }

            var records = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            byte[] bytes = _excelService.ExportRiwayatPenginput(records);

            string filename = $"Riwayat_Penginput_QWORKS_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
        }
    }
}
