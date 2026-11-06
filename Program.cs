using System;
using System.IO;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QWorks.Data;
using QWorks.Services;

var builder = WebApplication.CreateBuilder(args);

// Set default culture to Indonesian (id-ID)
var defaultCulture = new System.Globalization.CultureInfo("id-ID");
System.Globalization.CultureInfo.DefaultThreadCurrentCulture = defaultCulture;
System.Globalization.CultureInfo.DefaultThreadCurrentUICulture = defaultCulture;

// Configure DataProtection to persist keys within application directory
string keysFolder = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "keys");
if (!Directory.Exists(keysFolder)) Directory.CreateDirectory(keysFolder);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysFolder))
    .SetApplicationName("QWorksApp");

// Add MVC services
builder.Services.AddControllersWithViews();
builder.Services.AddHttpContextAccessor();

// Configure SQL Server Database
string finalConnString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionString 'DefaultConnection' tidak ditemukan di appsettings.json.");

builder.Services.AddDbContext<QWorksDbContext>(options =>
    options.UseSqlServer(finalConnString));

// Dependency Injection
builder.Services.AddScoped<IOvertimeCalculatorService, OvertimeCalculatorService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IExcelService, ExcelService>();

// Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Auth/Login";
        options.ExpireTimeSpan = TimeSpan.FromHours(12);
        options.SlidingExpiration = true;
        options.Cookie.Name = "QWorks.AuthCookie";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
        options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest;
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<QWorksDbContext>();
        var calc = services.GetRequiredService<IOvertimeCalculatorService>();
        DbInitializer.Initialize(db, calc);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error occurred during DB initialization");
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Dashboard/Index");
    app.UseHsts();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                       Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.MapControllers();

app.Run();
