/**
 * 가족 대시보드 동기화 — Apps Script 웹앱 (배포된 코드 사본)
 *
 * 대시보드: https://mechu-ri-al.github.io/mechu-ri-al/family-dashboard/
 * 시트: 🏠 우리 가족 보드 (1YpwNokZIk6z6xV-PVPiyBchvzrTtgnsFJYytryEsmgk)
 * 저장 탭: '🔄 대시보드_상태' — A2 = 상태 JSON, B2 = 마지막 저장 시각 (자동 생성·숨김)
 *
 * 배포: 웹앱 · 실행 주체 "나"(whktlf@gmail.com) · 액세스 "모든 사용자"
 *   GET  → { ok:true, state:{...}, u:"마지막 저장 시각" }
 *   POST → 본문(JSON 상태)을 검증해 저장하고 { ok:true, state:{...}, u:... } 반환
 */
var ID = '1YpwNokZIk6z6xV-PVPiyBchvzrTtgnsFJYytryEsmgk';
var TAB = '🔄 대시보드_상태';

function sh_() {
    var ss = SpreadsheetApp.openById(ID);
    var t = ss.getSheetByName(TAB);
    if (!t) {
        t = ss.insertSheet(TAB);
        t.getRange('A1:B1').setValues([['stateJson', 'updatedAt']]);
        t.setColumnWidth(1, 600);
        try { t.hideSheet(); } catch (e) {}
    }
    return t;
}

function send_(o) {
    var s = JSON.stringify(o);
    var r = ContentService.createTextOutput(s);
    return r.setMimeType(ContentService.MimeType.JSON);
}

function clean_(s) {
    if (!s || typeof s != 'object' || Array.isArray(s)) return null;
    if (!s.members || typeof s.members != 'object') return null;
    var ids = Object.keys(s.members);
    if (!ids.length) return null;
    for (var i = 0; i < ids.length; i++) {
        var d = s.members[ids[i]];
        if (!d || !Array.isArray(d.tasks)) return null;
        for (var j = 0; j < d.tasks.length; j++) {
            if (!d.tasks[j] || typeof d.tasks[j].name != 'string') return null;
        }
        d.xp = Math.max(0, Number(d.xp) || 0);
    }
    if (!Array.isArray(s.family)) s.family = [];
    s.familyXp = Math.max(0, Number(s.familyXp) || 0);
    s.v = 1;
    return s;
}

function read_() {
    var t = sh_();
    var r = String(t.getRange('A2').getValue());
    var st = {};
    if (r) {
        try { st = JSON.parse(r); } catch (x) { st = {}; }
    }
    var u = String(t.getRange('B2').getValue());
    return {ok: true, state: st, u: u};
}

function save_(e) {
    var b = e && e.postData && e.postData.contents;
    if (!b) return {ok: false, error: 'empty'};
    var c = clean_(JSON.parse(b));
    if (!c) return {ok: false, error: 'bad_state'};
    var t = sh_();
    t.getRange('A2').setValue(JSON.stringify(c));
    t.getRange('B2').setValue(new Date());
    return {ok: true, state: c, u: new Date().toISOString()};
}

function doGet(e) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var o;
    try { o = read_(); } catch (x) { o = {ok: false, error: String(x)}; }
    lock.releaseLock();
    return send_(o);
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var o;
    try { o = save_(e); } catch (x) { o = {ok: false, error: String(x)}; }
    lock.releaseLock();
    return send_(o);
}
