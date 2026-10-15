using System;
using System.Collections.Generic;

namespace QWorks.Models
{
    public enum OvertimeStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    public enum OvertimeType
    {
        PreShift,
        PostShift,
        OffDay
    }

    public class Shift
    {
        public int Id { get; set; }
        public string ShiftName { get; set; } = string.Empty; // "Shift 1", "Shift 2"
        public string Description { get; set; } = string.Empty;
        public TimeSpan StartTime { get; set; } // 22:30:00 or 07:30:00
        public TimeSpan EndTime { get; set; }   // 07:30:00 or 16:30:00
        public bool IsOvernight { get; set; }   // true for Shift 1
        public bool IsActive { get; set; } = true;
    }

    public class User
    {
        public int Id { get; set; }
        public string Nik { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "EMPLOYEE"; // "EMPLOYEE", "SUPERVISOR", "MANAGER", "HR_ADMIN"
        public string Department { get; set; } = string.Empty;
        public string Plant { get; set; } = string.Empty;
        public int? SupervisorId { get; set; }
    }

    public class OvertimeRequest
    {
        public int Id { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserNpk { get; set; } = string.Empty;
        public string Plant { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int ShiftId { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public DateTime WorkDate { get; set; }
        public string OvertimeType { get; set; } = "POST_SHIFT"; // PRE_SHIFT, POST_SHIFT, OFF_DAY
        
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        
        public int RawDurationMinutes { get; set; }
        public bool IsTolerance { get; set; }
        public int CountedDurationMinutes { get; set; }
        public double JamOvertime { get; set; }
        public double TotalTul { get; set; }
        
        public bool IsHoliday { get; set; }
        public string DayType { get; set; } = "kerja";
        
        public string Reason { get; set; } = string.Empty;
        public OvertimeStatus Status { get; set; } = OvertimeStatus.Pending;
        
        public int? ApproverId { get; set; }
        public string? ApproverName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovalNote { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ApprovalLog
    {
        public int Id { get; set; }
        public int OvertimeRequestId { get; set; }
        public int ActorId { get; set; }
        public string ActorName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // "SUBMITTED", "APPROVED", "REJECTED"
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // ================= DTOs =================
    public record PreviewOvertimeDto(
        string ShiftName,
        DateTime WorkDate,
        string StartTimeStr, // "20:30" or "07:30"
        string EndTimeStr,   // "22:30" or "09:30"
        bool IsHoliday
    );

    public record SubmitOvertimeDto(
        string Npk,
        string Name,
        string Plant,
        string Department,
        string ShiftName,
        DateTime WorkDate,
        string JamMasuk,
        string JamPulang,
        bool IsHoliday,
        string Reason
    );

    public record ApprovalDecisionDto(
        int ApproverId,
        string ApproverName,
        string Action, // "APPROVED" or "REJECTED"
        string? Note
    );

    public record OvertimeCalculationResult(
        bool IsValid,
        string? ErrorMessage,
        string? WarningMessage,
        string OvertimeType,
        string OvertimeTypeLabel,
        int RawMinutes,
        int CountedMinutes,
        double JamOvertime,
        double TotalTul,
        bool IsTolerance
    );
}
