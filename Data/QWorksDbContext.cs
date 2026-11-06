using Microsoft.EntityFrameworkCore;
using QWorks.Models;

namespace QWorks.Data
{
    public class QWorksDbContext : DbContext
    {
        public QWorksDbContext(DbContextOptions<QWorksDbContext> options) : base(options)
        {
        }

        public DbSet<Shift> Shifts { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<OvertimeRequest> OvertimeRequests { get; set; } = null!;
        public DbSet<ApprovalLog> ApprovalLogs { get; set; } = null!;
        public DbSet<SystemSetting> SystemSettings { get; set; } = null!;
        public DbSet<NotificationItem> NotificationItems { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQL Server: TimeSpan columns stored as TIME(7)
            modelBuilder.Entity<Shift>()
                .Property(s => s.StartTime)
                .HasColumnType("time");

            modelBuilder.Entity<Shift>()
                .Property(s => s.EndTime)
                .HasColumnType("time");

            modelBuilder.Entity<Shift>().HasIndex(s => s.ShiftName).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Nik).IsUnique();
            modelBuilder.Entity<OvertimeRequest>().HasIndex(o => o.RequestNumber).IsUnique();
            modelBuilder.Entity<OvertimeRequest>().HasIndex(o => o.WorkDate);
            modelBuilder.Entity<OvertimeRequest>().HasIndex(o => o.Plant);
            modelBuilder.Entity<OvertimeRequest>().HasIndex(o => o.Status);
            modelBuilder.Entity<ApprovalLog>().HasIndex(a => a.OvertimeRequestId);
        }
    }
}
