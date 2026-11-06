using System;
using System.Collections.Generic;
using System.IO;
using ClosedXML.Excel;
using QWorks.Models;
using QWorks.Models.ViewModels;

namespace QWorks.Services
{
    public interface IExcelService
    {
        byte[] ExportMasterPekerja(List<User> employees);
        byte[] ExportRekapOvertime(List<OvertimeRequest> records);
        byte[] ExportRiwayatPenginput(List<OvertimeRequest> records);
        byte[] GetMasterPekerjaTemplate();
        List<User> ParseMasterPekerjaExcel(Stream stream);
        MasterPekerjaImportResult ParseMasterPekerjaExcelWithReport(Stream stream);
    }

    public class ExcelService : IExcelService
    {
        private static readonly XLColor HeaderGreen = XLColor.FromHtml("#8EA954");

        private void ApplyHeaderStyle(IXLRange range)
        {
            range.Style.Fill.BackgroundColor = HeaderGreen;
            range.Style.Font.FontName = "Calibri";
            range.Style.Font.FontSize = 11;
            range.Style.Font.Bold = true;
            range.Style.Font.FontColor = XLColor.Black;
            range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        private void ApplyDataStyle(IXLRange range)
        {
            range.Style.Font.FontName = "Calibri";
            range.Style.Font.FontSize = 11;
            range.Style.Font.FontColor = XLColor.Black;
            range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        public byte[] ExportMasterPekerja(List<User> employees)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Master Pekerja");

            string[] headers = { "No", "NPK", "Nama Karyawan", "Plant", "Departemen", "Status" };
            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
            }
            ApplyHeaderStyle(ws.Range(1, 1, 1, headers.Length));

            int row = 2;
            int no = 1;
            foreach (var emp in employees)
            {
                ws.Cell(row, 1).Value = no++;
                ws.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 2).SetValue(emp.Nik);
                ws.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 3).Value = emp.Name;
                ws.Cell(row, 4).Value = emp.Plant;
                ws.Cell(row, 5).Value = emp.Department;
                ws.Cell(row, 6).Value = emp.IsActive ? "Aktif" : "Non-Aktif";

                row++;
            }

            if (row > 2)
            {
                ApplyDataStyle(ws.Range(2, 1, row - 1, headers.Length));
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public byte[] ExportRekapOvertime(List<OvertimeRequest> records)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Rekap Overtime");

            string[] headers = {
                "No", "Nama Karyawan", "NPK", "Plant",
                "Shift", "Jam Overtime", "Tipe Hari", "Total TUL", "Waktu Input"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
            }
            ApplyHeaderStyle(ws.Range(1, 1, 1, headers.Length));

            int row = 2;
            int no = 1;
            foreach (var r in records)
            {
                ws.Cell(row, 1).Value = no++;
                ws.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 2).Value = r.UserName;
                ws.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                ws.Cell(row, 3).SetValue(r.UserNpk);
                ws.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 4).Value = r.Plant;
                ws.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                ws.Cell(row, 5).Value = r.ShiftName;
                ws.Cell(row, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 6).Value = r.JamOvertime;
                ws.Cell(row, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 7).Value = r.IsHoliday ? "Hari Libur" : "Hari Kerja";
                ws.Cell(row, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 8).Value = r.TotalTul;
                ws.Cell(row, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 9).Value = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                ws.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                row++;
            }

            if (row > 2)
            {
                ApplyDataStyle(ws.Range(2, 1, row - 1, headers.Length));
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public byte[] ExportRiwayatPenginput(List<OvertimeRequest> records)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Riwayat Penginput");

            // 10 Kolom Spesifikasi Resmi Sistem Q-WORKS:
            // 1. Waktu Input
            // 2. Role Penginput
            // 3. Plant (Penginput)
            // 4. Nama Karyawan
            // 5. NPK
            // 6. Plant Karyawan
            // 7. Shift
            // 8. Tanggal Lembur
            // 9. Jam Lembur
            // 10. Total TUL
            string[] headers = {
                "Waktu Input",
                "Role Penginput",
                "Plant",
                "Nama Karyawan",
                "NPK",
                "Plant Karyawan",
                "Shift",
                "Tanggal Lembur",
                "Jam Lembur",
                "Total TUL"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
            }
            ApplyHeaderStyle(ws.Range(1, 1, 1, headers.Length));

            int row = 2;
            foreach (var r in records)
            {
                // 1. Waktu Input
                ws.Cell(row, 1).Value = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                ws.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // 2. Role Penginput
                ws.Cell(row, 2).Value = r.CreatedByRole ?? "karyawan";
                ws.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // 3. Plant (Plant Penginput)
                ws.Cell(row, 3).Value = r.CreatedByPlant ?? r.Plant;
                ws.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                // 4. Nama Karyawan
                ws.Cell(row, 4).Value = r.UserName;
                ws.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                // 5. NPK
                ws.Cell(row, 5).SetValue(r.UserNpk);
                ws.Cell(row, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // 6. Plant Karyawan
                ws.Cell(row, 6).Value = r.Plant;
                ws.Cell(row, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                // 7. Shift
                ws.Cell(row, 7).Value = r.ShiftName;
                ws.Cell(row, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // 8. Tanggal Lembur
                ws.Cell(row, 8).Value = r.WorkDate.ToString("yyyy-MM-dd");
                ws.Cell(row, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // 9. Jam Lembur
                ws.Cell(row, 9).Value = r.JamOvertime;
                ws.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                // 10. Total TUL
                ws.Cell(row, 10).Value = r.TotalTul;
                ws.Cell(row, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                row++;
            }

            if (row > 2)
            {
                ApplyDataStyle(ws.Range(2, 1, row - 1, headers.Length));
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public byte[] GetMasterPekerjaTemplate()
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Template Master Pekerja");

            string[] headers = { "NPK", "Nama Karyawan", "Plant" };
            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cell(1, i + 1).Value = headers[i];
            }
            ApplyHeaderStyle(ws.Range(1, 1, 1, headers.Length));

            // Sample rows
            var samples = new[]
            {
                new { Npk = "1901", Name = "BUDI PRASETYO", Plant = "Plant Hose" },
                new { Npk = "1902", Name = "EKO WAHYUDI", Plant = "Plant Molded" },
                new { Npk = "1903", Name = "AGUS SUPRIYADI", Plant = "Plant RVI" }
            };

            int row = 2;
            foreach (var s in samples)
            {
                ws.Cell(row, 1).SetValue(s.Npk);
                ws.Cell(row, 2).Value = s.Name;
                ws.Cell(row, 3).Value = s.Plant;
                row++;
            }
            ApplyDataStyle(ws.Range(2, 1, row - 1, headers.Length));

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public List<User> ParseMasterPekerjaExcel(Stream stream)
        {
            var report = ParseMasterPekerjaExcelWithReport(stream);
            return report.ValidEmployees;
        }

        public MasterPekerjaImportResult ParseMasterPekerjaExcelWithReport(Stream stream)
        {
            var result = new MasterPekerjaImportResult();
            var seenNpks = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            XLWorkbook workbook;
            try
            {
                workbook = new XLWorkbook(stream);
            }
            catch (Exception ex)
            {
                result.ErrorDetails.Add($"Gagal membuka file Excel: Pastikan file berekstensi .xlsx yang valid. ({ex.Message})");
                return result;
            }

            using (workbook)
            {
                var ws = workbook.Worksheet(1);
                if (ws == null)
                {
                    result.ErrorDetails.Add("Worksheet Excel tidak ditemukan.");
                    return result;
                }

                int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
                if (lastRow < 2)
                {
                    result.ErrorDetails.Add("File Excel kosong atau tidak memiliki baris data karyawan.");
                    return result;
                }

            // Find column indices
            int npkCol = 0;
            int nameCol = 0;
            int plantCol = 0;

            for (int c = 1; c <= 15; c++)
            {
                string header = ws.Cell(1, c).GetString().Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(header)) continue;

                if (npkCol == 0 && (header.Contains("NPK") || header.Contains("NIK"))) npkCol = c;
                else if (nameCol == 0 && (header.Contains("NAMA") || header.Contains("NAME"))) nameCol = c;
                else if (plantCol == 0 && (header.Contains("PLANT") || header.Contains("DEPT"))) plantCol = c;
            }

            if (npkCol == 0)
            {
                result.ErrorDetails.Add("Header kolom NPK/NIK tidak ditemukan pada baris pertama Excel.");
            }
            if (nameCol == 0)
            {
                result.ErrorDetails.Add("Header kolom Nama Karyawan tidak ditemukan pada baris pertama Excel.");
            }
            if (result.ErrorDetails.Count > 0)
            {
                return result;
            }

            if (plantCol == 0) plantCol = 3;

            for (int r = 2; r <= lastRow; r++)
            {
                string npk = ws.Cell(r, npkCol).GetString().Trim().ToUpperInvariant();
                string name = ws.Cell(r, nameCol).GetString().Trim();
                string plant = plantCol > 0 ? ws.Cell(r, plantCol).GetString().Trim() : "Plant Hose";

                // Check empty row
                if (string.IsNullOrWhiteSpace(npk) && string.IsNullOrWhiteSpace(name))
                {
                    continue; // Skip pure empty rows
                }

                result.TotalRows++;

                // Validation checks
                if (string.IsNullOrWhiteSpace(npk))
                {
                    result.FailedCount++;
                    result.ErrorDetails.Add($"Baris {r}: Kolom NPK kosong (wajib diisi).");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(name))
                {
                    result.FailedCount++;
                    result.ErrorDetails.Add($"Baris {r} (NPK {npk}): Nama Karyawan kosong (wajib diisi).");
                    continue;
                }

                if (seenNpks.Contains(npk))
                {
                    result.FailedCount++;
                    result.ErrorDetails.Add($"Baris {r}: NPK '{npk}' terduplikasi dalam file Excel yang sama.");
                    continue;
                }

                seenNpks.Add(npk);

                if (string.IsNullOrWhiteSpace(plant))
                {
                    plant = "Plant Hose";
                }
                else if (!plant.StartsWith("Plant ", StringComparison.OrdinalIgnoreCase))
                {
                    plant = "Plant " + plant;
                }

                string dept = plant.ToLowerInvariant().Replace("plant ", "").Trim();
                if (dept.Contains("lab")) dept = "lab-mixing";

                result.ValidEmployees.Add(new User
                {
                    Nik = npk,
                    Name = name,
                    Plant = plant,
                    Department = dept,
                    Role = "karyawan",
                    RoleLabel = "Karyawan Quality",
                    IsActive = true,
                    IsUserAdded = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                result.SuccessCount++;
            }
            }

            return result;
        }
    }
}
