import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

function safeNumber(v, digits = 1) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : '-';
}

export async function exportFullExcel({ timeline = [], modelInfo = {}, suggestions = [], plotData = {} } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quantum Materials AI';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = 'Thermal CVD Bayesian Optimization Report';

  // Executive Summary
  const summary = workbook.addWorksheet('Executive_Summary');
  const measuredRows = timeline
    .map((row, index) => ({ ...row, index: index + 1, fwhmValue: Number(row.fwhm) }))
    .filter((r) => Number.isFinite(r.fwhmValue));
  const bestRow = measuredRows.reduce((best, r) => (!best || r.fwhmValue < best.fwhmValue ? r : best), null);
  const boCount = timeline.filter((r) => r.type !== 'Initial').length;
  const r2 = Number(modelInfo?.R2_score || 0);
  const modelConfidence = Number.isFinite(r2) ? `${Math.max(0, Math.min(99, Math.round(r2 * 100)))}%` : 'Not available';
  const suggestion = (suggestions && suggestions[0]) || {};

  summary.addRow(['Thermal CVD Bayesian Optimization Report']);
  summary.addRow([`Generated: ${new Date().toLocaleString()}`]);
  summary.addRow([]);
  summary.addRow(['Best FWHM', bestRow?.fwhmValue ?? modelInfo?.best_fwhm_meV ?? '-']);
  summary.addRow(['Best Experiment', bestRow ? `Experiment-${bestRow.index}` : '-']);
  summary.addRow(['Total Experiments', timeline.length]);
  summary.addRow(['BO Iterations', boCount]);
  // Removed detailed model diagnostics from the executive summary per UX request

  summary.columns = [{ width: 40 }, { width: 30 }];

  // Experiment History
  const history = workbook.addWorksheet('Experiment_History');
  history.addRow(['Experiment ID', 'Type', 'GTE (C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'Actual FWHM (meV)', 'Predicted FWHM (meV)', 'Status']);
  (timeline || []).forEach((row, idx) => {
    const step = idx + 1;
    const pred = (modelInfo?.prediction_data || []).find((p) => Number(p.iteration) === step) || {};
    const status = row.type === 'Initial' ? 'Initial' : 'BO';
    history.addRow([
      `Experiment-${step}`,
      row.type || '',
      row.gte ?? '',
      row.gti ?? '',
      row.fra ?? '',
      row.pressure ?? '',
      row.fwhm ?? '',
      pred?.predicted ?? '',
      status,
    ]);
  });
  history.columns = [{ width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 18 }, { width: 12 }];

  // BO_Recommendations worksheet removed per user request

  // Candidate Ranking (if available)
  const candidates = (plotData?.search_ei || []).slice(0, 100);
  if (candidates.length) {
    const cand = workbook.addWorksheet('Candidate_Ranking');
    cand.addRow(['Rank', 'Candidate Index', 'GTE (C)', 'GTI (min)', 'FRA (sccm)', 'Pressure (Torr)', 'Predicted FWHM (meV)', 'Uncertainty (meV)', 'Expected Improvement']);
    candidates.forEach((row, idx) => {
      cand.addRow([
        idx + 1,
        row.candidate_index ?? idx + 1,
        row.GTE_celsius ?? row.gte ?? row.GTE ?? '',
        row.GTI_minutes ?? row.gti ?? row.GTI ?? '',
        row.FRA_sccm ?? row.fra ?? row.FRA ?? '',
        row.Pressure_Torr ?? row.pressure ?? row.Pressure ?? '',
        row.predicted_FWHM_meV ?? row.predicted ?? row.mu ?? '',
        row.uncertainty_meV ?? row.uncertainty ?? row.sigma ?? '',
        row.ei ?? row.expected_improvement ?? '',
      ]);
    });
    cand.columns = [{ width: 8 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 }, { width: 14 }, { width: 18 }];
  }

  // Diagnostics
  const diagnostics = workbook.addWorksheet('Diagnostics');
  diagnostics.addRow(['Metric', 'Value']);
  diagnostics.addRow(['Model Type', 'Gaussian Process Regression']);
  diagnostics.addRow(['Kernel', modelInfo?.kernel || 'RBF + Constant']);
  diagnostics.addRow(['R² Score (Training)', safeNumber(modelInfo?.R2_score, 3)]);
  diagnostics.addRow(['MAE (meV)', safeNumber(modelInfo?.MAE_meV, 2)]);
  diagnostics.addRow(['RMSE (meV)', safeNumber(modelInfo?.RMSE_meV, 2)]);
  diagnostics.addRow(['Training Samples', modelInfo?.n_train_samples || timeline.length || '-']);
  diagnostics.columns = [{ width: 30 }, { width: 25 }];

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Thermal_CVD_Optimization_Report.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportFullPdf({ timeline = [], modelInfo = {}, suggestions = [], plotData = {} } = {}) {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;

  doc.setFontSize(18);
  doc.text('Thermal CVD Bayesian Optimization Report', margin, y);
  doc.setFontSize(10);
  y += 22;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

  y += 18;
  doc.setFontSize(12);
  const measuredRows = timeline
    .map((row, index) => ({ ...row, index: index + 1, fwhmValue: Number(row.fwhm) }))
    .filter((r) => Number.isFinite(r.fwhmValue));
  const bestRow = measuredRows.reduce((best, r) => (!best || r.fwhmValue < best.fwhmValue ? r : best), null);
  const boCount = timeline.filter((r) => r.type !== 'Initial').length;
  const r2 = Number(modelInfo?.R2_score || 0);
  const modelConfidence = Number.isFinite(r2) ? `${Math.max(0, Math.min(99, Math.round(r2 * 100)))}%` : 'Not available';
  const suggestion = (suggestions && suggestions[0]) || {};

  const summaryLines = [
    `Best FWHM: ${bestRow?.fwhmValue ?? modelInfo?.best_fwhm_meV ?? '-'} meV`,
    `Best Experiment: ${bestRow ? `Experiment-${bestRow.index}` : '-'}`,
    `Total Experiments: ${timeline.length}`,
    `BO Iterations: ${boCount}`,
    `Model R2: ${Number.isFinite(r2) ? r2.toFixed(3) : '-'}`,
    `Model Confidence: ${modelConfidence}`,
    `Most Important Variable: ${modelInfo?.feature_importances?.[0]?.name || 'Pressure'}`,
  ];

  y += 6;
  doc.setFontSize(10);
  summaryLines.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 14;
  });

  // Add experiment table header
  y += 8;
  doc.setFontSize(11);
  doc.text('Experiment History (first 50 rows)', margin, y);
  y += 14;
  const headers = ['ID', 'Type', 'GTE', 'GTI', 'FRA', 'Pressure', 'FWHM'];
  const colWidths = [60, 50, 50, 50, 50, 60, 60];
  const startX = margin;

  // header
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y);
    x += colWidths[i];
  });
  y += 12;

  // rows (limit to 50)
  const rows = timeline.slice(0, 50);
  rows.forEach((r, idx) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = margin;
    }
    x = startX;
    const values = [`Experiment-${idx + 1}`, r.type || '', String(r.gte ?? ''), String(r.gti ?? ''), String(r.fra ?? ''), String(r.pressure ?? ''), String(r.fwhm ?? '')];
    values.forEach((val, i) => {
      doc.text(String(val).substring(0, 12), x + 2, y);
      x += colWidths[i];
    });
    y += 12;
  });

  doc.save('Thermal_CVD_Optimization_Report.pdf');
}
