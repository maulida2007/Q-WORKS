using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models;
using QWorks.Services;

namespace QWorks.Controllers
{
    [Authorize]
    public class SettingsController : Controller
    {
        private readonly QWorksDbContext _context;
        private readonly IAuthService _authService;
        private readonly IOvertimeCalculatorService _calcService;

        public SettingsController(
            QWorksDbContext context,
            IAuthService authService,
            IOvertimeCalculatorService calcService)
        {
            _context = context;
            _authService = authService;
            _calcService = calcService;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateTarget([FromForm] double targetJam, string? returnUrl)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Hanya Admin yang dapat mengubah target jam.";
                TempData["ToastType"] = "danger";
                return LocalRedirect(returnUrl ?? "/Dashboard");
            }

            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "TargetJamOT");
            if (setting == null)
            {
                setting = new SystemSetting { Key = "TargetJamOT", Value = targetJam.ToString(), UpdatedAt = DateTime.UtcNow };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = targetJam.ToString();
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            TempData["ToastMessage"] = $"Target Jam Overtime diperbarui menjadi {targetJam} Jam.";
            TempData["ToastType"] = "success";

            return LocalRedirect(returnUrl ?? "/Dashboard");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetFactory(string? returnUrl)
        {
            var user = _authService.GetCurrentUser();
            if (user == null || user.IsKaryawan)
            {
                TempData["ToastMessage"] = "Akses ditolak: Hanya Admin yang dapat mereset data pabrik.";
                TempData["ToastType"] = "danger";
                return LocalRedirect(returnUrl ?? "/Dashboard");
            }

            _context.OvertimeRequests.RemoveRange(_context.OvertimeRequests);
            _context.ApprovalLogs.RemoveRange(_context.ApprovalLogs);
            _context.Users.RemoveRange(_context.Users.Where(u => u.Role == "karyawan"));
            await _context.SaveChangesAsync();

            DbInitializer.Initialize(_context, _calcService);

            TempData["ToastMessage"] = "Semua metriks dan data lembur berhasil dikembalikan ke data awal pabrik.";
            TempData["ToastType"] = "info";

            return LocalRedirect(returnUrl ?? "/Dashboard");
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var list = await _context.NotificationItems
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync();

            return Json(list);
        }

        [HttpPost]
        public async Task<IActionResult> MarkNotificationRead(int id)
        {
            var notif = await _context.NotificationItems.FindAsync(id);
            if (notif != null)
            {
                notif.IsUnread = false;
                await _context.SaveChangesAsync();
            }
            return Json(new { success = true });
        }
    }
}
