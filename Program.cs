var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseRouting();

// Endpoint status API
app.MapGet("/api/status", () => new { status = "Q-WORKS Overtime API Online", timestamp = DateTime.UtcNow });

app.MapControllers();

app.Run();
