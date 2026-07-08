import re
import os

idx_path = r'c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\frontend\src\pages\Upload\index.jsx'
with open(idx_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Insert new state variables
new_states = [
    "  const [importSessionId, setImportSessionId] = useState(null);\n",
    "  const [columnMapping, setColumnMapping] = useState({});\n"
]

state_insert_idx = -1
for i, line in enumerate(lines):
    if "const [samplesPerExperiment" in line:
        state_insert_idx = i + 1
        break

lines = lines[:state_insert_idx] + new_states + lines[state_insert_idx:]

# 2. Find step 2 bounds
start_s2 = -1
end_s2 = -1
brace_count = 0
for i, line in enumerate(lines):
    if '{step === 2 && (' in line:
        start_s2 = i
    if start_s2 != -1 and i >= start_s2:
        brace_count += line.count('(') - line.count(')')
        if brace_count == 0:
            end_s2 = i
            break

# 3. Replace step 2 with MapColumns
map_cols_jsx = """            {step === 2 && (
              <MapColumns
                datasetId={datasetId}
                file={file}
                setStep={setStep}
                importSessionId={importSessionId}
                setImportSessionId={setImportSessionId}
                columnMapping={columnMapping}
                setColumnMapping={setColumnMapping}
              />
            )}
"""
lines = lines[:start_s2] + [map_cols_jsx] + lines[end_s2 + 1:]

# 4. Replace api.uploadDataset in confirm batch
for i, line in enumerate(lines):
    if "const response = await api.uploadDataset" in line:
        lines[i] = "      const response = await api.confirmImport({ import_session_id: importSessionId, mapping: columnMapping, cat_constants: catConstants, num_constants: numConstants });\n"
        break

# 5. Add import MapColumns
import_idx = -1
for i, line in enumerate(lines):
    if "import" in line and "lucide-react" in line:
        import_idx = i + 1
        break

lines.insert(import_idx, "import MapColumns from './MapColumns';\n")

with open(idx_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Patched index.jsx")
