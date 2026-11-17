/**
 * 🏠 우리 가족 보드 — 가족 대시보드 실시간 동기화 API
 * 대시보드: https://mechu-ri-al.github.io/mechu-ri-al/family-dashboard/
 * 저장 탭: '🔄 대시보드_상태'  (A2 = 상태 JSON, B2 = 마지막 저장 시각)
 *
 * GET  ?callback=fn  ->  저장된 상태 JSON (callback 이 있으면 JSONP)
 * POST               ->  body 의 JSON 을 검증해 저장하고 최신 상태를 돌려줌
 */
var SHEET_ID = '1YpwNokZIk6z6xV-PVPiyBchvzrTtgnsFJYytryEsmgk';
var TAB = '🔄 대시보드_상태';
var MAX_BODY = 200000;

function sh_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.getRange(1, 1, 1, 2).setValues([['stateJson', 'updatedAt']]);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
    sh.setColumnWidth(1, 640);
    sh.getRange('B2').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    try { sh.hideSheet(); } catch (e) {}
  }
  return sh;
}

function out_(o, cb) {
  var b = JSON.stringify(o);
  if (cb && /^[A-Za-z_][A-Za-z0-9_$.]*$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + b + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(b).setMimeType(ContentService.MimeType.JSON);
}

function txt_(v, n) {
  var s = (v === null || v === undefined) ? '' : String(v);
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) : s;
}

function num_(v, d) {
  var n = Number(v);
  if (!isFinite(n) || n < 0) n = d;
  return Math.round(n);
}

function id_(v) {
  var s = txt_(v, 60);
  return s ? s : 'x' + Math.random().toString(36).slice(2, 10);
}

function tasks_(list) {
  var out = [];
  if (!list || !list.length) return out;
  for (var i = 0; i < list.length && i < 300; i++) {
    var t = list[i];
    if (!t) continue;
    var nm = txt_(t.name, 120);
    if (!nm) continue;
    out.push({ id: id_(t.id), name: nm, done: !!t.done, xp: num_(t.xp, 10) });
  }
  return out;
}

function clean_(s) {
  if (!s || typeof s !== 'object' || Object.prototype.toString.call(s) === '[object Array]') return null;
  var o = {
    v: 1,
    date: txt_(s.date, 20),
    members: {},
    family: [],
    familyXp: num_(s.familyXp, 0),
    cheer: num_(s.cheer, 0)
  };
  var mem = (s.members && typeof s.members === 'object') ? s.members : {};
  var keys = Object.keys(mem).slice(0, 12);
  for (var i = 0; i < keys.length; i++) {
    var m = mem[keys[i]];
    if (!m || typeof m !== 'object') continue;
    o.members[txt_(keys[i], 40)] = { xp: num_(m.xp, 0), tasks: tasks_(m.tasks) };
  }
  var fam = s.family;
  if (fam && fam.length) {
    for (var j = 0; j < fam.length && j < 300; j++) {
      var f = fam[j];
      if (!f) continue;
      var nm = txt_(f.name, 120);
      if (!nm) continue;
      o.family.push({ id: id_(f.id), name: nm, done: !!f.done, xp: num_(f.xp, 20) });
    }
  }
  if (!o.date) o.date = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  return o;
}

function doGet(e) {
  var cb = (e && e.parameter && e.parameter.callback) || '';
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) {}
  try {
    var sh = sh_();
    var raw = String(sh.getRange('A2').getValue() || '').trim();
    var st = {};
    if (raw) { try { st = JSON.parse(raw); } catch (e2) { st = {}; } }
    var stamp = sh.getRange('B2').getValue();
    var at = 0;
    if (stamp) { try { at = new Date(stamp).getTime() || 0; } catch (e3) { at = 0; } }
    return out_({ ok: true, updatedAt: at, state: st, serverTime: new Date().toISOString() }, cb);
  } catch (err2) {
    return out_({ ok: false, error: String(err2) }, cb);
  } finally {
    try { lock.releaseLock(); } catch (e4) {}
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) {}
  try {
    var body = (e && e.postData && e.postData.contents) || '';
    if (!body) return out_({ ok: false, error: 'empty_body' });
    if (body.length > MAX_BODY) return out_({ ok: false, error: 'too_large' });
    var parsed;
    try { parsed = JSON.parse(body); } catch (e2) { return out_({ ok: false, error: 'bad_json' }); }
    var clean = clean_(parsed && parsed.state ? parsed.state : parsed);
    if (!clean) return out_({ ok: false, error: 'bad_state' });
    var now = new Date();
    var sh = sh_();
    sh.getRange('A2').setValue(JSON.stringify(clean));
    sh.getRange('B2').setValue(now);
    return out_({ ok: true, updatedAt: now.getTime(), state: clean, serverTime: now.toISOString() });
  } catch (err2) {
    return out_({ ok: false, error: String(err2) });
  } finally {
    try { lock.releaseLock(); } catch (e4) {}
  }
}

function checkState() {
  var sh = sh_();
  var raw = String(sh.getRange('A2').getValue() || '').trim();
  var st = raw ? JSON.parse(raw) : {};
  var o = { tab: TAB, members: Object.keys(st.members || {}), familyCount: (st.family || []).length, date: st.date || '', updatedAt: String(sh.getRange('B2').getValue() || '') };
  Logger.log(JSON.stringify(o));
  return o;
}
