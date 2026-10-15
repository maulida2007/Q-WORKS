using Microsoft.AspNetCore.Mvc;
using QWorks.Models;
using QWorks.Services;
using System.Collections.Concurrent;

namespace QWorks.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OvertimeController : ControllerBase
    {
        // In-memory store for demonstrations/mock API
        private static readonly ConcurrentBag<OvertimeRequest> _requests = new();
        private static readonly ConcurrentBag<ApprovalLog> _logs = new();
        private static int _idCounter = 100;

        // GET: api/overtime/shifts
        [HttpGet("shifts")]
        public IActionResult GetShifts()
        {
            var shifts = new[]
            {
                new { 
                    id = 1, 
                    name = "Shift 1", 
                    description = "Shift 1 (22:30 - 07:30 Malam Lintas Hari)", 
                    startTime = "22:30", 
                    endTime = "07:30", 
                    isOvernight = true 
                },
                new { 
                    id = 2, 
                    name = "Shift 2", 
                    description = "Shift 2 (07:30 - 16:30 Pagi)", 
                    startTime = "07:30", 
                    endTime = "16:30", 
                    isOvernight = false 
                }
            };
            return Ok(shifts);
        }

        // POST: api/overtime/preview
        [HttpPost("preview")]
        public IActionResult PreviewCalculation([FromBody] PreviewOvertimeDto dto)
        {
            var result = OvertimeCalculatorService.Calculate(
                dto.ShiftName,
                dto.WorkDate,
                dto.StartTimeStr,
                dto.EndTimeStr,
                dto.IsHoliday
            );

            if (!result.IsValid)
            {
                return BadRequest(new { success = false, error = result.ErrorMessage });
            }

            return Ok(new { success = true, data = result });
        }

        // POST: api/overtime/submit
        [HttpPost("submit")]
        public IActionResult SubmitRequest([FromBody] SubmitOvertimeDto dto)
        {
            var calc = OvertimeCalculatorService.Calculate(
                dto.ShiftName,
                dto.WorkDate,
                dto.JamMasuk,
                dto.JamPulang,
                dto.IsHoliday
            );

            if (!calc.IsValid)
            {
                return BadRequest(new { success = false, error = calc.ErrorMessage });
            }

            int newId = Interlocked.Increment(ref _idCounter);
            var req = new OvertimeRequest
            {
                Id = newId,
                RequestNumber = $"OT-{DateTime.UtcNow:yyyyMMdd}-{newId:D3}",
                UserNpk = dto.Npk,
                UserName = dto.Name,
                Plant = dto.Plant,
                Department = dto.Department,
                ShiftName = dto.ShiftName,
                WorkDate = dto.WorkDate,
                OvertimeType = calc.OvertimeType,
                StartTime = OvertimeCalculatorService.ParseTime(dto.WorkDate, dto.JamMasuk, dto.ShiftName),
                EndTime = OvertimeCalculatorService.ParseTime(dto.WorkDate, dto.JamPulang, dto.ShiftName),
                RawDurationMinutes = calc.RawMinutes,
                CountedDurationMinutes = calc.CountedMinutes,
                JamOvertime = calc.JamOvertime,
                TotalTul = calc.TotalTul,
                IsTolerance = calc.IsTolerance,
                IsHoliday = dto.IsHoliday,
                DayType = dto.IsHoliday ? "libur" : "kerja",
                Reason = dto.Reason,
                Status = OvertimeStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _requests.Add(req);

            _logs.Add(new ApprovalLog
            {
                Id = _logs.Count + 1,
                OvertimeRequestId = req.Id,
                ActorName = dto.Name,
                Action = "SUBMITTED",
                Note = "Pengajuan lembur baru dibuat.",
                CreatedAt = DateTime.UtcNow
            });

            return Ok(new
            {
                success = true,
                message = "Pengajuan lembur berhasil dibuat dengan status PENDING (Menunggu Persetujuan Atasan).",
                data = req
            });
        }

        // POST: api/overtime/{id}/decision
        [HttpPost("{id}/decision")]
        public IActionResult MakeDecision(int id, [FromBody] ApprovalDecisionDto dto)
        {
            var req = _requests.FirstOrDefault(r => r.Id == id);
            if (req == null)
            {
                return NotFound(new { success = false, message = "Data pengajuan lembur tidak ditemukan." });
            }

            if (dto.Action.Equals("APPROVED", StringComparison.OrdinalIgnoreCase))
            {
                req.Status = OvertimeStatus.Approved;
                req.ApproverId = dto.ApproverId;
                req.ApproverName = dto.ApproverName;
                req.ApprovedAt = DateTime.UtcNow;
                req.ApprovalNote = dto.Note;
            }
            else if (dto.Action.Equals("REJECTED", StringComparison.OrdinalIgnoreCase))
            {
                req.Status = OvertimeStatus.Rejected;
                req.ApproverId = dto.ApproverId;
                req.ApproverName = dto.ApproverName;
                req.ApprovedAt = DateTime.UtcNow;
                req.ApprovalNote = dto.Note;
            }
            else
            {
                return BadRequest(new { success = false, message = "Aksi harus 'APPROVED' atau 'REJECTED'." });
            }

            _logs.Add(new ApprovalLog
            {
                Id = _logs.Count + 1,
                OvertimeRequestId = req.Id,
                ActorId = dto.ApproverId,
                ActorName = dto.ApproverName,
                Action = dto.Action.ToUpperInvariant(),
                Note = dto.Note,
                CreatedAt = DateTime.UtcNow
            });

            return Ok(new
            {
                success = true,
                message = $"Pengajuan lembur {req.RequestNumber} telah di-{req.Status.ToString().ToUpperInvariant()}.",
                data = req
            });
        }
    }
}
