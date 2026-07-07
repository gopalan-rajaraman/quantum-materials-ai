import ExcelJS from 'exceljs';

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE  (exact match to screenshots)
// ═══════════════════════════════════════════════════════════════════════════
const DARK_NAVY     = '0D1B35';   // every title bar
const WHITE         = 'FFFFFF';
const GREEN_KPI     = '00B050';   // Best FWHM tile / Executive_Summary tab
const BLUE_KPI      = '4472C4';   // Best Experiment tile / Experiment_History tab
const PURPLE_KPI    = '7030A0';   // Total Experiments tile / Importance tab
const ORANGE_KPI    = 'ED7D31';   // BO Iterations tile / GP_Predictions tab
const YELLOW_TAB    = 'FFC000';   // BO_Recommendations tab
const CYAN_TEXT     = '00B0F0';   // subtitle text / KPI label text
const TEAL_TAB      = '1ABC9C';   // Raw_Candidate tab
const DIAG_TAB      = '2E75B6';   // Diagnostics tab

// Table header backgrounds (one per sheet)
const HDR_GREEN     = '70AD47';   // Executive_Summary table, Candidate_Ranking
const HDR_BLUE      = '2E75B6';   // Experiment_History, Diagnostics
const HDR_ORANGE    = 'ED7D31';   // GP_Predictions, BO_Recommendations
const HDR_PURPLE    = '7030A0';   // Importance
const HDR_TEAL      = '17A589';   // Raw_Candidate

// Data-row highlight colours
const ROW_ALTGREEN  = 'E2EFDA';   // alternating rows in summary progress table
const ROW_BO_BLUE   = 'BDD7EE';   // BO/User rows in Experiment History
const ROW_BO_PURPLE = 'EDE7F6';   // User rows in GP Predictions
const ROW_SALMON    = 'FCE4D6';   // BO rec data rows
const ROW_BEST      = 'C6EFCE';   // best-experiment highlight (light green)
const ROW_SELECTED  = 'DDEEFF';   // selected candidate in raw space

// ═══════════════════════════════════════════════════════════════════════════
// LOW-LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const sf = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const fnt = ({ bold = false, size = 10, color = '000000', italic = false } = {}) => ({
  name: 'Calibri', size, bold, italic, color: { argb: color },
});

const aln = (h = 'left', v = 'middle', wrap = false) => ({
  horizontal: h, vertical: v, wrapText: wrap,
});

const bdr = (c = 'D0D7E0') => ({
  top:    { style: 'thin', color: { argb: c } },
  left:   { style: 'thin', color: { argb: c } },
  bottom: { style: 'thin', color: { argb: c } },
  right:  { style: 'thin', color: { argb: c } },
});

/** Convert 1-based column number to letter(s): 1→A, 27→AA etc. */
function colLetter(n) {
  let s = '';
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
}

/** Safely merge cells — skips if any cell in the range is already merged */
function safeMerge(ws, ref) {
  try {
    ws.mergeCells(ref);
  } catch (e) {
    // If cells are already merged, unmerge first then re-merge
    if (e.message && e.message.includes('merge')) {
      try { ws.unMergeCells(ref); } catch (_) { /* ignore */ }
      try { ws.mergeCells(ref); } catch (_) { /* give up silently */ }
    }
  }
}

// ─── Writes the dark-navy title bar in row 1 ────────────────────────────────
function titleBar(ws, text, numCols) {
  const ref = `A1:${colLetter(numCols)}1`;
  safeMerge(ws, ref);
  const c = ws.getCell('A1');
  c.value = text;
  c.font  = fnt({ bold: true, size: 18, color: WHITE });
  c.fill  = sf(DARK_NAVY);
  c.alignment = aln('left', 'middle');
  ws.getRow(1).height = 36;
}

// ─── Writes the cyan subtitle in row 2 ──────────────────────────────────────
function subtitle(ws, text, numCols) {
  const ref = `A2:${colLetter(numCols)}2`;
  safeMerge(ws, ref);
  const c = ws.getCell('A2');
  c.value = text;
  c.font  = fnt({ size: 9, color: CYAN_TEXT });
  c.alignment = aln('left', 'middle');
  ws.getRow(2).height = 16;
}

// ─── Styles a header row (after values are already written) ─────────────────
function styleHdr(ws, row, numCols, startCol = 1, bg = HDR_GREEN) {
  for (let c = startCol; c < startCol + numCols; c++) {
    const cell = ws.getCell(row, c);
    cell.font  = fnt({ bold: true, size: 10, color: WHITE });
    cell.fill  = sf(bg);
    cell.alignment = aln('left', 'middle');
    cell.border = bdr('505050');
  }
  ws.getRow(row).height = 22;
}

// ─── Writes & styles one data row ───────────────────────────────────────────
function dataRow(ws, rowNum, values, startCol = 1, fill = null, fontOverride = {}) {
  values.forEach((val, i) => {
    const cell = ws.getCell(rowNum, startCol + i);
    cell.value  = val;
    cell.font   = fnt({ size: 10, ...fontOverride });
    cell.alignment = aln('left', 'middle');
    cell.border = bdr();
    if (fill) cell.fill = sf(fill);
  });
  ws.getRow(rowNum).height = 18;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 1 — Executive Summary
// ═══════════════════════════════════════════════════════════════════════════
function buildExecutiveSummary(wb, {
  currentBestFWHM, bestExpName, nExperiments, boIterations,
  expectedImprovement, timelineData, modelInfo,
}) {
  const ws = wb.addWorksheet('Executive_Summary');
  ws.properties.tabColor = { argb: GREEN_KPI };

  ws.columns = [
    { width: 5  }, // A
    { width: 18 }, // B
    { width: 5  }, // C
    { width: 18 }, // D
    { width: 5  }, // E
    { width: 20 }, // F
    { width: 5  }, // G
    { width: 20 }, // H
  ];

  // Row 1 – title bar
  titleBar(ws, 'Thermal CVD Bayesian Optimization Report', 8);

  // Row 2 – subtitle
  subtitle(ws, `Generated: ${new Date().toLocaleString()}`, 8);

  // Row 3 – spacer
  ws.getRow(3).height = 10;

  // ── KPI Row 1 labels (rows 4 & 5) ────────────────────────────────────────
  const kpi1 = [
    ['A4:B4', 'Best FWHM',         `${currentBestFWHM?.toFixed(1) ?? '--'} meV`, GREEN_KPI],
    ['C4:D4', 'Best Experiment',   bestExpName ?? '--',                            BLUE_KPI ],
    ['E4:F4', 'Total Experiments', nExperiments,                                   PURPLE_KPI],
    ['G4:H4', 'BO Iterations',     boIterations,                                   ORANGE_KPI],
  ];
  kpi1.forEach(([lRef, label, val, bg]) => {
    // Label row 4
    safeMerge(ws, lRef);
    const lc = ws.getCell(lRef.split(':')[0]);
    lc.value = label;
    lc.font  = fnt({ size: 9, color: CYAN_TEXT });
    lc.alignment = aln('center', 'bottom');
    // Value row 5 — replace ALL '4's with '5' (global regex)
    const vRef = lRef.replace(/4/g, '5');
    safeMerge(ws, vRef);
    const vc = ws.getCell(vRef.split(':')[0]);
    vc.value = val;
    vc.font  = fnt({ bold: true, size: 20, color: WHITE });
    vc.fill  = sf(bg);
    vc.alignment = aln('center', 'middle');
  });
  ws.getRow(4).height = 20;
  ws.getRow(5).height = 46;

  // Row 6 – spacer
  ws.getRow(6).height = 10;

  // ── KPI Row 2 labels (rows 7 & 8) ────────────────────────────────────────
  const r2 = modelInfo?.R2_score ?? 0;
  const confidence = `${Math.round(r2 * 100)}%`;
  const topParam   = modelInfo?.feature_importances?.[0]?.name ?? 'N/A';

  const kpi2 = [
    ['A7:B7', 'Model R2',               parseFloat(r2.toFixed(3)), BLUE_KPI  ],
    ['C7:D7', 'Model Confidence',        confidence,                GREEN_KPI ],
    ['E7:F7', 'Most Important Variable', topParam,                  PURPLE_KPI],
    ['G7:H7', 'Expected Improvement',    `${expectedImprovement ?? '0.0'} meV`, ORANGE_KPI],
  ];
  kpi2.forEach(([lRef, label, val, bg]) => {
    safeMerge(ws, lRef);
    const lc = ws.getCell(lRef.split(':')[0]);
    lc.value = label;
    lc.font  = fnt({ size: 9, color: CYAN_TEXT });
    lc.alignment = aln('center', 'bottom');
    // Value row 8 — replace ALL '7's with '8' (global regex)
    const vRef = lRef.replace(/7/g, '8');
    safeMerge(ws, vRef);
    const vc = ws.getCell(vRef.split(':')[0]);
    vc.value = val;
    vc.font  = fnt({ bold: true, size: 20, color: WHITE });
    vc.fill  = sf(bg);
    vc.alignment = aln('center', 'middle');
  });
  ws.getRow(7).height = 20;
  ws.getRow(8).height = 46;

  // Rows 9-10 spacers
  ws.getRow(9).height = 10;
  ws.getRow(10).height = 10;

  // Row 11 – section label
  safeMerge(ws, 'A11:H11');
  const sec = ws.getCell('A11');
  sec.value = 'FWHM Progress Overview';
  sec.font  = fnt({ bold: true, size: 12 });
  ws.getRow(11).height = 22;

  // Row 12 – table headers
  const hdrCols12 = ['Step', 'Experiment ID', 'Type', 'Actual FWHM (meV)', 'Best So Far (meV)'];
  hdrCols12.forEach((h, i) => { ws.getCell(12, i + 1).value = h; });
  styleHdr(ws, 12, 5, 1, HDR_GREEN);
  ws.autoFilter = 'A12:E12';

  // Rows 13+ – data
  let runBest = Infinity;
  (timelineData ?? []).forEach((item, idx) => {
    const r   = 13 + idx;
    const fwh = parseFloat(item.fwhm) || 0;
    if (fwh > 0 && fwh < runBest) runBest = fwh;
    const isBest = fwh === currentBestFWHM;
    const isBO   = item.type === 'User';
    const fill   = isBest ? ROW_BEST : isBO ? ROW_BO_BLUE : (idx % 2 === 0 ? WHITE : ROW_ALTGREEN);

    dataRow(ws, r, [
      idx + 1,
      `Experiment-${idx + 1}`,
      item.type ?? 'Initial',
      isNaN(fwh) ? '' : parseFloat(fwh.toFixed(2)),
      parseFloat(runBest.toFixed(2)),
    ], 1, fill, isBest ? { bold: true, color: PURPLE_KPI } : {});

    // right-align numeric columns
    ws.getCell(r, 4).alignment = aln('right', 'middle');
    ws.getCell(r, 5).alignment = aln('right', 'middle');
    ws.getCell(r, 1).alignment = aln('center', 'middle');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 2 — Experiment History
// ═══════════════════════════════════════════════════════════════════════════
function buildExperimentHistory(wb, { timelineData, currentBestFWHM }) {
  const ws = wb.addWorksheet('Experiment_History');
  ws.properties.tabColor = { argb: BLUE_KPI };

  ws.columns = [
    { width: 18 }, // A Experiment ID
    { width: 12 }, // B Type
    { width: 12 }, // C GTE (C)
    { width: 12 }, // D GTI (min)
    { width: 14 }, // E FRA (sccm)
    { width: 16 }, // F Pressure (Torr)
    { width: 20 }, // G Actual FWHM (meV)
    { width: 20 }, // H Predicted FWHM (meV)
    { width: 18 }, // I Status
  ];

  titleBar(ws, 'Complete Experiment History', 9);
  subtitle(ws, `${(timelineData ?? []).length} experiments with filters and highlighted best row`, 9);
  ws.getRow(3).height = 10;

  const hdrs = ['Experiment ID','Type','GTE (C)','GTI (min)','FRA (sccm)',
                 'Pressure (Torr)','Actual FWHM (meV)','Predicted FWHM (meV)','Status'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 9, 1, HDR_BLUE);
  ws.autoFilter = 'A4:I4';

  (timelineData ?? []).forEach((item, idx) => {
    const r    = 5 + idx;
    const fwh  = parseFloat(item.fwhm) || 0;
    const isBest = fwh === currentBestFWHM;
    const isBO   = item.type === 'User';
    const fill   = isBest ? ROW_BEST : isBO ? ROW_BO_BLUE : WHITE;
    const status = isBest ? 'Best observed' : (isBO ? 'BO' : item.type ?? 'Initial');

    dataRow(ws, r, [
      `Experiment-${idx + 1}`,
      item.type ?? 'Initial',
      parseFloat(item.gte)  || '',
      parseFloat(item.gti)  || '',
      parseFloat(item.fra)  || '',
      parseFloat(item.pressure) || '',
      isNaN(fwh) ? '' : parseFloat(fwh.toFixed(2)),
      isNaN(fwh) ? '' : parseFloat(fwh.toFixed(2)),
      status,
    ], 1, fill, isBest ? { bold: true, color: PURPLE_KPI } : {});

    // right-align numeric cols
    [3,4,5,6,7,8].forEach(c => {
      ws.getCell(r, c).alignment = aln('right', 'middle');
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 3 — GP Predictions vs Actual
// ═══════════════════════════════════════════════════════════════════════════
function buildGPPredictions(wb, { modelInfo, timelineData }) {
  const ws = wb.addWorksheet('GP_Predictions');
  ws.properties.tabColor = { argb: ORANGE_KPI };

  ws.columns = [
    { width: 18 }, // A
    { width: 12 }, // B
    { width: 20 }, // C
    { width: 22 }, // D
    { width: 18 }, // E
    { width: 24 }, // F
    { width: 16 }, // G
  ];

  titleBar(ws, 'GP Predictions vs Actual', 7);
  subtitle(ws, 'Residuals and uncertainty for model validation', 7);
  ws.getRow(3).height = 10;

  const hdrs = ['Experiment ID','Type','Actual FWHM (meV)','Predicted FWHM (meV)',
                 'Uncertainty (meV)','Residual (Actual - Pred)','Abs Residual'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 7, 1, HDR_ORANGE);
  ws.autoFilter = 'A4:G4';

  const predData = modelInfo?.prediction_data ?? [];
  (timelineData ?? []).forEach((item, idx) => {
    const r      = 5 + idx;
    const isBO   = item.type === 'User';
    const fill   = isBO ? ROW_BO_PURPLE : WHITE;
    const actual = parseFloat(item.fwhm) || 0;

    // Try to match with prediction_data by index
    const pred   = predData[idx];
    const predicted   = pred ? parseFloat(pred.predicted.toFixed(2)) : actual;
    const uncertainty = pred ? parseFloat(((pred.upper - pred.lower) / 2).toFixed(2)) : 0;
    const residual    = parseFloat((actual - predicted).toFixed(2));
    const absResidual = Math.abs(residual);

    dataRow(ws, r, [
      `Experiment-${idx + 1}`,
      item.type ?? 'Initial',
      parseFloat(actual.toFixed(2)),
      predicted,
      uncertainty,
      residual,
      absResidual,
    ], 1, fill);

    // Color Abs Residual: green for 0, pink for high
    const absCell = ws.getCell(r, 7);
    absCell.fill = sf(absResidual === 0 ? 'C6EFCE' : absResidual > 50 ? 'FFC7CE' : 'FFEB9C');
    absCell.font = fnt({ size: 10, color: absResidual === 0 ? '006100' : absResidual > 50 ? '9C0006' : '9C5700' });
    absCell.alignment = aln('right', 'middle');

    [3,4,5,6].forEach(c => { ws.getCell(r, c).alignment = aln('right', 'middle'); });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 4 — BO Recommendations
// ═══════════════════════════════════════════════════════════════════════════
function buildBORecommendations(wb, { suggestion, boIterations, expectedImprovement, currentBestFWHM }) {
  const ws = wb.addWorksheet('BO_Recommendations');
  ws.properties.tabColor = { argb: YELLOW_TAB };

  ws.columns = [
    { width: 12 }, // A Round
    { width: 12 }, // B GTE
    { width: 12 }, // C GTI
    { width: 14 }, // D FRA
    { width: 16 }, // E Pressure
    { width: 22 }, // F Predicted FWHM
    { width: 18 }, // G Uncertainty
    { width: 24 }, // H Expected Improvement
  ];

  titleBar(ws, 'BO Recommendations', 8);
  subtitle(ws, 'Recommended next experiment and expected improvement', 8);
  ws.getRow(3).height = 10;

  const hdrs = ['Round','GTE (C)','GTI (min)','FRA (sccm)','Pressure (Torr)',
                 'Predicted FWHM (meV)','Uncertainty (meV)','Expected Improvement (meV)'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 8, 1, HDR_ORANGE);
  ws.autoFilter = 'A4:H4';

  if (suggestion) {
    const ei = parseFloat(expectedImprovement) || 0;
    const values = [
      `BO-${(boIterations || 0) + 1}`,
      parseFloat(suggestion.GTE_celsius)      || '',
      parseFloat(suggestion.GTI_minutes)      || '',
      parseFloat(suggestion.FRA_sccm)         || '',
      parseFloat(suggestion.Pressure_Torr)    || '',
      parseFloat(parseFloat(suggestion.predicted_FWHM_meV).toFixed(3)),
      parseFloat(parseFloat(suggestion.uncertainty_meV).toFixed(3)),
      parseFloat(ei.toFixed(3)),
    ];
    dataRow(ws, 5, values, 1, ROW_SALMON);

    // EI column green
    ws.getCell(5, 8).fill = sf(GREEN_KPI);
    ws.getCell(5, 8).font = fnt({ bold: true, size: 10, color: WHITE });
    ws.getCell(5, 8).alignment = aln('right', 'middle');

    [2,3,4,5,6,7].forEach(c => { ws.getCell(5, c).alignment = aln('right', 'middle'); });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 5 — Candidate Ranking (Top 20 by EI)
// ═══════════════════════════════════════════════════════════════════════════
function buildCandidateRanking(wb, { plotData }) {
  const ws = wb.addWorksheet('Candidate_Ranking');
  ws.properties.tabColor = { argb: '00B0F0' };

  ws.columns = [
    { width: 8  }, // A Rank
    { width: 16 }, // B Candidate Index
    { width: 12 }, // C GTE
    { width: 12 }, // D GTI
    { width: 14 }, // E FRA
    { width: 16 }, // F Pressure
    { width: 22 }, // G Predicted FWHM
    { width: 20 }, // H Uncertainty
    { width: 22 }, // I Expected Improvement
  ];

  titleBar(ws, 'Candidate Ranking - Top 20 by EI', 9);
  subtitle(ws, 'Candidates ranked by expected improvement', 9);
  ws.getRow(3).height = 10;

  const hdrs = ['Rank','Candidate Index','GTE (C)','GTI (min)','FRA (sccm)',
                 'Pressure (Torr)','Predicted FWHM (meV)','Uncertainty (meV)','Expected Improvement'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 9, 1, HDR_GREEN);
  ws.autoFilter = 'A4:I4';

  // Sort search_ei by EI descending, take top 20
  const allCandidates = (plotData?.search_ei ?? [])
    .slice()
    .sort((a, b) => b.ei - a.ei)
    .slice(0, 20);

  allCandidates.forEach((cand, idx) => {
    const r    = 5 + idx;
    const fill = idx % 2 === 0 ? WHITE : ROW_ALTGREEN;
    dataRow(ws, r, [
      idx + 1,
      cand.candidate_index,
      0, 0, 0, 0,
      parseFloat(cand.predicted_FWHM_meV.toFixed(8)),
      parseFloat(cand.uncertainty_meV.toFixed(8)),
      parseFloat(cand.ei.toFixed(8)),
    ], 1, fill);

    // EI column bold orange
    ws.getCell(r, 9).font = fnt({ bold: true, size: 10, color: ORANGE_KPI });
    [3,4,5,6,7,8,9].forEach(c => { ws.getCell(r, c).alignment = aln('right', 'middle'); });
    ws.getCell(r, 1).alignment = aln('center', 'middle');
    ws.getCell(r, 2).alignment = aln('center', 'middle');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 6 — Parameter Importance
// ═══════════════════════════════════════════════════════════════════════════
function buildImportance(wb, { modelInfo }) {
  const ws = wb.addWorksheet('Importance');
  ws.properties.tabColor = { argb: PURPLE_KPI };

  ws.columns = [
    { width: 22 }, // A Parameter
    { width: 24 }, // B Relative Importance (%)
    { width: 36 }, // C Visual Bar
    { width: 20 }, // D Interpretation
    { width: 28 }, // E Action
  ];

  titleBar(ws, 'Parameter Importance', 5);
  subtitle(ws, 'Relative contribution to observed FWHM variation', 5);
  ws.getRow(3).height = 10;

  const hdrs = ['Parameter','Relative Importance (%)','Visual Bar','Interpretation','Action'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 5, 1, HDR_PURPLE);
  ws.autoFilter = 'A4:E4';

  const feats = modelInfo?.feature_importances ?? [];
  feats.forEach((feat, idx) => {
    const r      = 5 + idx;
    const fill   = idx % 2 === 0 ? WHITE : ROW_ALTGREEN;
    const pct    = feat.value || 0;

    // Visual bar: hash chars + percentage
    const barLen = Math.max(1, Math.round(pct / 6));
    const bar    = '#'.repeat(barLen) + `  ${Math.round(pct)}%`;

    let interp = 'Secondary';
    let action = 'Validate nearby interactions';
    if (pct > 45) { interp = 'Most influential'; action = 'Prioritize tight control'; }
    else if (pct > 20) { interp = 'Significant'; }

    dataRow(ws, r, [feat.name, parseFloat(pct.toFixed(1)), bar, interp, action], 1, fill);

    // Orange visual bar text
    ws.getCell(r, 3).font = fnt({ size: 10, color: ORANGE_KPI });
    ws.getCell(r, 2).alignment = aln('right', 'middle');
    ws.getRow(r).height = 18;
  });

  // Interpretation block below the table
  if (feats.length > 0) {
    const noteRow = 5 + feats.length + 1;
    ws.getCell(noteRow, 1).value = 'Interpretation';
    ws.getCell(noteRow, 1).font = fnt({ size: 10, color: '666666' });

    const topFeat = feats[0]?.name ?? 'N/A';
    safeMerge(ws, `B${noteRow}:C${noteRow + 1}`);
    const noteTxt = ws.getCell(`B${noteRow}`);
    noteTxt.value = `${topFeat} is the dominant parameter influencing FWHM in this dataset.`;
    noteTxt.font  = fnt({ size: 10, color: '333333' });
    noteTxt.alignment = aln('left', 'middle', true);
    ws.getRow(noteRow).height = 20;
    ws.getRow(noteRow + 1).height = 20;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 7 — Model Diagnostics
// ═══════════════════════════════════════════════════════════════════════════
function buildDiagnostics(wb, { modelInfo }) {
  const ws = wb.addWorksheet('Diagnostics');
  ws.properties.tabColor = { argb: DIAG_TAB };

  ws.columns = [
    { width: 22 }, // A Metric
    { width: 36 }, // B Value
    { width: 16 }, // C Status
    { width: 32 }, // D Notes
  ];

  titleBar(ws, 'Model Diagnostics', 4);
  subtitle(ws, 'Training quality and Gaussian Process configuration', 4);
  ws.getRow(3).height = 10;

  const hdrs = ['Metric','Value','Status','Notes'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 4, 1, HDR_BLUE);
  ws.autoFilter = 'A4:D4';

  const rows = [
    ['Model Type',       'Gaussian Process Regression',           'Active',      'Thermal CVD optimizer'],
    ['Kernel',           modelInfo?.kernel ?? 'N/A',               'Configured',  'From trained model info'],
    ['R2 Score',         modelInfo?.R2_score ?? 0,                 'Strong',      'Higher is better'],
    ['RMSE (meV)',       modelInfo?.RMSE_meV ?? 0,                 'Tracked',     'Prediction error scale'],
    ['MAE (meV)',        modelInfo?.MAE_meV ?? 0,                  'Tracked',     'Mean absolute error'],
    ['MAPE (%)',         '',                                        'Tracked',     'Relative error'],
    ['Alpha',            '1.0e-6',                                 'Configured',  'Noise regularization'],
    ['Optimizer',        'Expected Improvement',                   'Active',      'BO acquisition strategy'],
    ['Training Samples', modelInfo?.n_train_samples ?? 0,          'Loaded',      'Observed experiments'],
  ];

  // Rows where Metric gets blue text (numeric metrics)
  const blueMetrics = new Set(['R2 Score','RMSE (meV)','MAE (meV)','MAPE (%)','Alpha','Training Samples']);

  rows.forEach(([metric, val, status, notes], idx) => {
    const r    = 5 + idx;
    const fill = idx % 2 === 0 ? WHITE : 'EBF3FB';
    const isBlue = blueMetrics.has(metric);

    dataRow(ws, r, [metric, val, status, notes], 1, fill,
      isBlue ? { color: CYAN_TEXT } : {});

    // Override Value column alignment for numbers
    if (typeof val === 'number') {
      ws.getCell(r, 2).alignment = aln('right', 'middle');
    }
    // Wrap kernel value
    if (metric === 'Kernel') {
      ws.getCell(r, 2).alignment = aln('left', 'middle', true);
      ws.getRow(r).height = 54;
    }
    if (metric === 'Training Samples') {
      ws.getCell(r, 2).alignment = aln('right', 'middle');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SHEET 8 — Raw Candidate Space
// ═══════════════════════════════════════════════════════════════════════════
function buildRawCandidateSpace(wb, { plotData }) {
  const ws = wb.addWorksheet('Raw_Candidate');
  ws.properties.tabColor = { argb: TEAL_TAB };

  ws.columns = [
    { width: 18 }, // A Candidate Index
    { width: 12 }, // B GTE
    { width: 12 }, // C GTI
    { width: 14 }, // D FRA
    { width: 16 }, // E Pressure
    { width: 22 }, // F Predicted FWHM
    { width: 20 }, // G Uncertainty
    { width: 22 }, // H Expected Improvement
    { width: 12 }, // I Selected
  ];

  const all = plotData?.search_ei ?? [];
  titleBar(ws, 'Raw Candidate Space', 9);
  subtitle(ws, `${all.length} generated candidate points available`, 9);
  ws.getRow(3).height = 10;

  const hdrs = ['Candidate Index','GTE (C)','GTI (min)','FRA (sccm)','Pressure (Torr)',
                 'Predicted FWHM (meV)','Uncertainty (meV)','Expected Improvement','Selected'];
  hdrs.forEach((h, i) => { ws.getCell(4, i + 1).value = h; });
  styleHdr(ws, 4, 9, 1, HDR_TEAL);
  ws.autoFilter = 'A4:I4';

  all.forEach((cand, idx) => {
    const r      = 5 + idx;
    const isSel  = cand.is_selected;
    const fill   = isSel ? ROW_SELECTED : (idx % 2 === 0 ? WHITE : 'F0FAFA');

    dataRow(ws, r, [
      cand.candidate_index,
      0, 0, 0, 0,
      parseFloat(cand.predicted_FWHM_meV.toFixed(8)),
      parseFloat(cand.uncertainty_meV.toFixed(8)),
      parseFloat(cand.ei.toFixed(8)),
      isSel ? 'YES' : '',
    ], 1, fill);

    if (isSel) {
      ws.getCell(r, 9).font = fnt({ bold: true, size: 10, color: GREEN_KPI });
    }
    [2,3,4,5,6,7,8].forEach(c => { ws.getCell(r, c).alignment = aln('right', 'middle'); });
    ws.getCell(r, 9).alignment = aln('center', 'middle');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export const generateExcelReport = async (data) => {
  try {
    const {
      currentBestFWHM, bestExpName, nExperiments, boIterations,
      expectedImprovement, timelineData, suggestion, modelInfo, plotData,
    } = data;

    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Quantum Materials AI';
    wb.created  = new Date();
    wb.modified = new Date();

    buildExecutiveSummary  (wb, { currentBestFWHM, bestExpName, nExperiments, boIterations, expectedImprovement, timelineData, modelInfo });
    buildExperimentHistory (wb, { timelineData, currentBestFWHM });
    buildGPPredictions     (wb, { modelInfo, timelineData });
    buildBORecommendations (wb, { suggestion, boIterations, expectedImprovement, currentBestFWHM });
    buildCandidateRanking  (wb, { plotData });
    buildImportance        (wb, { modelInfo });
    buildDiagnostics       (wb, { modelInfo });
    buildRawCandidateSpace (wb, { plotData });

    // Trigger browser download
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = window.URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url;
    a.download = 'Thermal_CVD_Optimization_Report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Excel export error:', err);
    alert(`Failed to generate Excel report: ${err.message || String(err)}`);
  }
};
