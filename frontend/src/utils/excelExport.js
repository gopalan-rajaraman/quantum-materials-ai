import ExcelJS from 'exceljs';

export const generateExcelReport = async (data) => {
  try {
    const { currentBestFWHM, bestExpName, nExperiments, boIterations, expectedImprovement, timelineData, suggestion } = data;

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
      timelineData.forEach((item, index) => {
        const r = 13 + index;
        summarySheet.getCell(`A${r}`).value = index + 1;
        summarySheet.getCell(`B${r}`).value = `Experiment-${index + 1}`;
        summarySheet.getCell(`C${r}`).value = item.type;
        summarySheet.getCell(`D${r}`).value = parseFloat(item.fwhm);
        summarySheet.getCell(`E${r}`).value = parseFloat(item.bestSoFar || currentBestFWHM);
      });
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

      timelineData.forEach((item, index) => {
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
    alert('Failed to generate Excel report.');
  }
};
