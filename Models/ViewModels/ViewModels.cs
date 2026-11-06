using System;
using System.Collections.Generic;

namespace QWorks.Models.ViewModels
{
    public class CurrentUserSession
    {
        public int Id { get; set; }
        public string Role { get; set; } = "karyawan"; // "admin" or "karyawan"
        public string RoleLabel { get; set; } = "Karyawan Quality";
        public string Name { get; set; } = string.Empty;
        public string Npk { get; set; } = string.Empty;
        public string Plant { get; set; } = "Plant Hose";
        public string Dept { get; set; } = "hose";
        public string Badge { get; set; } = string.Empty;
        public bool IsAdmin => Role == "admin";
        public bool IsKaryawan => Role == "karyawan";
    }

    public class LoginViewModel
    {
        public string ActiveTab { get; set; } = "karyawan"; // "karyawan" or "admin"
        public string? KaryawanNpk { get; set; }
        public string? KaryawanNama { get; set; }
        public string? AdminUsername { get; set; }
        public string? AdminPassword { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class DashboardViewModel
    {
        public string ViewMode { get; set; } = "all-plants"; // "all-plants", "hose", "molded", "subcont", "lab-mixing", "rvi", "qre"
        public string PageTitle { get; set; } = "Dashboard Over Time";
        public string CurrentPlant { get; set; } = "All";
        public string ActiveDate { get; set; } = "09 Sep 2026";
        public double TotalJamOvertime { get; set; }
        public double TotalTUL { get; set; }
        public int UniqueEmployees { get; set; }
        public int TotalRecords { get; set; }
        public double TargetJamOT { get; set; } = 50;
        public double TargetRR { get; set; } = 2.0;

        // Active filters
        public List<string> SelectedMonths { get; set; } = new();
        public List<string> SelectedDays { get; set; } = new();
        public List<string> SelectedShifts { get; set; } = new();
        public List<string> SelectedPlants { get; set; } = new();
        public List<string> SelectedEmployees { get; set; } = new();

        // Data collections
        public List<OvertimeRequest> FilteredRecords { get; set; } = new();
        public List<PlantSummaryItem> PlantSummaries { get; set; } = new();
        public List<ShiftSummaryItem> ShiftSummaries { get; set; } = new();
        public List<DailySummaryItem> DailySummaries { get; set; } = new();
        public List<TopEmployeeItem> TopEmployees { get; set; } = new();

        // Master lookup lists for filters
        public List<PlantInfo> AllowedPlants { get; set; } = new();
        public List<User> AllEmployees { get; set; } = new();
        public List<string> AllShifts { get; set; } = new();
        public List<string> MonthList { get; set; } = new();
        public List<string> DayList { get; set; } = new();
    }

    public class PlantInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Dept { get; set; } = string.Empty;
    }

    public class PlantSummaryItem
    {
        public string PlantName { get; set; } = string.Empty;
        public string Dept { get; set; } = string.Empty;
        public double TotalJam { get; set; }
        public double TotalTul { get; set; }
        public int EmployeeCount { get; set; }
        public int RequestCount { get; set; }
    }

    public class ShiftSummaryItem
    {
        public string ShiftName { get; set; } = string.Empty;
        public double TotalJam { get; set; }
        public double Percentage { get; set; }
    }

    public class DailySummaryItem
    {
        public string Day { get; set; } = string.Empty;
        public string DateLabel { get; set; } = string.Empty;
        public double TotalJam { get; set; }
        public double TotalTul { get; set; }
        public bool IsHoliday { get; set; }
    }

    public class TopEmployeeItem
    {
        public string Npk { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Plant { get; set; } = string.Empty;
        public double TotalJam { get; set; }
        public double TotalTul { get; set; }
        public int Frequency { get; set; }
    }

    public class InputOvertimeViewModel
    {
        public List<User> AvailableEmployees { get; set; } = new();
        public List<string> AllowedPlants { get; set; } = new();
        public List<Shift> AvailableShifts { get; set; } = new();
        public string DefaultPlant { get; set; } = "Plant Hose";
        public string DefaultDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
        public string DefaultShift { get; set; } = "Shift 1";
        public string TimeIn { get; set; } = "07:30";
        public string TimeOut { get; set; } = "09:30";
    }

    public class RekapOvertimeViewModel
    {
        public List<OvertimeRequest> Records { get; set; } = new();
        public double TotalJamOvertime { get; set; }
        public double TotalTUL { get; set; }
        public int UniqueEmployees { get; set; }
        public int TotalRecords { get; set; }

        public string? SearchKeyword { get; set; }
        public List<string> SelectedMonths { get; set; } = new();
        public List<string> SelectedDays { get; set; } = new();
        public List<string> SelectedShifts { get; set; } = new();
        public List<string> SelectedPlants { get; set; } = new();
        public List<string> SelectedEmployees { get; set; } = new();

        public List<string> MonthList { get; set; } = new();
        public List<string> DayList { get; set; } = new();
        public List<string> ShiftList { get; set; } = new();
        public List<string> PlantList { get; set; } = new();
        public List<User> EmployeeList { get; set; } = new();
    }

    public class MasterPekerjaViewModel
    {
        public List<User> Employees { get; set; } = new();
        public Dictionary<string, int> PlantCounts { get; set; } = new();
        public int TotalEmployees { get; set; }
        public string? SelectedPlant { get; set; } = "ALL";
        public string? SearchKeyword { get; set; }
        public List<string> AllowedPlants { get; set; } = new();
        public int CurrentPage { get; set; } = 1;
        public int TotalPages { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class MasterPekerjaImportResult
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public List<string> ErrorDetails { get; set; } = new();
        public List<User> ValidEmployees { get; set; } = new();
    }

    public class RiwayatPenginputViewModel
    {
        public List<OvertimeRequest> Records { get; set; } = new();
        public int TotalRecords { get; set; }
        public string? SearchKeyword { get; set; }
        public List<string> SelectedMonths { get; set; } = new();
        public List<string> SelectedDays { get; set; } = new();
        public List<string> SelectedShifts { get; set; } = new();
        public List<string> SelectedPlants { get; set; } = new();
        public List<string> SelectedEmployees { get; set; } = new();

        public List<string> MonthList { get; set; } = new();
        public List<string> DayList { get; set; } = new();
        public List<string> ShiftList { get; set; } = new();
        public List<string> PlantList { get; set; } = new();
        public List<User> EmployeeList { get; set; } = new();
    }

    // Calculation DTOs
    public record PreviewOvertimeDto(
        string ShiftName,
        string WorkDate,
        string StartTimeStr,
        string EndTimeStr,
        bool IsHoliday
    );

    public record SubmitOvertimeDto(
        List<string> Npks,
        string Plant,
        string Department,
        string ShiftName,
        string WorkDate,
        string JamMasuk,
        string JamPulang,
        double? ManualJam,
        bool IsHoliday,
        string Reason
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
        bool IsTolerance,
        string JamWaktu,
        string TulFormulaBreakdown
    );

    public class SlicerViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string HeaderTitle { get; set; } = string.Empty;
        public List<SlicerItemViewModel> Items { get; set; } = new();
        public bool AlignRight { get; set; } = false;
    }

    public class SlicerItemViewModel
    {
        public string Value { get; set; } = string.Empty;
        public string MainText { get; set; } = string.Empty;
        public string SubText { get; set; } = string.Empty;
        public bool IsChecked { get; set; } = false;
    }
}
