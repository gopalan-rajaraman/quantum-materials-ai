import ExcelJS from 'exceljs';

const resizeTable = (ws, tableName, newRef) => {
  if (!ws) return;
  const tables = ws.getTables();
  const t = Object.values(tables).find(tbl => tbl.table && tbl.table.name === tableName);
  if (t) {
    t.table.tableRef = newRef;
    if (t.table.autoFilterRef) t.table.autoFilterRef = newRef;
  }
};

export const generateExcelReport = async (data) => {
  try {
    const { currentBestFWHM, bestExpName, nExperiments, boIterations, expectedImprovement, timelineData, suggestion, modelInfo } = data;

    // Fetch the template
    const response = await fetch('/Thermal_CVD_Optimization_Report_Template.xlsx');
    const arrayBuffer = await response.arrayBuffer();

    // Load the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Update Executive_Summary Sheet
    const summarySheet = workbook.getWorksheet('Executive_Summary');
    if (summarySheet) {
      summarySheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
      summarySheet.getCell('A5').value = `${currentBestFWHM?.toFixed(1) || '--'} meV`;
      summarySheet.getCell('C5').value = bestExpName || '--';
      summarySheet.getCell('E5').value = nExperiments;
      summarySheet.getCell('G5').value = boIterations;
      summarySheet.getCell('G8').value = `${expectedImprovement || '0.0'} meV`;

      // Update FWHM Progress Overview table (starts at row 13)
      // Clear old data first
      let row = 13;
      while (summarySheet.getCell(`A${row}`).value !== null) {
        summarySheet.getCell(`A${row}`).value = null;
        summarySheet.getCell(`B${row}`).value = null;
        summarySheet.getCell(`C${row}`).value = null;
        summarySheet.getCell(`D${row}`).value = null;
        summarySheet.getCell(`E${row}`).value = null;
        row++;
      }

      // Insert new data
      (timelineData || []).forEach((item, index) => {
        const r = 13 + index;
        summarySheet.getCell(`A${r}`).value = index + 1;
        summarySheet.getCell(`B${r}`).value = `Experiment-${index + 1}`;
        summarySheet.getCell(`C${r}`).value = item.type;
        summarySheet.getCell(`D${r}`).value = parseFloat(item.fwhm);
        summarySheet.getCell(`E${r}`).value = parseFloat(item.bestSoFar || currentBestFWHM);
      });

      const dataLength = Math.max(1, (timelineData || []).length);
      resizeTable(summarySheet, 'ProgressOverview', `A12:E${12 + dataLength}`);
    }

    // Update Experiment_History Sheet
    const historySheet = workbook.getWorksheet('Experiment_History');
    if (historySheet) {
      let row = 4;
      while (historySheet.getCell(`A${row}`).value !== null) {
        historySheet.getCell(`A${row}`).value = null;
        historySheet.getCell(`B${row}`).value = null;
        historySheet.getCell(`C${row}`).value = null;
        historySheet.getCell(`D${row}`).value = null;
        historySheet.getCell(`E${row}`).value = null;
        historySheet.getCell(`F${row}`).value = null;
        historySheet.getCell(`I${row}`).value = null;
        row++;
      }

      (timelineData || []).forEach((item, index) => {
        const r = 4 + index;
        historySheet.getCell(`A${r}`).value = `Experiment-${index + 1}`;
        historySheet.getCell(`B${r}`).value = parseFloat(item.gte);
        historySheet.getCell(`C${r}`).value = parseFloat(item.gti);
        historySheet.getCell(`D${r}`).value = parseFloat(item.fra);
        historySheet.getCell(`E${r}`).value = parseFloat(item.pressure);
        historySheet.getCell(`F${r}`).value = parseFloat(item.fwhm);
        const isBest = parseFloat(item.fwhm) === currentBestFWHM;
        historySheet.getCell(`I${r}`).value = isBest ? 'Best observed' : item.type;
      });

      const dataLength = Math.max(1, (timelineData || []).length);
      resizeTable(historySheet, 'ExperimentHistory', `A3:I${3 + dataLength}`);
    }

    // Update BO_Recommendations Sheet
    const boSheet = workbook.getWorksheet('BO_Recommendations');
    if (boSheet && suggestion) {
      boSheet.getCell('A4').value = `BO-${boIterations + 1}`;
      boSheet.getCell('B4').value = parseFloat(suggestion.GTE_celsius);
      boSheet.getCell('C4').value = parseFloat(suggestion.GTI_minutes);
      boSheet.getCell('D4').value = parseFloat(suggestion.FRA_sccm);
      boSheet.getCell('E4').value = parseFloat(suggestion.Pressure_Torr);
      boSheet.getCell('F4').value = parseFloat(suggestion.predicted_FWHM_meV);
      boSheet.getCell('G4').value = parseFloat(suggestion.uncertainty_meV);
      boSheet.getCell('H4').value = parseFloat(expectedImprovement);
      resizeTable(boSheet, 'BORecommendations', 'A3:H4');
    }

    // Update GP_Predictions Sheet
    const gpSheet = workbook.getWorksheet('GP_Predictions');
    if (gpSheet && modelInfo && modelInfo.prediction_data) {
      let row = 3;
      // Clear old data
      while (gpSheet.getCell(`A${row}`).value !== null) {
        ['A','B','C','D','E','F','G'].forEach(col => gpSheet.getCell(`${col}${row}`).value = null);
        row++;
      }
      // Insert dynamic predictions
      modelInfo.prediction_data.forEach((pred, index) => {
        const r = 3 + index;
        gpSheet.getCell(`A${r}`).value = `Experiment-${pred.iteration}`;
        gpSheet.getCell(`B${r}`).value = parseFloat(pred.observed);
        gpSheet.getCell(`C${r}`).value = parseFloat(pred.predicted);
        gpSheet.getCell(`D${r}`).value = parseFloat(pred.lower);
        gpSheet.getCell(`E${r}`).value = parseFloat(pred.upper);
        const uncertainty = (pred.upper - pred.lower) / 2;
        gpSheet.getCell(`F${r}`).value = parseFloat(uncertainty.toFixed(2));
        gpSheet.getCell(`G${r}`).value = parseFloat(Math.abs(pred.observed - pred.predicted).toFixed(2));
      });
      
      const gpLength = Math.max(1, modelInfo.prediction_data.length);
      resizeTable(gpSheet, 'GPPredictions', `A2:G${2 + gpLength}`);
    }

    // Update Importance Sheet
    const impSheet = workbook.getWorksheet('Importance');
    if (impSheet && modelInfo && modelInfo.feature_importances) {
      let row = 3;
      // Clear old
      while (impSheet.getCell(`A${row}`).value !== null) {
        ['A','B','C','D','E'].forEach(col => impSheet.getCell(`${col}${row}`).value = null);
        row++;
      }
      // Insert dynamic importance
      modelInfo.feature_importances.forEach((feat, index) => {
        const r = 3 + index;
        impSheet.getCell(`A${r}`).value = feat.name;
        impSheet.getCell(`B${r}`).value = feat.value / 100; // if it's formatted as percentage in excel
        
        let action = 'Monitor';
        if (feat.value > 40) action = 'Prioritize tight control';
        else if (feat.value > 15) action = 'Validate nearby interactions';
        impSheet.getCell(`C${r}`).value = action;
      });

      const impLength = Math.max(1, modelInfo.feature_importances.length);
      resizeTable(impSheet, 'ParameterImportance', `A2:E${2 + impLength}`);
    }

    // Update Diagnostics Sheet
    const diagSheet = workbook.getWorksheet('Diagnostics');
    if (diagSheet && modelInfo) {
      // Map standard metrics to rows
      diagSheet.getCell('B5').value = modelInfo.R2_score !== undefined ? parseFloat(modelInfo.R2_score) : 0;
      diagSheet.getCell('B6').value = modelInfo.RMSE_meV !== undefined ? parseFloat(modelInfo.RMSE_meV) : 0;
      diagSheet.getCell('B7').value = modelInfo.MAE_meV !== undefined ? parseFloat(modelInfo.MAE_meV) : 0;
      diagSheet.getCell('B11').value = modelInfo.n_train_samples !== undefined ? modelInfo.n_train_samples : 0;
    }

    // Save and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Thermal_CVD_Optimization_Report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting Excel:', error);
    alert(`Failed to generate Excel report: ${error.message || String(error)}`);
  }
};
