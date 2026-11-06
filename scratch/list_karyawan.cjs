const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('qworks.db');

const rows = db.prepare("SELECT Plant, Nik, Name FROM Users WHERE Role = 'karyawan' ORDER BY Plant, Nik").all();
console.table(rows);
console.log('Total Karyawan Aktif:', rows.length);

