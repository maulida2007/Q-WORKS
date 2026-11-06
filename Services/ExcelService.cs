using System;
using System.Collections.Generic;
using System.IO;
using ClosedXML.Excel;
using QWorks.Models;

namespace QWorks.Services
{
    public interface IExcelService
    {
        byte[] ExportMasterPekerja(List<User> employees);
        byte[] ExportRekapOvertime(List<OvertimeRequest> records);
        byte[] ExportRiwayatPenginput(List<OvertimeRequest> records);
        byte[] GetMasterPekerjaTemplate();
        List<User> ParseMasterPekerjaExcel(Stream stream);
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
                "No", "No. Pengajuan", "Tanggal", "Nama Karyawan", "NPK", "Plant",
                "Shift", "Jam Waktu", "Jam Overtime", "Tipe Hari", "Total TUL",
                "Tipe Lembur", "Status", "Alasan / Kegiatan", "Diajukan Oleh", "Waktu Input"
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

                ws.Cell(row, 2).Value = r.RequestNumber;
                ws.Cell(row, 3).Value = r.WorkDate.ToString("dd/MM/yyyy");
                ws.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 4).Value = r.UserName;
                ws.Cell(row, 5).SetValue(r.UserNpk);
                ws.Cell(row, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Cell(row, 6).Value = r.Plant;
                ws.Cell(row, 7).Value = r.ShiftName;
                ws.Cell(row, 8).Value = r.JamWaktu;

                ws.Cell(row, 9).Value = r.JamOvertime;
                ws.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 10).Value = r.IsHoliday ? "Hari Libur" : "Hari Kerja";
                ws.Cell(row, 11).Value = r.TotalTul;
                ws.Cell(row, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 12).Value = r.OvertimeTypeLabel;
                ws.Cell(row, 13).Value = r.Status;
                ws.Cell(row, 14).Value = r.Reason;
                ws.Cell(row, 15).Value = r.CreatedByName ?? r.UserName;
                ws.Cell(row, 16).Value = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");

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

            string[] headers = {
                "No", "Waktu Penginputan", "Nama Penginput", "NPK Penginput", "Role Penginput", "Plant Penginput",
                "Nama Karyawan Lembur", "NPK Karyawan", "Plant Lembur", "Shift", "Tanggal Lembur",
                "Jam Lembur", "Total TUL", "Status Lembur"
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

                ws.Cell(row, 2).Value = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                ws.Cell(row, 3).Value = r.CreatedByName ?? r.UserName;
                ws.Cell(row, 4).SetValue(r.CreatedByNpk ?? r.UserNpk);
                ws.Cell(row, 5).Value = r.CreatedByRole ?? "karyawan";
                ws.Cell(row, 6).Value = r.CreatedByPlant ?? r.Plant;

                ws.Cell(row, 7).Value = r.UserName;
                ws.Cell(row, 8).SetValue(r.UserNpk);
                ws.Cell(row, 9).Value = r.Plant;
                ws.Cell(row, 10).Value = r.ShiftName;
                ws.Cell(row, 11).Value = r.WorkDate.ToString("yyyy-MM-dd");

                ws.Cell(row, 12).Value = r.JamOvertime;
                ws.Cell(row, 12).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 13).Value = r.TotalTul;
                ws.Cell(row, 13).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                ws.Cell(row, 14).Value = r.Status;

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
            var result = new List<User>();
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheet(1);

            int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            if (lastRow < 2) return result;

            // Find column indices
            int npkCol = 1;
            int nameCol = 2;
            int plantCol = 3;

            for (int c = 1; c <= 10; c++)
            {
                string header = ws.Cell(1, c).GetString().Trim().ToUpperInvariant();
                if (header.Contains("NPK") || header.Contains("NIK")) npkCol = c;
                else if (header.Contains("NAMA") || header.Contains("NAME")) nameCol = c;
                else if (header.Contains("PLANT") || header.Contains("DEPT")) plantCol = c;
            }

            for (int r = 2; r <= lastRow; r++)
            {
                string npk = ws.Cell(r, npkCol).GetString().Trim().ToUpperInvariant();
                string name = ws.Cell(r, nameCol).GetString().Trim();
                string plant = ws.Cell(r, plantCol).GetString().Trim();

                if (string.IsNullOrWhiteSpace(npk) || string.IsNullOrWhiteSpace(name))
                    continue;

                if (!plant.StartsWith("Plant ", StringComparison.OrdinalIgnoreCase))
                {
                    plant = "Plant " + plant;
                }

                string dept = plant.ToLowerInvariant().Replace("plant ", "").Trim();
                if (dept.Contains("lab")) dept = "lab-mixing";

                result.Add(new User
                {
                    Nik = npk,
                    Name = name,
                    Plant = plant,
                    Department = dept,
                    Role = "karyawan",
                    RoleLabel = "Karyawan Quality",
                    IsActive = true,
                    IsUserAdded = true
                });
            }

            return result;
        }
    }
}
