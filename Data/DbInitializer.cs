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

            // 5. OvertimeRequests: tidak di-seed — database dimulai bersih untuk data produksi
            // Data lembur akan diinput langsung oleh user melalui aplikasi

            // 6. ENSURE INTEGRITY: ShiftId and UserId on all records (jika ada data yang sudah ada)
            var unlinkedRecords = context.OvertimeRequests.Where(r => r.ShiftId == 0 || r.UserId == 0).ToList();
            if (unlinkedRecords.Count > 0)
            {
                var shiftDict = context.Shifts.ToDictionary(s => s.ShiftName, s => s.Id);
                var userDict = context.Users.Where(u => u.Role == "karyawan").ToDictionary(u => u.Nik, u => u.Id);

                foreach (var r in unlinkedRecords)
                {
                    if (r.ShiftId == 0 && shiftDict.TryGetValue(r.ShiftName, out int sid))
                    {
                        r.ShiftId = sid;
                    }
                    else if (r.ShiftId == 0)
                    {
                        r.ShiftId = r.ShiftName.Contains("2") ? 2 : 1;
                    }

                    if (r.UserId == 0 && userDict.TryGetValue(r.UserNpk, out int uid))
                    {
                        r.UserId = uid;
                    }
                }
                context.SaveChanges();
            }
        }
    }
}
