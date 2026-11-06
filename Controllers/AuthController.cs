using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models.ViewModels;
using QWorks.Services;

namespace QWorks.Controllers
{
    public class AuthController : Controller
    {
        private readonly IAuthService _authService;
        private readonly QWorksDbContext _context;

        public AuthController(IAuthService authService, QWorksDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            var user = _authService.GetCurrentUser();
            if (user != null)
            {
                string target = _authService.GetDefaultDashboardView(user);
                return Redirect(target == "all-plants" ? "/Dashboard" : $"/Dashboard/Plant/{target}");
            }

            ViewBag.ReturnUrl = returnUrl;
            return View(new LoginViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LoginKaryawan(LoginViewModel model, string? returnUrl = null)
        {
            model.ActiveTab = "karyawan";

            var result = await _authService.LoginKaryawanAsync(model.KaryawanNpk ?? "", model.KaryawanNama ?? "");
            if (!result.Success || result.User == null)
            {
                model.ErrorMessage = result.Message;
                return View("Login", model);
            }

            await _authService.SignInUserAsync(result.User);

            TempData["ToastMessage"] = result.Message;
            TempData["ToastType"] = "success";

            string target = _authService.GetDefaultDashboardView(result.User);

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return Redirect(target == "all-plants" ? "/Dashboard" : $"/Dashboard/Plant/{target}");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LoginAdmin(LoginViewModel model, string? returnUrl = null)
        {
            model.ActiveTab = "admin";

            var result = await _authService.LoginAdminAsync(model.AdminUsername ?? "", model.AdminPassword ?? "");
            if (!result.Success || result.User == null)
            {
                model.ErrorMessage = result.Message;
                return View("Login", model);
            }

            await _authService.SignInUserAsync(result.User);

            TempData["ToastMessage"] = result.Message;
            TempData["ToastType"] = "success";

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Dashboard");
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            await _authService.SignOutAsync();
            TempData["ToastMessage"] = "Anda telah berhasil keluar (Logout).";
            TempData["ToastType"] = "info";
            return RedirectToAction("Login");
        }

        [HttpGet]
        public async Task<IActionResult> LookupNpk(string npk)
        {
            string clean = (npk ?? "").Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(clean)) return Json(new { success = false, message = "NPK wajib diisi." });

            // Hanya cocokkan jika NPK cocok sepenuhnya (Exact match), bukan pencocokan sebagian (StartsWith)
            var emp = await _context.Users
                .Where(u => u.Role == "karyawan" && u.Nik.ToUpper() == clean)
                .Select(u => new { npk = u.Nik, name = u.Name, plant = u.Plant })
                .FirstOrDefaultAsync();

            if (emp != null)
            {
                return Json(new { success = true, name = emp.name, plant = emp.plant });
            }

            return Json(new { success = false, message = $"NPK {clean} tidak ditemukan dalam data Master Pekerja." });
        }
    }
}
