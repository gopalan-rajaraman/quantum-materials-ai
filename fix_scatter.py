"""
Fix: ValueError: x and y must be the same size
in WS2_ThermalCVD_BayesOpt_Final.ipynb, Step 10 (EI Landscape).

Root cause:
  ax.scatter(df[vx].dropna(), df[vy].dropna(), ...)
  Each column drops NaN independently, so they can have different lengths.

Fix:
  Drop rows where EITHER column is NaN before scattering.
"""
import json, pathlib, re

NOTEBOOK = pathlib.Path(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_ThermalCVD_BayesOpt_Final.ipynb")

OLD = (
    r"    ax.scatter(df[vx].dropna(), df[vy].dropna(),\n"
    r"               c='white', edgecolors='black', s=80, zorder=5, label='Observed')"
)

NEW = (
    r"    _obs = df[[vx, vy]].dropna()\n"
    r"    ax.scatter(_obs[vx], _obs[vy],\n"
    r"               c='white', edgecolors='black', s=80, zorder=5, label='Observed')"
)

nb = json.loads(NOTEBOOK.read_text(encoding="utf-8"))

patched = 0
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        src = cell["source"]
        if isinstance(src, list):
            src = "".join(src)
        if "df[vx].dropna(), df[vy].dropna()" in src:
            cell["source"] = src.replace(
                "ax.scatter(df[vx].dropna(), df[vy].dropna(),\n"
                "               c='white', edgecolors='black', s=80, zorder=5, label='Observed')",
                "_obs = df[[vx, vy]].dropna()\n"
                "    ax.scatter(_obs[vx], _obs[vy],\n"
                "               c='white', edgecolors='black', s=80, zorder=5, label='Observed')"
            )
            patched += 1

if patched:
    NOTEBOOK.write_text(json.dumps(nb, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Patched {patched} cell(s) in {NOTEBOOK.name}")
else:
    print("⚠️  Pattern not found — notebook may already be fixed or source format differs.")
    # Debug: show relevant source
    for i, cell in enumerate(nb["cells"]):
        if cell["cell_type"] == "code":
            src = cell["source"] if isinstance(cell["source"], str) else "".join(cell["source"])
            if "scatter" in src and "vx" in src:
                print(f"\nCell {i} source:\n{src}\n")
