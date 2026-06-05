import json

def update_notebook(path):
    print(f"Updating {path}...")
    with open(path, "r", encoding="utf-8") as f:
        nb = json.load(f)
    
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "code":
            new_source = []
            for line in cell.get("source", []):
                # Replace imports
                if "from sklearn.gaussian_process.kernels import Matern, ConstantKernel as C, WhiteKernel" in line:
                    line = line.replace("Matern, ConstantKernel as C, WhiteKernel", "RBF, ConstantKernel as C")
                
                # Replace kernel instantiation
                if "kernel = C(1.0, (1e-3, 1e3)) * Matern(length_scale=1.0, length_scale_bounds=(1e-2, 1e2), nu=2.5) \\" in line:
                    line = line.replace("Matern(length_scale=1.0, length_scale_bounds=(1e-2, 1e2), nu=2.5) \\", "RBF(length_scale=1.0, length_scale_bounds=(0.5, 10.0))")
                
                if "+ WhiteKernel(noise_level=1, noise_level_bounds=(1e-5, 1e1))" in line:
                    line = line.replace("+ WhiteKernel(noise_level=1, noise_level_bounds=(1e-5, 1e1))", "")
                
                # Update any comments
                if "Kernel: Matern(nu=2.5) + WhiteKernel" in line:
                    line = line.replace("Matern(nu=2.5) + WhiteKernel", "RBF")
                
                new_source.append(line)
            cell["source"] = new_source

    with open(path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2, ensure_ascii=False)
    print(f"Done updating {path}")

update_notebook(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization.ipynb")
update_notebook(r"c:\Users\Khushboo\OneDrive\Desktop\quantam-ai\WS2_CVD_Bayesian_Optimization_Final.ipynb")
