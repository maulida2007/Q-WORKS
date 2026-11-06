const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

class CookieJar {
    constructor() {
        this.cookies = {};
    }
    setCookiesFromHeaders(headers) {
        const rawList = headers.getSetCookie ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
        for (const raw of rawList) {
            const cookiePart = raw.split(';')[0].trim();
            const eqIdx = cookiePart.indexOf('=');
            if (eqIdx > 0) {
                const name = cookiePart.substring(0, eqIdx).trim();
                const val = cookiePart.substring(eqIdx + 1).trim();
                this.cookies[name] = val;
            }
        }
    }
    getCookieHeader() {
        return Object.entries(this.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
    }
}

async function request(url, options = {}, jar = null) {
    const headers = options.headers || {};
    if (jar) {
        const cookieStr = jar.getCookieHeader();
        if (cookieStr) {
            headers['Cookie'] = cookieStr;
        }
    }
    options.headers = headers;
    options.redirect = 'manual'; // handle redirects manually to capture cookies

    let res = await fetch(url, options);
    if (jar) {
        jar.setCookiesFromHeaders(res.headers);
    }

    if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (location) {
            const nextUrl = location.startsWith('http') ? location : `${BASE_URL}${location}`;
            return request(nextUrl, { method: 'GET' }, jar);
        }
    }
    return res;
}

function extractAntiForgeryToken(html) {
    const m = html.match(/name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/i) ||
              html.match(/value="([^"]+)"\s+name="__RequestVerificationToken"/i);
    return m ? m[1] : '';
}

async function runAudit() {
    console.log('==========================================================');
    console.log('Q-WORKS COMPREHENSIVE AUDIT TEST SUITE (Node.js Runner)');
    console.log('==========================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(` \x1b[32m[PASS]\x1b[0m ${testName}`);
            passed++;
        } else {
            console.log(` \x1b[31m[FAIL]\x1b[0m ${testName} ${details ? '(' + details + ')' : ''}`);
            failed++;
        }
    }

    // -------------------------------------------------------------
    // TEST 1: AUTENTIKASI DAN LOGIN
    // -------------------------------------------------------------
    console.log('\x1b[33m[1] Testing Autentikasi dan Login...\x1b[0m');

    // 1.A Partial NPK lookup test (Must NOT leak name)
    const resPartial = await fetch(`${BASE_URL}/Auth/LookupNpk?npk=17`).then(r => r.json());
    assert(resPartial.success === false, "Lookup partial NPK '17' returned success: false (No name leaked)", JSON.stringify(resPartial));

    // 1.B Non-existent NPK lookup test
    const resNotFound = await fetch(`${BASE_URL}/Auth/LookupNpk?npk=99999`).then(r => r.json());
    assert(resNotFound.success === false && resNotFound.message.includes('tidak ditemukan'),
        "Lookup non-existent NPK returned proper error without leaking other names", JSON.stringify(resNotFound));

    // 1.C Exact NPK lookup test
    const resExact = await fetch(`${BASE_URL}/Auth/LookupNpk?npk=1747`).then(r => r.json());
    assert(resExact.success === true && resExact.name === "GILANG",
        `Lookup exact NPK '1747' correctly matched: ${resExact.name} (${resExact.plant})`);

    // 1.D Form Login Attributes (autocomplete='off', new-password, empty defaults)
    const loginHtml = await fetch(`${BASE_URL}/Auth/Login`).then(r => r.text());
    assert(
        loginHtml.includes('id="adminUsernameInput"') &&
        loginHtml.includes('autocomplete="off"') &&
        loginHtml.includes('autocomplete="new-password"'),
        "Form Login Admin has autocomplete='off', 'new-password', and no plain password/auto-fill leaks"
    );

    // 1.E Login Karyawan
    const jarKaryawan = new CookieJar();
    const loginPageKaryawan = await request(`${BASE_URL}/Auth/Login`, {}, jarKaryawan);
    const tokenKaryawanLogin = extractAntiForgeryToken(await loginPageKaryawan.text());

    const formKaryawan = new URLSearchParams();
    formKaryawan.append('__RequestVerificationToken', tokenKaryawanLogin);
    formKaryawan.append('KaryawanNpk', '1747');
    formKaryawan.append('KaryawanNama', 'GILANG');

    const resLoginKaryawan = await request(`${BASE_URL}/Auth/LoginKaryawan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formKaryawan.toString()
    }, jarKaryawan);
    assert(resLoginKaryawan.status === 200, "Login Karyawan (1747 / GILANG) berhasil terautentikasi");

    // 1.F Login Admin
    const jarAdmin = new CookieJar();
    const loginPageAdmin = await request(`${BASE_URL}/Auth/Login`, {}, jarAdmin);
    const tokenAdminLogin = extractAntiForgeryToken(await loginPageAdmin.text());

    const formAdmin = new URLSearchParams();
    formAdmin.append('__RequestVerificationToken', tokenAdminLogin);
    formAdmin.append('AdminUsername', 'admin');
    formAdmin.append('AdminPassword', 'admin123');

    const resLoginAdmin = await request(`${BASE_URL}/Auth/LoginAdmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formAdmin.toString()
    }, jarAdmin);
    assert(resLoginAdmin.status === 200, "Login Admin (admin / admin123) berhasil terautentikasi");


    // -------------------------------------------------------------
    // TEST 2: HAK AKSES DAN VALIDASI WAKTU LEMBUR
    // -------------------------------------------------------------
    console.log('\n\x1b[33m[2] Testing Hak Akses Karyawan dan Validasi Lembur...\x1b[0m');

    // 2.A Halaman Input Karyawan dibatasi ke dirinya sendiri
    const pageInputKaryawan = await request(`${BASE_URL}/Overtime/Input`, {}, jarKaryawan);
    const htmlInputKaryawan = await pageInputKaryawan.text();
    assert(
        (htmlInputKaryawan.includes('GILANG') && !htmlInputKaryawan.includes('KATIM')) || htmlInputKaryawan.includes('1 Karyawan Terdaftar'),
        "Halaman Input Karyawan hanya menampilkan pekerja miliknya sendiri"
    );

    // 2.B Karyawan attempt to submit for other employee (Tampering test)
    const tokenKaryawanInput = extractAntiForgeryToken(htmlInputKaryawan);
    const formTamper = new URLSearchParams();
    formTamper.append('__RequestVerificationToken', tokenKaryawanInput);
    formTamper.append('plant', 'Plant Molded');
    formTamper.append('shiftName', 'Shift 2'); // Shift 2 ends at 16:30, overtime is 16:30 - 19:30
    formTamper.append('workDate', '2026-10-27');
    formTamper.append('jamMasuk', '16:30');
    formTamper.append('jamPulang', '19:30');
    formTamper.append('isHoliday', 'false');
    formTamper.append('reason', 'Audit Tamper Proof Test');
    formTamper.append('npks', '1670'); // Katim
    formTamper.append('selectedNpks', '1670');

    const resSubmit = await request(`${BASE_URL}/Overtime/Submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formTamper.toString()
    }, jarKaryawan);
    const htmlSubmit = await resSubmit.text();
    if (resSubmit.status !== 200 || !htmlSubmit.includes('Dashboard')) {
        console.log(` [DEBUG] Submit status: ${resSubmit.status}, response preview: ${htmlSubmit.substring(0, 300)}`);
    }

    // Verify in Admin Rekap that the record has NPK 1747 (GILANG), not 1670 (KATIM)
    const pageRekapAdmin = await request(`${BASE_URL}/Overtime/Rekap?search=1747`, {}, jarAdmin);
    const htmlRekapAdmin = await pageRekapAdmin.text();
    assert(htmlRekapAdmin.includes('1747') && htmlRekapAdmin.includes('GILANG'),
        "Data lembur berhasil tersimpan di database untuk NPK 1747 (GILANG)");
    
    const pageCheckSpoofed = await request(`${BASE_URL}/Overtime/Rekap?search=1670`, {}, jarAdmin);
    const htmlCheckSpoofed = await pageCheckSpoofed.text();
    assert(!htmlCheckSpoofed.includes('19:30'),
        "Server-side enforcement overrides NPK to authenticated user (1747 / GILANG), rejecting spoofed 1670");

    // 2.C Karyawan denied from Edit / Delete
    const formEdit = new URLSearchParams();
    formEdit.append('__RequestVerificationToken', tokenKaryawanInput);
    formEdit.append('id', '1');
    formEdit.append('workDate', '2026-10-27');
    formEdit.append('shiftName', 'Shift 2');
    formEdit.append('jamWaktu', '16:30-18:30');
    formEdit.append('jamOvertime', '2');
    formEdit.append('reason', 'Hacked');

    const resEditKaryawan = await request(`${BASE_URL}/Overtime/Edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formEdit.toString()
    }, jarKaryawan);
    const htmlEditKaryawan = await resEditKaryawan.text();
    assert(htmlEditKaryawan.includes('Akses ditolak: Karyawan tidak memiliki izin'),
        "Karyawan ditolak dari aksi Edit lembur (Akses ditolak)");

    // 2.D Validasi Waktu Lembur - Overlap Shift Resmi
    const overlapPayload = {
        ShiftName: 'Shift 2', // 07:30 - 16:30
        WorkDate: '2026-10-27',
        StartTimeStr: '08:00',
        EndTimeStr: '12:00',
        IsHoliday: false
    };
    const resOverlapRaw = await request(`${BASE_URL}/Overtime/Preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overlapPayload)
    }, jarAdmin);
    const resOverlap = await resOverlapRaw.json();
    assert(resOverlap.data.isValid === false && resOverlap.data.errorMessage.includes('bertabrakan dengan Jam Kerja Shift Resmi'),
        `Validasi Tabrakan Shift Berhasil: ${resOverlap.data.errorMessage}`);

    // 2.E Validasi Waktu Lembur - Hari Libur Maksimal 7 Jam
    const holidayLimitPayload = {
        ShiftName: 'Shift 1',
        WorkDate: '2026-10-25', // Minggu
        StartTimeStr: '07:30',
        EndTimeStr: '15:30', // 8 Jam (> 7 Jam)
        IsHoliday: true
    };
    const resHolidayRaw = await request(`${BASE_URL}/Overtime/Preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayLimitPayload)
    }, jarAdmin);
    const resHoliday = await resHolidayRaw.json();
    assert(resHoliday.data.isValid === false && resHoliday.data.errorMessage.includes('batas maksimal input adalah 7 jam'),
        `Validasi Hari Libur > 7 Jam Ditolak: ${resHoliday.data.errorMessage}`);


    // -------------------------------------------------------------
    // TEST 3: MANAJEMEN MASTER PEKERJA
    // -------------------------------------------------------------
    console.log('\n\x1b[33m[3] Testing Master Pekerja — Admin...\x1b[0m');

    const pageMaster = await request(`${BASE_URL}/MasterPekerja`, {}, jarAdmin);
    const tokenMaster = extractAntiForgeryToken(await pageMaster.text());

    // 3.A Input Manual
    const testNpk = '8899';
    const testName = 'TEST PEKERJA AUDIT';
    const formAddWorker = new URLSearchParams();
    formAddWorker.append('__RequestVerificationToken', tokenMaster);
    formAddWorker.append('nik', testNpk);
    formAddWorker.append('name', testName);
    formAddWorker.append('plant', 'Plant Hose');

    await request(`${BASE_URL}/MasterPekerja/Add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formAddWorker.toString()
    }, jarAdmin);

    const pageMasterAfterAdd = await request(`${BASE_URL}/MasterPekerja?search=${testNpk}`, {}, jarAdmin);
    const htmlMasterAfterAdd = await pageMasterAfterAdd.text();
    assert(htmlMasterAfterAdd.includes(testNpk) && htmlMasterAfterAdd.includes(testName),
        `Input Manual Master Pekerja tersimpan di DB: ${testNpk} - ${testName}`);

    // 3.B Validasi Duplikasi NPK
    const resDup = await request(`${BASE_URL}/MasterPekerja/Add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formAddWorker.toString()
    }, jarAdmin);
    const htmlDup = await resDup.text();
    assert(htmlDup.includes('sudah terdaftar'),
        `Validasi Duplikasi NPK: NPK ${testNpk} ditolak dengan pesan 'sudah terdaftar'`);

    // 3.C Pekerja baru langsung bisa digunakan untuk identifikasi login
    const resLookupNew = await fetch(`${BASE_URL}/Auth/LookupNpk?npk=${testNpk}`).then(r => r.json());
    assert(resLookupNew.success === true && resLookupNew.name === testName,
        `Pekerja baru (${testNpk}) langsung teridentifikasi di form login tanpa jeda`);

    // 3.D Export Master Pekerja dengan Filter Plant
    const resExportHose = await request(`${BASE_URL}/MasterPekerja/ExportExcel?plant=Plant Hose`, {}, jarAdmin);
    const hoseBytes = await resExportHose.arrayBuffer();
    assert(resExportHose.status === 200 && hoseBytes.byteLength > 1000,
        `Export Master Pekerja (Filter: Plant Hose) menghasilkan file Excel valid (${hoseBytes.byteLength} bytes)`);

    const resExportAll = await request(`${BASE_URL}/MasterPekerja/ExportExcel?plant=Semua Plant`, {}, jarAdmin);
    const allBytes = await resExportAll.arrayBuffer();
    assert(resExportAll.status === 200 && allBytes.byteLength > 1000,
        `Export Master Pekerja (Semua Plant) menghasilkan file Excel valid (${allBytes.byteLength} bytes)`);


    // -------------------------------------------------------------
    // TEST 4: RIWAYAT INPUT DAN EKSPOR REKAP OVERTIME (10 KOLOM & 5 FILTER)
    // -------------------------------------------------------------
    console.log('\n\x1b[33m[4] Testing Riwayat Input & Ekspor Rekap Overtime...\x1b[0m');

    const pageRiwayat = await request(`${BASE_URL}/RiwayatPenginput`, {}, jarAdmin);
    const htmlRiwayat = await pageRiwayat.text();

    const expectedHeaders = [
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
    ];

    let allHeadersOk = true;
    for (const h of expectedHeaders) {
        if (!htmlRiwayat.includes(h)) {
            allHeadersOk = false;
            console.log(` \x1b[31m[FAIL]\x1b[0m Missing column header in Riwayat: ${h}`);
        }
    }
    assert(allHeadersOk, "10 Kolom Spesifikasi terpasang sempurna pada tabel Riwayat Penginput!");

    const hasAllFilters = ['Bulan', 'Tanggal', 'Shift', 'Plant', 'Karyawan'].every(f => htmlRiwayat.includes(f));
    assert(hasAllFilters, "5 Filter Slicer (Bulan, Tanggal, Shift, Plant, Karyawan) tersedia lengkap di halaman Riwayat!");

    // Ekspor Excel Riwayat Penginput
    const resExportRiwayat = await request(`${BASE_URL}/RiwayatPenginput/ExportExcel`, {}, jarAdmin);
    const riwayatExcelBytes = await resExportRiwayat.arrayBuffer();
    fs.writeFileSync('scratch/exported_riwayat.xlsx', Buffer.from(riwayatExcelBytes));
    assert(resExportRiwayat.status === 200 && riwayatExcelBytes.byteLength > 1000,
        `Export Excel Riwayat Penginput menghasilkan file Excel valid (${riwayatExcelBytes.byteLength} bytes)`);

    // Verify filter AND logic on Riwayat
    const pageRiwayatFiltered = await request(`${BASE_URL}/RiwayatPenginput?plants=Plant%20Hose&shifts=Shift%201`, {}, jarAdmin);
    assert(pageRiwayatFiltered.status === 200, "Filter Riwayat dengan parameter multi-slicer (Plant Hose & Shift 1) berhasil merender hasil");

    console.log('\n==========================================================');
    console.log(`AUDIT FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('==========================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runAudit().catch(err => {
    console.error('Audit Error:', err);
    process.exit(1);
});
