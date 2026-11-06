const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('qworks.db');

const validNpks = [
  // HOSE (13)
  '1747','1796','1726','1797','1611','1303','0227','1506','1795','1798','1727','1519','1592',
  // MOLDED (13)
  '1670','1423','1376','1378','1580','1586','1392','1590','1728','1707','1773','1488','1391',
  // SUBCONT (4)
  '0201','0228','1459','1722',
  // LAB MIXING (3)
  '1705','0031','1379',
  // RVI (10)
  '1443','0052','1353','1427','1460','0458','1422','1659','1520','1800',
  // QRE (3)
  '0222','1321','1605'
];

const placeholders = validNpks.map(() => '?').join(',');
const deleteStmt = db.prepare(`DELETE FROM Users WHERE Role = 'karyawan' AND Nik NOT IN (${placeholders})`);
const res = deleteStmt.run(...validNpks);
console.log('Karyawan dihapus:', res.changes);

const remaining = db.prepare("SELECT COUNT(*) as count FROM Users WHERE Role = 'karyawan'").get().count;
console.log('Total Karyawan tersisa:', remaining);

const perPlant = db.prepare("SELECT Plant, COUNT(*) as count FROM Users WHERE Role = 'karyawan' GROUP BY Plant ORDER BY Plant").all();
console.table(perPlant);

