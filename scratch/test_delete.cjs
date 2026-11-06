async function testDeleteNpk() {
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

    // 1. Add worker with NPK 1111
    let masterPage = await fetch('http://localhost:5000/MasterPekerja', { headers: { 'Cookie': cookieStr } });
    let masterHtml = await masterPage.text();
    let masterToken = masterHtml.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)[1];

    let formAdd = new URLSearchParams();
    formAdd.append('__RequestVerificationToken', masterToken);
    formAdd.append('npk', '1111');
    formAdd.append('name', 'MAULIDA TEST');
    formAdd.append('plant', 'Plant Hose');

    await fetch('http://localhost:5000/MasterPekerja/Add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
        body: formAdd.toString(),
        redirect: 'manual'
    });

    // 2. Now call POST /MasterPekerja/Delete/1111 exactly as the user's form does
    let resDel = await fetch('http://localhost:5000/MasterPekerja/Delete/1111', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
        body: '__RequestVerificationToken=' + encodeURIComponent(masterToken) + '&npk=1111',
        redirect: 'manual'
    });
    console.log('Delete NPK 1111 Status:', resDel.status, 'Location:', resDel.headers.get('location'));

    for (const c of resDel.headers.getSetCookie()) {
        const [k, v] = c.split(';')[0].split('=');
        cookies[k.trim()] = v.trim();
    }

    let pageAfter = await fetch('http://localhost:5000/MasterPekerja', {
        headers: { 'Cookie': Object.entries(cookies).map(([k,v]) => k+'='+v).join('; ') }
    });
    let afterHtml = await pageAfter.text();
    if (afterHtml.includes('berhasil dihapus')) {
        console.log('SUCCESS: Pekerja 1111 berhasil dihapus!');
    } else {
        console.log('FAILED to delete worker. Toast snippet:', afterHtml.substring(afterHtml.indexOf('ToastMessage') - 50, afterHtml.indexOf('ToastMessage') + 100));
    }
}
testDeleteNpk();
