const fs = require('fs');

async function testImport() {
    let loginPage = await fetch('http://localhost:5000/Auth/Login');
    let cookies = {};
    for (const c of loginPage.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }
    let html = await loginPage.text();
    let token = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)[1];

    let formLogin = new URLSearchParams({
        '__RequestVerificationToken': token,
        'AdminUsername': 'admin',
        'AdminPassword': 'admin123'
    });

    let resLogin = await fetch('http://localhost:5000/Auth/LoginAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': Object.entries(cookies).map(([k,v]) => k+'='+v).join('; ') },
        body: formLogin.toString(),
        redirect: 'manual'
    });
    for (const c of resLogin.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }
    let cookieStr = Object.entries(cookies).map(([k,v]) => k+'='+v).join('; ');

    // 1. Download official template to use as test file
    let resTemplate = await fetch('http://localhost:5000/MasterPekerja/DownloadTemplate', {
        headers: { 'Cookie': cookieStr }
    });
    let templateBytes = await resTemplate.arrayBuffer();
    fs.writeFileSync('scratch/template_test.xlsx', Buffer.from(templateBytes));
    console.log('Template downloaded, size:', templateBytes.byteLength);

    // 2. Fetch MasterPekerja for token
    let masterPage = await fetch('http://localhost:5000/MasterPekerja', { headers: { 'Cookie': cookieStr } });
    let masterHtml = await masterPage.text();
    let masterToken = masterHtml.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)[1];

    // 3. Post multipart/form-data with name="file" exactly as sent by browser
    let boundary = '----WebKitFormBoundaryTest123456';
    let fileBuffer = fs.readFileSync('scratch/template_test.xlsx');

    let bodyParts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="__RequestVerificationToken"\r\n\r\n${masterToken}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Template_Master_Pekerja_QWORKS.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
    ];

    let head = Buffer.from(bodyParts[0] + bodyParts[1], 'utf-8');
    let tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    let fullBody = Buffer.concat([head, fileBuffer, tail]);

    let resImport = await fetch('http://localhost:5000/MasterPekerja/ImportExcel', {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Cookie': cookieStr
        },
        body: fullBody,
        redirect: 'manual'
    });

    console.log('Import Status:', resImport.status, 'Location:', resImport.headers.get('location'));
    for (const c of resImport.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }

    let pageAfter = await fetch('http://localhost:5000/MasterPekerja', {
        headers: { 'Cookie': Object.entries(cookies).map(([k,v]) => k+'='+v).join('; ') }
    });
    let afterHtml = await pageAfter.text();
    let toastMatch = afterHtml.match(/id="toastAlert"[\s\S]*?<span>(.*?)<\/span>/i);
    if (toastMatch) {
        console.log('TOAST NOTIFICATION:', toastMatch[1]);
    } else {
        console.log('No toastAlert found. Checking if afterHtml contains toast:');
    }
}
testImport();
