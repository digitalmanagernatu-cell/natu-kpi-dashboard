const TOKEN    = 'pon-aqui-tu-token-secreto';   // ← cámbialo
const SHEET_ID = '10L-7Bygcdv0U0xmAqoL2_6_ialN144xbsR9MBa58Xnw';
const TAB      = 'Conclusiones';

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(TAB) || ss.insertSheet(TAB);
}

function respond(data, callback) {
  const str = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + str + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(str)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p  = e.parameter;
  const cb = p.callback || null;
  if (p.action === 'validate') {
    return respond(p.token === TOKEN ? {ok:true} : {ok:false}, cb);
  }
  if (p.action === 'set') {
    if (p.token !== TOKEN) return respond({ok:false}, cb);
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    let found   = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === p.key) {
        sheet.getRange(i+1, 2).setValue(p.text);
        sheet.getRange(i+1, 3).setValue(new Date().toLocaleString('es-ES'));
        found = true; break;
      }
    }
    if (!found) sheet.appendRow([p.key, p.text, new Date().toLocaleString('es-ES')]);
    return respond({ok:true}, cb);
  }
  const rows = getSheet().getDataRange().getValues();
  const out  = {};
  rows.forEach(r => { if (r[0]) out[r[0]] = r[1] || ''; });
  return respond(out, cb);
}
