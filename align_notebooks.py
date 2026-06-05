import json
import re

def fix_notebook(path):
    print(f"Fixing {path}...")
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = ''.join(cell.get('source', []))
            
            # 1. Fix imports
            if 'from sklearn.gaussian_process.kernels import' in source:
                source = re.sub(
                    r'from sklearn\.gaussian_process\.kernels import.*',
                    'from sklearn.gaussian_process.kernels import Matern, ConstantKernel as C, WhiteKernel',
                    source
                )
            
            # 2. Fix Kernel & GP Regressor
            if 'kernel = ' in source and 'GaussianProcessRegressor' in source:
                new_block = (
                    "kernel = (\n"
                    "    C(1.0, (0.1, 10.0))\n"
                    "    * Matern(length_scale=[1.0, 1.0, 1.0, 1.0], length_scale_bounds=(0.1, 10.0), nu=2.5)\n"
                    "    + WhiteKernel(noise_level=1e-3, noise_level_bounds=(1e-4, 1e-1))\n"
                    ")\n"
                    "\n"
                    "gp = GaussianProcessRegressor(\n"
                    "    kernel=kernel,\n"
                    "    n_restarts_optimizer=15,\n"
                    "    normalize_y=True,\n"
                    "    random_state=42\n"
                    ")"
                )
                
                # Use regex to find and replace the whole block from 'kernel = ' to the closing ')' of GP
                source = re.sub(
                    r'kernel = .*?random_state=42\n\)',
                    new_block,
                    source,
                    flags=re.DOTALL
                )
            
            # Split back into lines
            # JSON format requires each string in the array to end with \n (except maybe the last one)
            lines = [line + '\n' for line in source.split('\n')]
            # Remove the extra newline on the very last element if original didn't have it
            if lines:
                lines[-1] = lines[-1].rstrip('\n')
                if not lines[-1]: 
                    lines.pop()
                    if lines: lines[-1] = lines[-1].rstrip('\n') + '\n'
                    
            # Better way: just splitlines(keepends=True)
            cell['source'] = source.splitlines(keepends=True)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)
    print(f"Done fixing {path}")

fix_notebook(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb")
fix_notebook(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization_Final.ipynb")
