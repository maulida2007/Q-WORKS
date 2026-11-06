async function testModalSubmit() {
    let loginPage = await fetch('http://localhost:5000/Auth/Login');
    let cookies = {};
    for (const c of loginPage.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }
    let html = await loginPage.text();
    let token = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)[1];

    let formLogin = new URLSearchParams();
    formLogin.append('__RequestVerificationToken', token);
    formLogin.append('AdminUsername', 'admin');
    formLogin.append('AdminPassword', 'admin123');

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

    let masterPage = await fetch('http://localhost:5000/MasterPekerja', { headers: { 'Cookie': cookieStr } });
    let masterHtml = await masterPage.text();
    let masterToken = masterHtml.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)[1];

    // Simulate modal submit with name='npk' exactly as sent by browser form
    let formAdd = new URLSearchParams();
    formAdd.append('__RequestVerificationToken', masterToken);
    formAdd.append('npk', '7788');
    formAdd.append('name', 'BUDI FORM TEST');
    formAdd.append('plant', 'Plant Hose');

    let resAdd = await fetch('http://localhost:5000/MasterPekerja/Add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
        body: formAdd.toString(),
        redirect: 'manual'
    });
    console.log('Submit Add Status:', resAdd.status, 'Location:', resAdd.headers.get('location'));
    for (const c of resAdd.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }

    let pageAfterAdd = await fetch('http://localhost:5000/MasterPekerja?search=7788', {
        headers: { 'Cookie': Object.entries(cookies).map(([k,v]) => k+'='+v).join('; ') }
    });
    let afterHtml = await pageAfterAdd.text();
    if (afterHtml.includes('BUDI FORM TEST') && afterHtml.includes('7788')) {
        console.log('SUCCESS: Pekerja BUDI FORM TEST (7788) berhasil ditambahkan!');
    } else {
        console.log('FAILED to add worker.');
    }

    // Clean up test workers
    for (const npk of ['7788', '8899']) {
        let resDel = await fetch('http://localhost:5000/MasterPekerja/Delete/' + npk, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
            body: '__RequestVerificationToken=' + encodeURIComponent(masterToken),
            redirect: 'manual'
        });
        console.log('Cleaned test worker ' + npk + ', status: ' + resDel.status);
    }
}
testModalSubmit();
