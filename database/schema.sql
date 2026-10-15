-- =========================================================================
-- Q-WORKS OVERTIME MANAGEMENT DATABASE SCHEMA
-- Compatible with PostgreSQL, MySQL 8.0+, SQL Server, and SQLite
-- =========================================================================

-- 1. TABEL SHIFTS (Master Jadwal Shift Perusahaan)
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    shift_name VARCHAR(50) NOT NULL UNIQUE,     -- 'Shift 1', 'Shift 2'
    description VARCHAR(100),                   -- 'Shift Malam (Overnight)', 'Shift Pagi'
    start_time TIME NOT NULL,                    -- '22:30:00' atau '07:30:00'
    end_time TIME NOT NULL,                      -- '07:30:00' atau '16:30:00'
    is_overnight BOOLEAN DEFAULT FALSE,          -- TRUE untuk Shift 1 (melewati tengah malam)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL USERS (Master Pekerja, Approver & Supervisor)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(30) UNIQUE NOT NULL,             -- 'NPK-8801'
    name VARCHAR(100) NOT NULL,                  -- 'Budi Santoso'
    email VARCHAR(100) UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE',-- 'EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN'
    department VARCHAR(50) NOT NULL,             -- 'molded', 'rvi', 'btr', 'tpe', 'hose'
    plant VARCHAR(50) NOT NULL,                  -- 'Plant Molded', 'Plant RVI', etc.
    default_shift_id INT REFERENCES shifts(id) ON DELETE SET NULL,
    supervisor_id INT REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL OVERTIME_REQUESTS (Transaksi Pengajuan Lembur)
CREATE TABLE IF NOT EXISTS overtime_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,  -- 'OT-20260908-001'
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shift_id INT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    
    work_date DATE NOT NULL,                     -- Tanggal dasar shift kerja
    overtime_type VARCHAR(30) NOT NULL,          -- 'PRE_SHIFT', 'POST_SHIFT', 'OFF_DAY'
    
    -- Rentang waktu lembur aktual
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Hasil kalkulasi sistem
    raw_duration_minutes INT NOT NULL,           -- Total menit kotor di luar shift
    is_tolerance BOOLEAN DEFAULT FALSE,          -- TRUE jika < 30 menit (dianggap toleransi)
    counted_duration_minutes INT NOT NULL,       -- Menit lembur sah (0 jika is_tolerance = TRUE)
    jam_overtime NUMERIC(5, 2) NOT NULL,         -- Jam lembur sah (misal 2.00, 1.50)
    total_tul NUMERIC(6, 2) NOT NULL,            -- Nilai TUL (Tunjangan Uang Lembur)
    
    is_holiday BOOLEAN DEFAULT FALSE,            -- TRUE jika weekend / hari libur
    day_type VARCHAR(20) DEFAULT 'kerja',        -- 'kerja', 'libur'
    
    reason TEXT NOT NULL,                        -- Deskripsi tugas / alasan lembur
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',-- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
    
    -- Data Approver Terakhir
    approver_id INT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL APPROVAL_LOGS (Audit Trail Persetujuan & Penolakan)
CREATE TABLE IF NOT EXISTS approval_logs (
    id SERIAL PRIMARY KEY,
    overtime_request_id INT NOT NULL REFERENCES overtime_requests(id) ON DELETE CASCADE,
    actor_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(30) NOT NULL,                 -- 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INDEKS OPTIMASI QUERY
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_ot_requests_user ON overtime_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ot_requests_date ON overtime_requests(work_date);
CREATE INDEX IF NOT EXISTS idx_ot_requests_status ON overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_ot_requests_type ON overtime_requests(overtime_type);
CREATE INDEX IF NOT EXISTS idx_approval_logs_request ON approval_logs(overtime_request_id);

-- =========================================================================
-- SEED DATA AWAL
-- =========================================================================
INSERT INTO shifts (shift_name, description, start_time, end_time, is_overnight) VALUES
('Shift 1', 'Shift 1 Malam Lintas Hari (22:30 - 07:30)', '22:30:00', '07:30:00', TRUE),
('Shift 2', 'Shift 2 Pagi Reguler (07:30 - 16:30)', '07:30:00', '16:30:00', FALSE)
ON CONFLICT (shift_name) DO NOTHING;
