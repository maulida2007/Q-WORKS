using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QWorks.Models
{
    public class Shift
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string ShiftName { get; set; } = string.Empty; // "Shift 1", "Shift 2"
        
        [MaxLength(150)]
        public string Description { get; set; } = string.Empty;
        
        public TimeSpan StartTime { get; set; } // 22:30:00 or 07:30:00
        public TimeSpan EndTime { get; set; }   // 07:30:00 or 16:30:00
        public bool IsOvernight { get; set; }   // true for Shift 1
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nik { get; set; } = string.Empty; // NPK

        [NotMapped]
        public string Npk
        {
            get => Nik;
            set => Nik = value;
        }

        [NotMapped]
        public string Shift => DefaultShiftId == 2 ? "Shift 2" : "Shift 1";

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Username { get; set; } // For admin

        [MaxLength(100)]
        public string? PasswordHash { get; set; } // For admin

        [Required]
        [MaxLength(30)]
        public string Role { get; set; } = "karyawan"; // "admin" or "karyawan"

        [MaxLength(50)]
        public string RoleLabel { get; set; } = "Karyawan Quality";

        [Required]
        [MaxLength(50)]
        public string Department { get; set; } = string.Empty; // "hose", "molded", "subcont", "lab-mixing", "rvi", "qre"

        [Required]
        [MaxLength(50)]
        public string Plant { get; set; } = string.Empty; // "Plant Hose", "Plant Molded", etc.

        public int? DefaultShiftId { get; set; }
        public int? SupervisorId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsUserAdded { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OvertimeRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(60)]
        public string RequestNumber { get; set; } = string.Empty; // e.g. "OT-20260908-001"

        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string UserNpk { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Plant { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Department { get; set; } = string.Empty;

        public int ShiftId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ShiftName { get; set; } = "Shift 1";

        public DateTime WorkDate { get; set; }

        [MaxLength(50)]
        public string Month { get; set; } = string.Empty; // e.g. "September 2026"

        public int Day { get; set; } // e.g. 8

        [Required]
        [MaxLength(30)]
        public string OvertimeType { get; set; } = "POST_SHIFT"; // "PRE_SHIFT", "POST_SHIFT", "OFF_DAY"

        [MaxLength(60)]
        public string OvertimeTypeLabel { get; set; } = "Post-Shift";

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        [MaxLength(50)]
        public string JamWaktu { get; set; } = string.Empty; // e.g. "07:30 - 09:30"

        public int RawDurationMinutes { get; set; }
        public bool IsTolerance { get; set; }
        public int CountedDurationMinutes { get; set; }
        public double JamOvertime { get; set; }
        public double TotalTul { get; set; }

        public bool IsHoliday { get; set; }

        [MaxLength(20)]
        public string DayType { get; set; } = "kerja"; // "kerja" or "libur"

        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Approved"; // "Approved", "Pending", "Rejected", "Cancelled"

        public int? ApproverId { get; set; }

        [MaxLength(100)]
        public string? ApproverName { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(500)]
        public string? ApprovalNote { get; set; }

        // Submitter Metadata
        [MaxLength(100)]
        public string? CreatedByName { get; set; }

        [MaxLength(50)]
        public string? CreatedByNpk { get; set; }

        [MaxLength(50)]
        public string? CreatedByRole { get; set; }

        [MaxLength(50)]
        public string? CreatedByPlant { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ApprovalLog
    {
        [Key]
        public int Id { get; set; }

        public int OvertimeRequestId { get; set; }
        public int ActorId { get; set; }

        [MaxLength(100)]
        public string ActorName { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string Action { get; set; } = string.Empty; // "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"

        [MaxLength(30)]
        public string? PreviousStatus { get; set; }

        [MaxLength(30)]
        public string NewStatus { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SystemSetting
    {
        [Key]
        [MaxLength(50)]
        public string Key { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class NotificationItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [MaxLength(50)]
        public string TimeAgo { get; set; } = "Baru saja";

        public bool IsUnread { get; set; } = true;

        [MaxLength(20)]
        public string Type { get; set; } = "success"; // "success", "warning", "danger", "info"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
