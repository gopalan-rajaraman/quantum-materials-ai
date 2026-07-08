import re

with open(r'c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\frontend\src\utils\excelExport.js', 'r', encoding='utf-8') as f:
    content = f.read()

# buildExperimentHistory
content = re.sub(
    r"(\s*const hdrs = \['Experiment ID','Type',)'GTE \(C\)','GTI \(min\)','FRA \(sccm\)',\s*'Pressure \(Torr\)',('Actual FWHM \(meV\)','Predicted FWHM \(meV\)','Status'\];)",
    r"\1...optVars,\2",
    content
)

content = re.sub(
    r"(\s*ws\.columns = \[\n\s*\{ width: 18 \}, // A Experiment ID\n\s*\{ width: 12 \}, // B Type\n)\s*\{ width: 12 \}, // C GTE \(C\)\n\s*\{ width: 12 \}, // D GTI \(min\)\n\s*\{ width: 14 \}, // E FRA \(sccm\)\n\s*\{ width: 16 \}, // F Pressure \(Torr\)\n(\s*\{ width: 20 \}, // G Actual FWHM \(meV\))",
    r"\1    ...optVars.map(() => ({ width: 14 })),\n\2",
    content
)

content = re.sub(
    r"(\s*item\.type \?\? 'Initial',\n)\s*parseFloat\(item\.gte\)\s*\|\|\s*'',\n\s*parseFloat\(item\.gti\)\s*\|\|\s*'',\n\s*parseFloat\(item\.fra\)\s*\|\|\s*'',\n\s*parseFloat\(item\.pressure\)\s*\|\|\s*'',\n(\s*isNaN\(fwh\))",
    r"\1      ...optVars.map(v => parseFloat((item.variables || {})[v]) || ''),\n\2",
    content
)

content = re.sub(
    r"styleHdr\(ws, 4, 9, 1, HDR_BLUE\);",
    r"styleHdr(ws, 4, 5 + optVars.length, 1, HDR_BLUE);",
    content
)

content = re.sub(
    r"ws\.autoFilter = 'A4:I4';",
    r"ws.autoFilter = `A4:${colLetter(5 + optVars.length)}4`;",
    content
)

content = re.sub(
    r"\[3,4,5,6,7,8\]\.forEach\(c => {",
    r"Array.from({length: optVars.length + 2}, (_, i) => i + 3).forEach(c => {",
    content
)


# buildBORecommendations
content = re.sub(
    r"(\s*const hdrs = \['Round',)'GTE \(C\)','GTI \(min\)','FRA \(sccm\)','Pressure \(Torr\)',\s*('Predicted FWHM \(meV\)','Uncertainty \(meV\)','Expected Improvement \(meV\)'\];)",
    r"\1...optVars,\2",
    content
)

content = re.sub(
    r"(\s*ws\.columns = \[\n\s*\{ width: 12 \}, // A Round\n)\s*\{ width: 12 \}, // B GTE\n\s*\{ width: 12 \}, // C GTI\n\s*\{ width: 14 \}, // D FRA\n\s*\{ width: 16 \}, // E Pressure\n(\s*\{ width: 22 \}, // F Predicted FWHM)",
    r"\1    ...optVars.map(() => ({ width: 14 })),\n\2",
    content
)

content = re.sub(
    r"(\s*`BO-\$\{\(boIterations \|\| 0\) \+ 1\}`,)\n\s*parseFloat\(suggestion\.GTE_celsius\)\s*\|\|\s*'',\n\s*parseFloat\(suggestion\.GTI_minutes\)\s*\|\|\s*'',\n\s*parseFloat\(suggestion\.FRA_sccm\)\s*\|\|\s*'',\n\s*parseFloat\(suggestion\.Pressure_Torr\)\s*\|\|\s*'',\n(\s*parseFloat\(parseFloat\(suggestion\.predicted_FWHM_meV\)\.toFixed\(3\)\),)",
    r"\1\n      ...optVars.map(v => parseFloat((suggestion.variables || {})[v]) || ''),\n\2",
    content
)

content = re.sub(
    r"styleHdr\(ws, 4, 8, 1, HDR_ORANGE\);",
    r"styleHdr(ws, 4, 4 + optVars.length, 1, HDR_ORANGE);",
    content
)

content = re.sub(
    r"ws\.autoFilter = 'A4:H4';",
    r"ws.autoFilter = `A4:${colLetter(4 + optVars.length)}4`;",
    content
)

content = re.sub(
    r"ws\.getCell\(5, 8\)\.fill",
    r"ws.getCell(5, 4 + optVars.length).fill",
    content
)
content = re.sub(
    r"ws\.getCell\(5, 8\)\.font",
    r"ws.getCell(5, 4 + optVars.length).font",
    content
)
content = re.sub(
    r"ws\.getCell\(5, 8\)\.alignment",
    r"ws.getCell(5, 4 + optVars.length).alignment",
    content
)

content = re.sub(
    r"\[2,3,4,5,6,7\]\.forEach\(c => { ws\.getCell\(5, c\)\.alignment = aln\('right', 'middle'\); }\);",
    r"Array.from({length: optVars.length + 2}, (_, i) => i + 2).forEach(c => { ws.getCell(5, c).alignment = aln('right', 'middle'); });",
    content
)

# buildCandidateRanking
content = re.sub(
    r"(\s*const hdrs = \['Rank','Candidate Index',)'GTE \(C\)','GTI \(min\)','FRA \(sccm\)',\s*'Pressure \(Torr\)',('Predicted FWHM \(meV\)','Uncertainty \(meV\)','Expected Improvement'\];)",
    r"\1...optVars,\2",
    content
)

content = re.sub(
    r"(\s*ws\.columns = \[\n\s*\{ width: 8  \}, // A Rank\n\s*\{ width: 16 \}, // B Candidate Index\n)\s*\{ width: 12 \}, // C GTE\n\s*\{ width: 12 \}, // D GTI\n\s*\{ width: 14 \}, // E FRA\n\s*\{ width: 16 \}, // F Pressure\n(\s*\{ width: 22 \}, // G Predicted FWHM)",
    r"\1    ...optVars.map(() => ({ width: 14 })),\n\2",
    content
)

content = re.sub(
    r"(\s*cand\.candidate_index,\n)\s*0, 0, 0, 0,\n(\s*parseFloat\(cand\.predicted_FWHM_meV\.toFixed\(8\)\),)",
    r"\1      ...optVars.map(v => parseFloat((cand.variables || {})[v] || 0)),\n\2",
    content
)

content = re.sub(
    r"styleHdr\(ws, 4, 9, 1, HDR_GREEN\);",
    r"styleHdr(ws, 4, 5 + optVars.length, 1, HDR_GREEN);",
    content
)

content = re.sub(
    r"ws\.autoFilter = 'A4:I4';",
    r"ws.autoFilter = `A4:${colLetter(5 + optVars.length)}4`;",
    content
)

content = re.sub(
    r"ws\.getCell\(r, 9\)\.font",
    r"ws.getCell(r, 5 + optVars.length).font",
    content
)

content = re.sub(
    r"\[3,4,5,6,7,8,9\]\.forEach\(c => { ws\.getCell\(r, c\)\.alignment = aln\('right', 'middle'\); }\);",
    r"Array.from({length: optVars.length + 3}, (_, i) => i + 3).forEach(c => { ws.getCell(r, c).alignment = aln('right', 'middle'); });",
    content
)

# buildRawCandidateSpace
content = re.sub(
    r"(\s*const hdrs = \['Candidate Index',)'GTE \(C\)','GTI \(min\)','FRA \(sccm\)','Pressure \(Torr\)',\s*('Predicted FWHM \(meV\)','Uncertainty \(meV\)','Expected Improvement','Selected'\];)",
    r"\1...optVars,\2",
    content
)

content = re.sub(
    r"(\s*ws\.columns = \[\n\s*\{ width: 18 \}, // A Candidate Index\n)\s*\{ width: 12 \}, // B GTE\n\s*\{ width: 12 \}, // C GTI\n\s*\{ width: 14 \}, // D FRA\n\s*\{ width: 16 \}, // E Pressure\n(\s*\{ width: 22 \}, // F Predicted FWHM)",
    r"\1    ...optVars.map(() => ({ width: 14 })),\n\2",
    content
)

content = re.sub(
    r"(\s*cand\.candidate_index,\n)\s*0, 0, 0, 0,\n(\s*parseFloat\(cand\.predicted_FWHM_meV\.toFixed\(8\)\),)",
    r"\1      ...optVars.map(v => parseFloat((cand.variables || {})[v] || 0)),\n\2",
    content
)

content = re.sub(
    r"styleHdr\(ws, 4, 9, 1, HDR_TEAL\);",
    r"styleHdr(ws, 4, 5 + optVars.length, 1, HDR_TEAL);",
    content
)

content = re.sub(
    r"ws\.autoFilter = 'A4:I4';",
    r"ws.autoFilter = `A4:${colLetter(5 + optVars.length)}4`;",
    content
)

content = re.sub(
    r"ws\.getCell\(r, 9\)",
    r"ws.getCell(r, 5 + optVars.length)",
    content
)

content = re.sub(
    r"\[2,3,4,5,6,7,8\]\.forEach\(c => { ws\.getCell\(r, c\)\.alignment = aln\('right', 'middle'\); }\);",
    r"Array.from({length: optVars.length + 3}, (_, i) => i + 2).forEach(c => { ws.getCell(r, c).alignment = aln('right', 'middle'); });",
    content
)

content = re.sub(
    r"function buildExperimentHistory\(wb, \{ timelineData, currentBestFWHM \}\) \{",
    r"function buildExperimentHistory(wb, { timelineData, currentBestFWHM, optVars }) {",
    content
)

content = re.sub(
    r"function buildBORecommendations\(wb, \{ suggestion, boIterations, expectedImprovement, currentBestFWHM \}\) \{",
    r"function buildBORecommendations(wb, { suggestion, boIterations, expectedImprovement, currentBestFWHM, optVars }) {",
    content
)

content = re.sub(
    r"function buildCandidateRanking\(wb, \{ plotData \}\) \{",
    r"function buildCandidateRanking(wb, { plotData, optVars }) {",
    content
)

content = re.sub(
    r"function buildRawCandidateSpace\(wb, \{ plotData \}\) \{",
    r"function buildRawCandidateSpace(wb, { plotData, optVars }) {",
    content
)

content = re.sub(
    r"buildExperimentHistory\s*\(wb, \{ timelineData, currentBestFWHM \}\);",
    r"buildExperimentHistory (wb, { timelineData, currentBestFWHM, optVars });",
    content
)
content = re.sub(
    r"buildBORecommendations\s*\(wb, \{ suggestion, boIterations, expectedImprovement, currentBestFWHM \}\);",
    r"buildBORecommendations (wb, { suggestion, boIterations, expectedImprovement, currentBestFWHM, optVars });",
    content
)
content = re.sub(
    r"buildCandidateRanking\s*\(wb, \{ plotData \}\);",
    r"buildCandidateRanking  (wb, { plotData, optVars });",
    content
)
content = re.sub(
    r"buildRawCandidateSpace\s*\(wb, \{ plotData \}\);",
    r"buildRawCandidateSpace (wb, { plotData, optVars });",
    content
)

content = re.sub(
    r"export const generateExcelReport = async \(data\) => \{\n\s*try \{\n\s*const \{\n\s*currentBestFWHM, bestExpName, nExperiments, boIterations,\n\s*expectedImprovement, timelineData, suggestion, modelInfo, plotData,\n\s*\} = data;",
    r"export const generateExcelReport = async (data) => {\n  try {\n    const {\n      currentBestFWHM, bestExpName, nExperiments, boIterations,\n      expectedImprovement, timelineData, suggestion, modelInfo, plotData,\n    } = data;\n    const optVars = Object.keys((timelineData && timelineData[0] && timelineData[0].variables) || (suggestion && suggestion.variables) || {});",
    content
)

with open(r'c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\frontend\src\utils\excelExport.js', 'w', encoding='utf-8') as f:
    f.write(content)

