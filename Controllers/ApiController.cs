using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QWorks.Data;
using QWorks.Models.ViewModels;
using QWorks.Services;

namespace QWorks.Controllers
{
    [ApiController]
    [Route("api")]
    public class ApiController : ControllerBase
    {
        private readonly QWorksDbContext _context;
        private readonly IOvertimeCalculatorService _calcService;

        public ApiController(QWorksDbContext context, IOvertimeCalculatorService calcService)
        {
            _context = context;
            _calcService = calcService;
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                status = "Q-WORKS Overtime API Online",
                framework = "ASP.NET Core MVC (.NET 8)",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("shifts")]
        public async Task<IActionResult> GetShifts()
        {
            var shifts = await _context.Shifts.Where(s => s.IsActive).ToListAsync();
            return Ok(shifts);
        }

        [HttpGet("employees/by-plant")]
        public async Task<IActionResult> GetEmployeesByPlant([FromQuery] string plant)
        {
            var emps = await _context.Users
                .Where(u => u.Role == "karyawan" && u.IsActive && (string.IsNullOrEmpty(plant) || u.Plant == plant))
                .OrderBy(u => u.Name)
                .Select(u => new { u.Id, u.Nik, u.Name, u.Plant, u.Department })
                .ToListAsync();

            return Ok(emps);
        }

        [HttpPost("overtime/preview")]
        public IActionResult Preview([FromBody] PreviewOvertimeDto dto)
        {
            DateTime workDate;
            if (!DateTime.TryParse(dto.WorkDate, out workDate)) workDate = DateTime.Today;

            bool isHoliday = dto.IsHoliday || _calcService.IsWeekendOrHoliday(workDate);

            var res = _calcService.Calculate(
                dto.ShiftName,
                workDate,
                dto.StartTimeStr,
                dto.EndTimeStr,
                isHoliday
            );

            return Ok(new { success = true, data = res });
        }
    }
}
