using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models;
using QWorks.Models.ViewModels;

namespace QWorks.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, User? User)> LoginKaryawanAsync(string npk, string name);
        Task<(bool Success, string Message, User? User)> LoginAdminAsync(string username, string password);
        Task SignInUserAsync(User user);
        Task SignOutAsync();
        CurrentUserSession? GetCurrentUser();
        List<PlantInfo> GetAllowedDashboards(CurrentUserSession? user);
        List<string> GetAllowedPlants(CurrentUserSession? user);
        string GetDefaultDashboardView(CurrentUserSession? user);
        string GetDefaultDashboardView(User? user);
    }

    public class AuthService : IAuthService
    {
        private readonly QWorksDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(QWorksDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<(bool Success, string Message, User? User)> LoginKaryawanAsync(string npk, string name)
        {
            string cleanNpk = (npk ?? "").Trim().ToUpperInvariant();
            string cleanName = (name ?? "").Trim();

            if (string.IsNullOrWhiteSpace(cleanNpk) || string.IsNullOrWhiteSpace(cleanName))
            {
                return (false, "Nama dan NPK wajib diisi.", null);
            }

            var emp = await _context.Users.FirstOrDefaultAsync(u => u.Nik.ToUpper() == cleanNpk && u.Role == "karyawan");
            if (emp == null)
            {
                return (false, $"NPK {cleanNpk} tidak terdaftar dalam sistem.", null);
            }

            if (!emp.Name.Trim().Equals(cleanName, StringComparison.OrdinalIgnoreCase))
            {
                return (false, $"Nama tidak sesuai dengan NPK {cleanNpk}. Pastikan nama sesuai data terdaftar.", null);
            }

            return (true, $"Selamat datang, {emp.Name} ({emp.Nik})!", emp);
        }

        public async Task<(bool Success, string Message, User? User)> LoginAdminAsync(string username, string password)
        {
            string u = (username ?? "").Trim().ToLowerInvariant();
            string p = (password ?? "").Trim();

            if (string.IsNullOrWhiteSpace(u) || string.IsNullOrWhiteSpace(p))
            {
                return (false, "Username dan Password admin wajib diisi.", null);
            }

            bool isValid = (u == "admin" && (p == "admin" || p == "admin123" || p == "123456" || p == "123")) ||
                           (u == "qc_lead" && p == "qclead123");

            if (!isValid)
            {
                return (false, "Username atau Password Admin salah. Silakan periksa kembali.", null);
            }

            var adminUser = await _context.Users.FirstOrDefaultAsync(x => x.Role == "admin" && (x.Username == u || x.Nik == "ADMIN-01"));
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Nik = "ADMIN-01",
                    Name = "Admin",
                    Username = u,
                    Role = "admin",
                    RoleLabel = "Admin",
                    Department = "all",
                    Plant = "All Plants"
                };
            }

            return (true, "Login berhasil sebagai Admin (Akses Penuh).", adminUser);
        }

        public async Task SignInUserAsync(User user)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return;

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim("Npk", user.Nik),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("RoleLabel", user.Role == "admin" ? "Admin" : "Karyawan Quality"),
                new Claim("Plant", user.Plant),
                new Claim("Department", user.Department),
                new Claim("Badge", user.Role == "admin" ? "QUALITY-ADMIN-01" : $"NPK-{user.Nik}")
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        }

        public async Task SignOutAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return;

            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }

        public CurrentUserSession? GetCurrentUser()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var user = httpContext?.User;
            if (user == null || !user.Identity?.IsAuthenticated == true)
            {
                return null;
            }

            int id = 0;
            int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out id);

            return new CurrentUserSession
            {
                Id = id,
                Name = user.Identity?.Name ?? "",
                Npk = user.FindFirstValue("Npk") ?? "",
                Role = user.FindFirstValue(ClaimTypes.Role) ?? "karyawan",
                RoleLabel = user.FindFirstValue("RoleLabel") ?? "Karyawan Quality",
                Plant = user.FindFirstValue("Plant") ?? "Plant Hose",
                Dept = user.FindFirstValue("Department") ?? "hose",
                Badge = user.FindFirstValue("Badge") ?? ""
            };
        }

        public List<PlantInfo> GetAllowedDashboards(CurrentUserSession? user)
        {
            if (user == null || user.IsAdmin)
            {
                return new List<PlantInfo>
                {
                    new PlantInfo { Id = "all-plants", Name = "Dashboard ALL PLANT", Dept = "All" },
                    new PlantInfo { Id = "hose", Name = "Dashboard HOSE", Dept = "Plant Hose" },
                    new PlantInfo { Id = "molded", Name = "Dashboard MOLDED", Dept = "Plant Molded" },
                    new PlantInfo { Id = "subcont", Name = "Dashboard SUBCONT", Dept = "Plant Subcont" },
                    new PlantInfo { Id = "lab-mixing", Name = "Dashboard LAB MIXING", Dept = "Plant Lab Mixing" },
                    new PlantInfo { Id = "rvi", Name = "Dashboard RVI", Dept = "Plant RVI" },
                    new PlantInfo { Id = "qre", Name = "Dashboard QRE", Dept = "Plant QRE" }
                };
            }

            string p = (user.Plant ?? user.Dept ?? "").ToLowerInvariant();

            if (p.Contains("hose"))
                return new List<PlantInfo> { new PlantInfo { Id = "hose", Name = "Dashboard HOSE", Dept = "Plant Hose" } };
            if (p.Contains("molded"))
                return new List<PlantInfo> { new PlantInfo { Id = "molded", Name = "Dashboard MOLDED", Dept = "Plant Molded" } };
            if (p.Contains("rvi"))
                return new List<PlantInfo> { new PlantInfo { Id = "rvi", Name = "Dashboard RVI", Dept = "Plant RVI" } };
            if (p.Contains("qre"))
                return new List<PlantInfo> { new PlantInfo { Id = "qre", Name = "Dashboard QRE", Dept = "Plant QRE" } };
            if (p.Contains("subcont") || p.Contains("mixing") || p.Contains("lab"))
                return new List<PlantInfo>
                {
                    new PlantInfo { Id = "subcont", Name = "Dashboard SUBCONT", Dept = "Plant Subcont" },
                    new PlantInfo { Id = "lab-mixing", Name = "Dashboard LAB MIXING", Dept = "Plant Lab Mixing" }
                };

            return new List<PlantInfo> { new PlantInfo { Id = "hose", Name = "Dashboard HOSE", Dept = "Plant Hose" } };
        }

        public List<string> GetAllowedPlants(CurrentUserSession? user)
        {
            if (user == null || user.IsAdmin)
            {
                return new List<string> { "Plant Hose", "Plant Molded", "Plant Subcont", "Plant Lab Mixing", "Plant RVI", "Plant QRE" };
            }

            string p = (user.Plant ?? user.Dept ?? "").ToLowerInvariant();
            if (p.Contains("hose")) return new List<string> { "Plant Hose" };
            if (p.Contains("molded")) return new List<string> { "Plant Molded" };
            if (p.Contains("rvi")) return new List<string> { "Plant RVI" };
            if (p.Contains("qre")) return new List<string> { "Plant QRE" };
            if (p.Contains("subcont") || p.Contains("mixing") || p.Contains("lab"))
                return new List<string> { "Plant Subcont", "Plant Lab Mixing" };

            return new List<string> { user.Plant ?? "Plant Hose" };
        }

        public string GetDefaultDashboardView(CurrentUserSession? user)
        {
            if (user == null || user.IsAdmin) return "all-plants";

            string p = (user.Plant ?? user.Dept ?? "").ToLowerInvariant();
            if (p.Contains("hose")) return "hose";
            if (p.Contains("molded")) return "molded";
            if (p.Contains("rvi")) return "rvi";
            if (p.Contains("qre")) return "qre";
            if (p.Contains("subcont")) return "subcont";
            if (p.Contains("mixing") || p.Contains("lab")) return "lab-mixing";

            return "hose";
        }

        public string GetDefaultDashboardView(User? user)
        {
            if (user == null || user.Role == "admin") return "all-plants";

            string p = (user.Plant ?? user.Department ?? "").ToLowerInvariant();
            if (p.Contains("hose")) return "hose";
            if (p.Contains("molded")) return "molded";
            if (p.Contains("rvi")) return "rvi";
            if (p.Contains("qre")) return "qre";
            if (p.Contains("subcont")) return "subcont";
            if (p.Contains("mixing") || p.Contains("lab")) return "lab-mixing";

            return "hose";
        }
    }
}
