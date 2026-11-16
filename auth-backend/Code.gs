const SPREADSHEET_ID = '1mAwMQr5byOsyay6Uj42-HFEHas5Aw0977K-EvtuQeNs';
const AUTHORIZED_SHEET = 'AUTORIZADOS';
const FIREBASE_API_KEY_PROPERTY = 'FIREBASE_WEB_API_KEY';
const DASHBOARD_ORIGIN = 'https://leoncioandre-ux.github.io';
const ADMIN_EMAIL = 'leoncio.andre@gmail.com';

function doGet(e) {
  if (e && e.parameter && e.parameter.mode === 'bridge') {
    return HtmlService.createHtmlOutputFromFile('Bridge')
      .setTitle('Autenticação — Mapa de Demanda')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return jsonOutput_({ ok: false, error: 'Acesso direto não permitido.' });
}

function getDashboardData(idToken, sheetName) {
  const identity = verifyFirebaseToken_(idToken);
  const email = String(identity.email || '').trim().toLowerCase();
  if (!identity.emailVerified) throw new Error('A conta Google precisa ter e-mail verificado.');
  if (!isAuthorized_(email)) throw new Error('Este e-mail não está autorizado a acessar o Mapa de Demanda.');

  const allowedSheets = ['data_rede_geral_dash', 'data_listaespera'];
  const name = allowedSheets.includes(String(sheetName || 'data_rede_geral_dash'))
    ? String(sheetName || 'data_rede_geral_dash')
    : 'data_rede_geral_dash';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error('Aba não encontrada: ' + name);
  return {
    ok: true,
    email: email,
    data: sheet.getDataRange().getValues()
  };
}

function verifyFirebaseToken_(idToken) {
  if (!idToken || typeof idToken !== 'string') throw new Error('Token de autenticação ausente.');
  const apiKey = PropertiesService.getScriptProperties().getProperty(FIREBASE_API_KEY_PROPERTY);
  if (!apiKey) throw new Error('Configure a propriedade FIREBASE_WEB_API_KEY no Apps Script.');
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey);
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  const body = JSON.parse(response.getContentText() || '{}');
  if (status !== 200 || !body.users || !body.users.length) {
    throw new Error('Sessão Google inválida ou expirada. Entre novamente.');
  }
  const user = body.users[0];
  return {
    email: user.email || '',
    emailVerified: user.emailVerified === true,
    uid: user.localId || ''
  };
}

function isAuthorized_(email) {
  if (email === ADMIN_EMAIL) return true;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(AUTHORIZED_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(v => String(v).trim().toLowerCase());
  const emailCol = headers.indexOf('email');
  const activeCol = headers.indexOf('ativo');
  if (emailCol < 0 || activeCol < 0) throw new Error('A aba AUTORIZADOS precisa ter as colunas Email e Ativo.');
  return rows.some(row =>
    String(row[emailCol] || '').trim().toLowerCase() === email &&
    (row[activeCol] === true || String(row[activeCol]).trim().toLowerCase() === 'sim' || String(row[activeCol]).trim().toLowerCase() === 'true')
  );
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Execute manualmente uma única vez para criar a aba de controle.
 * Depois proteja a aba AUTORIZADOS e mantenha a edição restrita ao administrador.
 */
function configurarAbaAutorizados() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(AUTHORIZED_SHEET);
  if (!sheet) sheet = ss.insertSheet(AUTHORIZED_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([['Email', 'Nome', 'Perfil', 'Ativo']]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 4);
  }
}
