// ============================================================
// PARCHE — pegar estas funciones en Code.gs del Apps Script
// reemplazando las versiones originales de emptyAds,
// fetchAdsMetrics (solo el return final), buildRow y upsertRow
// ============================================================

// 1. emptyAds — añade _isReal: false
function emptyAds() {
  return { clicks: 0, ctr: 0, avgCpc: 0, costMicros: 0, conversions: 0, _isReal: false };
}

// 2. En fetchAdsMetrics, el return del bloque de éxito añade _isReal: true
// Sustituye el return final del bloque try (antes del catch):
//
//   return {
//     clicks,
//     ctr:        count > 0 ? ctrSum / count : 0,
//     avgCpc:     costMicros > 0 && clicks > 0 ? (costMicros / 1000000) / clicks : 0,
//     costMicros,
//     conversions,
//     _isReal: true,          // ← AÑADIR ESTA LÍNEA
//   };

// 3. buildRow — deja columnas Ads vacías si los datos no son reales
function buildRow(label, campana, ga4, ads, pd, includeLeads, market, isMarca) {
  const hasAds = ads._isReal !== false;

  const inversion    = hasAds ? ads.costMicros / 1000000 : '';
  const cpl          = hasAds && ads.conversions > 0
                        ? (ads.costMicros / 1000000) / ads.conversions
                        : '';

  const leads        = includeLeads ? (pd.leads        || 0) : '';
  const infoEnv      = includeLeads ? (pd.infoEnviada  || 0) : '';
  const muestras     = includeLeads ? (pd.muestras     || 0) : '';
  const convertidos  = includeLeads ? (pd.convertidos  || 0) : '';
  const interesadoPL = isMarca      ? (pd.interesadoPL || 0) : '';
  const exploratorio = includeLeads ? (pd.exploratorio || 0) : '';
  const viable       = includeLeads ? (pd.viable       || 0) : '';
  const caliente     = includeLeads ? (pd.caliente     || 0) : '';
  const noViable     = includeLeads ? (pd.noViable     || 0) : '';

  const row = new Array(22).fill('');
  row[COL.MES]          = label;
  row[COL.CAMPANA]      = campana;
  row[COL.SESIONES]     = ga4.sessions             || 0;
  row[COL.USUARIOS]     = ga4.totalUsers            || 0;
  row[COL.EVENTOS]      = ga4.eventCount            || 0;
  row[COL.REBOTE]       = ga4.bounceRate            || 0;
  row[COL.DURACION]     = ga4.avgSessionDuration    || 0;
  // Ads — solo si hay datos reales (evita sobreescribir lo del Google Ads Script)
  row[COL.CLICS]        = hasAds ? (ads.clicks      || 0) : '';
  row[COL.CTR]          = hasAds ? (ads.ctr         || 0) : '';
  row[COL.CPC]          = hasAds ? (ads.avgCpc      || 0) : '';
  row[COL.INVERSION]    = inversion;
  row[COL.CONVERSIONES] = hasAds ? (ads.conversions || 0) : '';
  row[COL.CPL]          = cpl;
  // Pipedrive
  row[COL.LEADS]        = leads;
  row[COL.INFO_ENV]     = infoEnv;
  row[COL.MUESTRAS]     = muestras;
  row[COL.CONVERTIDOS]  = convertidos;
  row[COL.INTER_PL]     = interesadoPL;
  row[COL.EXPLORATORIO] = exploratorio;
  row[COL.VIABLE]       = viable;
  row[COL.CALIENTE]     = caliente;
  row[COL.NO_VIABLE]    = noViable;

  return row;
}

// 4. upsertRow — actualización parcial: no sobreescribe celdas con valor existente
//    si la nueva fila trae '' en esa posición
function upsertRow(sheet, rowData) {
  const label    = rowData[COL.MES];
  const campName = rowData[COL.CAMPANA];
  const lastRow  = sheet.getLastRow();

  if (lastRow > 1) {
    const vals = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < vals.length; i++) {
      if (vals[i][0] === label && vals[i][1] === campName) {
        // Leer fila existente y mezclar: nuevo valor solo si no es cadena vacía
        const existing = sheet.getRange(i + 2, 1, 1, rowData.length).getValues()[0];
        const merged   = rowData.map((v, idx) =>
          (v !== '' && v !== null && v !== undefined) ? v : existing[idx]
        );
        sheet.getRange(i + 2, 1, 1, merged.length).setValues([merged]);
        return;
      }
    }
  }
  // Fila nueva — insertar completa
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, rowData.length).setValues([rowData]);
}
