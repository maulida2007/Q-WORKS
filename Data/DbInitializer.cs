using System;
using System.Collections.Generic;
using System.Linq;
using QWorks.Models;
using QWorks.Services;

namespace QWorks.Data
{
    public static class DbInitializer
    {
        public static void Initialize(QWorksDbContext context, IOvertimeCalculatorService calcService)
        {
            context.Database.EnsureCreated();

            // 1. SEED SHIFTS
            if (!context.Shifts.Any())
            {
                context.Shifts.AddRange(
                    new Shift
                    {
                        ShiftName = "Shift 1",
                        Description = "Shift 1 Malam Lintas Hari (22:30 - 07:30)",
                        StartTime = new TimeSpan(22, 30, 0),
                        EndTime = new TimeSpan(7, 30, 0),
                        IsOvernight = true,
                        IsActive = true
                    },
                    new Shift
                    {
                        ShiftName = "Shift 2",
                        Description = "Shift 2 Pagi Reguler (07:30 - 16:30)",
                        StartTime = new TimeSpan(7, 30, 0),
                        EndTime = new TimeSpan(16, 30, 0),
                        IsOvernight = false,
                        IsActive = true
                    }
                );
                context.SaveChanges();
            }

            // 2. SEED USERS & EMPLOYEES
            if (!context.Users.Any())
            {
                var users = new List<User>
                {
                    // Admin accounts
                    new User
                    {
                        Nik = "ADMIN-01",
                        Name = "Admin",
                        Username = "admin",
                        PasswordHash = "admin123",
                        Role = "admin",
                        RoleLabel = "Admin",
                        Department = "all",
                        Plant = "All Plants"
                    },
                    new User
                    {
                        Nik = "QC-LEAD",
                        Name = "QC Lead",
                        Username = "qc_lead",
                        PasswordHash = "qclead123",
                        Role = "admin",
                        RoleLabel = "Admin",
                        Department = "all",
                        Plant = "All Plants"
                    },

                    // Plant Hose (13)
                    new User { Nik = "1747", Name = "GILANG", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1796", Name = "OCHA", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1726", Name = "JUNIAR", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1797", Name = "MELA", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1611", Name = "ALIF", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1303", Name = "ISKANDAR", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "0227", Name = "ARIYANTO", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1506", Name = "DENI", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1795", Name = "INDAH", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1798", Name = "DINI", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1727", Name = "SYIFA", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1519", Name = "RICO", Plant = "Plant Hose", Department = "hose" },
                    new User { Nik = "1592", Name = "AZIS", Plant = "Plant Hose", Department = "hose" },

                    // Plant Molded (13)
                    new User { Nik = "1670", Name = "KATIM", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1423", Name = "SAHRUL", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1376", Name = "SALAM", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1378", Name = "ANDRY", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1580", Name = "MIFTAH", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1586", Name = "KELVIN", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1392", Name = "YAYANG", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1590", Name = "HAMDAN", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1728", Name = "HILMI", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1707", Name = "EKA", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1773", Name = "RIZKI", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1488", Name = "RIKI", Plant = "Plant Molded", Department = "molded" },
                    new User { Nik = "1391", Name = "YAYA", Plant = "Plant Molded", Department = "molded" },

                    // Plant Subcont (4)
                    new User { Nik = "0201", Name = "KIKI", Plant = "Plant Subcont", Department = "subcont" },
                    new User { Nik = "0228", Name = "ANDI", Plant = "Plant Subcont", Department = "subcont" },
                    new User { Nik = "1459", Name = "SANDY", Plant = "Plant Subcont", Department = "subcont" },
                    new User { Nik = "1722", Name = "SAHRIL", Plant = "Plant Subcont", Department = "subcont" },

                    // Plant Lab Mixing (3)
                    new User { Nik = "1705", Name = "RAYHAN", Plant = "Plant Lab Mixing", Department = "lab-mixing" },
                    new User { Nik = "0031", Name = "ACA", Plant = "Plant Lab Mixing", Department = "lab-mixing" },
                    new User { Nik = "1379", Name = "DANDA", Plant = "Plant Lab Mixing", Department = "lab-mixing" },

                    // Plant RVI (10)
                    new User { Nik = "1443", Name = "ARIF", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "0052", Name = "WILLY", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1353", Name = "ACU", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1427", Name = "WAHYU", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1460", Name = "KEKEN", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "0458", Name = "WIKATMA", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1422", Name = "ROBI", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1659", Name = "RIAN", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1520", Name = "RIDWAN", Plant = "Plant RVI", Department = "rvi" },
                    new User { Nik = "1800", Name = "SUHDIN", Plant = "Plant RVI", Department = "rvi" },

                    // Plant QRE (3)
                    new User { Nik = "0222", Name = "SADIYAH", Plant = "Plant QRE", Department = "qre" },
                    new User { Nik = "1321", Name = "ATIM", Plant = "Plant QRE", Department = "qre" },
                    new User { Nik = "1605", Name = "AHMAD", Plant = "Plant QRE", Department = "qre" }
                };

                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // 3. SEED SETTINGS
            if (!context.SystemSettings.Any())
            {
                context.SystemSettings.AddRange(
                    new SystemSetting { Key = "TargetJamOT", Value = "50", UpdatedAt = DateTime.UtcNow },
                    new SystemSetting { Key = "TargetRR", Value = "2.0", UpdatedAt = DateTime.UtcNow }
                );
                context.SaveChanges();
            }

            // 4. SEED NOTIFICATIONS
            if (!context.NotificationItems.Any())
            {
                context.NotificationItems.AddRange(
                    new NotificationItem
                    {
                        Title = "Lembur Shift 1 Disetujui",
                        Message = "6 Karyawan Plant Hose telah diinput lembur total 10.5 Jam (21 TUL)",
                        TimeAgo = "15 menit yang lalu",
                        Type = "success",
                        IsUnread = true
                    },
                    new NotificationItem
                    {
                        Title = "Batas Maksimum Lembur",
                        Message = "GILANG (1747) telah mencapai akumulasi 6 jam minggu ini",
                        TimeAgo = "1 jam yang lalu",
                        Type = "warning",
                        IsUnread = true
                    }
                );
                context.SaveChanges();
            }

            // 5. SEED INITIAL OVERTIME RECORDS
            if (!context.OvertimeRequests.Any())
            {
                var rawData = new[]
                {
                    // Plant Hose
                    new { Id = "OT-20260908-001", Plant = "Plant Hose", Nama = "GILANG", Npk = "1747", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 09:15:20" },
                    new { Id = "OT-20260908-002", Plant = "Plant Hose", Nama = "OCHA", Npk = "1796", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 09:10:00" },
                    new { Id = "OT-20260908-003", Plant = "Plant Hose", Nama = "JUNIAR", Npk = "1726", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 09:05:00" },
                    new { Id = "OT-20260908-004", Plant = "Plant Hose", Nama = "MELA", Npk = "1797", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 08:50:00" },
                    new { Id = "OT-20260908-005", Plant = "Plant Hose", Nama = "ALIF", Npk = "1611", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 08:40:00" },
                    new { Id = "OT-20260908-006", Plant = "Plant Hose", Nama = "ISKANDAR", Npk = "1303", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 08:30:00" },
                    new { Id = "OT-20260908-007", Plant = "Plant Hose", Nama = "ARIYANTO", Npk = "0227", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.5, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260908-008", Plant = "Plant Hose", Nama = "DENI", Npk = "1506", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260907-009", Plant = "Plant Hose", Nama = "INDAH", Npk = "1795", Shift = "Shift 2", Date = "2026-09-07", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-07 23:00:00" },
                    new { Id = "OT-20260907-010", Plant = "Plant Hose", Nama = "GILANG", Npk = "1747", Shift = "Shift 1", Date = "2026-09-07", Jam = 2.0, Dept = "hose", Kegiatan = "CHECKING", Ts = "2026-09-07 17:00:00" },

                    // Plant Molded
                    new { Id = "OT-20260908-011", Plant = "Plant Molded", Nama = "KATIM", Npk = "1670", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 09:15:20" },
                    new { Id = "OT-20260908-012", Plant = "Plant Molded", Nama = "SAHRUL", Npk = "1423", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 09:10:00" },
                    new { Id = "OT-20260908-013", Plant = "Plant Molded", Nama = "SALAM", Npk = "1376", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 09:05:00" },
                    new { Id = "OT-20260908-014", Plant = "Plant Molded", Nama = "ANDRY", Npk = "1378", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 08:50:00" },
                    new { Id = "OT-20260908-015", Plant = "Plant Molded", Nama = "MIFTAH", Npk = "1580", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 08:40:00" },
                    new { Id = "OT-20260908-016", Plant = "Plant Molded", Nama = "KELVIN", Npk = "1586", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 08:30:00" },
                    new { Id = "OT-20260908-017", Plant = "Plant Molded", Nama = "YAYANG", Npk = "1392", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 17:00:00" },
                    new { Id = "OT-20260908-018", Plant = "Plant Molded", Nama = "HAMDAN", Npk = "1590", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.5, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260907-019", Plant = "Plant Molded", Nama = "HILMI", Npk = "1728", Shift = "Shift 2", Date = "2026-09-07", Jam = 2.0, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-07 23:00:00" },
                    new { Id = "OT-20260907-020", Plant = "Plant Molded", Nama = "EKA", Npk = "1707", Shift = "Shift 2", Date = "2026-09-07", Jam = 2.0, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-07 23:00:00" },
                    new { Id = "OT-20260906-021", Plant = "Plant Molded", Nama = "KATIM", Npk = "1670", Shift = "Shift 1", Date = "2026-09-06", Jam = 3.0, Dept = "molded", Kegiatan = "CHECKING", Ts = "2026-09-06 17:00:00" },

                    // Plant Subcont
                    new { Id = "OT-20260908-022", Plant = "Plant Subcont", Nama = "KIKI", Npk = "0201", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "subcont", Kegiatan = "GL", Ts = "2026-09-08 09:15:20" },
                    new { Id = "OT-20260908-023", Plant = "Plant Subcont", Nama = "ANDI", Npk = "0228", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "subcont", Kegiatan = "CHECKING", Ts = "2026-09-08 09:10:00" },
                    new { Id = "OT-20260908-024", Plant = "Plant Subcont", Nama = "SANDY", Npk = "1459", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "subcont", Kegiatan = "CHECKING", Ts = "2026-09-08 09:05:00" },
                    new { Id = "OT-20260908-025", Plant = "Plant Subcont", Nama = "SAHRIL", Npk = "1722", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "subcont", Kegiatan = "CHECKING", Ts = "2026-09-08 08:50:00" },
                    new { Id = "OT-20260907-026", Plant = "Plant Subcont", Nama = "KIKI", Npk = "0201", Shift = "Shift 1", Date = "2026-09-07", Jam = 2.0, Dept = "subcont", Kegiatan = "GL", Ts = "2026-09-07 17:00:00" },
                    new { Id = "OT-20260907-027", Plant = "Plant Subcont", Nama = "ANDI", Npk = "0228", Shift = "Shift 1", Date = "2026-09-07", Jam = 2.0, Dept = "subcont", Kegiatan = "CHECKING", Ts = "2026-09-07 17:00:00" },

                    // Plant Lab Mixing
                    new { Id = "OT-20260908-028", Plant = "Plant Lab Mixing", Nama = "RAYHAN", Npk = "1705", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "lab-mixing", Kegiatan = "TESTING", Ts = "2026-09-08 09:15:20" },
                    new { Id = "OT-20260908-029", Plant = "Plant Lab Mixing", Nama = "ACA", Npk = "0031", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "lab-mixing", Kegiatan = "TESTING", Ts = "2026-09-08 09:10:00" },
                    new { Id = "OT-20260908-030", Plant = "Plant Lab Mixing", Nama = "DANDA", Npk = "1379", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.5, Dept = "lab-mixing", Kegiatan = "MIXING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260907-031", Plant = "Plant Lab Mixing", Nama = "RAYHAN", Npk = "1705", Shift = "Shift 1", Date = "2026-09-07", Jam = 2.0, Dept = "lab-mixing", Kegiatan = "TESTING", Ts = "2026-09-07 17:00:00" },

                    // Plant RVI
                    new { Id = "OT-20260908-032", Plant = "Plant RVI", Nama = "ARIF", Npk = "1443", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 09:15:20" },
                    new { Id = "OT-20260908-033", Plant = "Plant RVI", Nama = "WILLY", Npk = "0052", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 09:10:00" },
                    new { Id = "OT-20260908-034", Plant = "Plant RVI", Nama = "ACU", Npk = "1353", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 09:05:00" },
                    new { Id = "OT-20260908-035", Plant = "Plant RVI", Nama = "WAHYU", Npk = "1427", Shift = "Shift 1", Date = "2026-09-08", Jam = 1.5, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 08:50:00" },
                    new { Id = "OT-20260908-036", Plant = "Plant RVI", Nama = "KEKEN", Npk = "1460", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.5, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260908-037", Plant = "Plant RVI", Nama = "WIKATMA", Npk = "0458", Shift = "Shift 2", Date = "2026-09-08", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-08 23:00:00" },
                    new { Id = "OT-20260907-038", Plant = "Plant RVI", Nama = "ROBI", Npk = "1422", Shift = "Shift 2", Date = "2026-09-07", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-07 23:00:00" },
                    new { Id = "OT-20260907-039", Plant = "Plant RVI", Nama = "RIAN", Npk = "1659", Shift = "Shift 1", Date = "2026-09-07", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-07 17:00:00" },
                    new { Id = "OT-20260906-040", Plant = "Plant RVI", Nama = "RIDWAN", Npk = "1520", Shift = "Shift 2", Date = "2026-09-06", Jam = 3.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-06 23:00:00" },
                    new { Id = "OT-20260905-041", Plant = "Plant RVI", Nama = "SUHDIN", Npk = "1800", Shift = "Shift 2", Date = "2026-09-05", Jam = 2.0, Dept = "rvi", Kegiatan = "CHECKING", Ts = "2026-09-05 23:00:00" },

                    // Plant QRE
                    new { Id = "OT-20260909-042", Plant = "Plant QRE", Nama = "SADIYAH", Npk = "0222", Shift = "Shift 1", Date = "2026-09-09", Jam = 2.5, Dept = "qre", Kegiatan = "CHECKING", Ts = "2026-09-09 17:00:00" },
                    new { Id = "OT-20260908-043", Plant = "Plant QRE", Nama = "ATIM", Npk = "1321", Shift = "Shift 1", Date = "2026-09-08", Jam = 2.0, Dept = "qre", Kegiatan = "PENGUKURAN", Ts = "2026-09-08 17:30:00" },
                    new { Id = "OT-20260907-044", Plant = "Plant QRE", Nama = "AHMAD", Npk = "1605", Shift = "Shift 2", Date = "2026-09-07", Jam = 3.0, Dept = "qre", Kegiatan = "VALIDASI SAMPLE", Ts = "2026-09-07 23:00:00" }
                };

                string[] monthNames = { "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" };

                var records = new List<OvertimeRequest>();
                foreach (var item in rawData)
                {
                    DateTime workDt = DateTime.Parse(item.Date);
                    bool isHoliday = calcService.IsWeekendOrHoliday(workDt);
                    double tul = calcService.CalculateTul(item.Jam, isHoliday);
                    string jamWaktu = calcService.GetFallbackJamWaktu(item.Shift, item.Jam, isHoliday);
                    string month = $"{monthNames[workDt.Month - 1]} {workDt.Year}";

                    DateTime parsedTs;
                    if (!DateTime.TryParse(item.Ts, out parsedTs))
                    {
                        parsedTs = workDt.AddHours(17);
                    }

                    records.Add(new OvertimeRequest
                    {
                        RequestNumber = item.Id,
                        UserName = item.Nama,
                        UserNpk = item.Npk,
                        Plant = item.Plant,
                        Department = item.Dept,
                        ShiftName = item.Shift,
                        WorkDate = workDt,
                        Month = month,
                        Day = workDt.Day,
                        JamOvertime = item.Jam,
                        TotalTul = tul,
                        IsHoliday = isHoliday,
                        DayType = isHoliday ? "libur" : "kerja",
                        JamWaktu = jamWaktu,
                        OvertimeType = isHoliday ? "OFF_DAY" : "POST_SHIFT",
                        OvertimeTypeLabel = isHoliday ? "Lembur Hari Libur (H.O.T)" : "Post-Shift",
                        RawDurationMinutes = (int)Math.Round(item.Jam * 60),
                        CountedDurationMinutes = (int)Math.Round(item.Jam * 60),
                        IsTolerance = false,
                        Reason = item.Kegiatan,
                        Status = "Approved",
                        ApproverName = "Supervisor QC",
                        ApprovedAt = parsedTs,
                        CreatedByName = "Admin",
                        CreatedByNpk = "ADMIN-01",
                        CreatedByRole = "admin",
                        CreatedByPlant = item.Plant,
                        CreatedAt = parsedTs,
                        UpdatedAt = parsedTs
                    });
                }

                context.OvertimeRequests.AddRange(records);
                context.SaveChanges();
            }
        }
    }
}
