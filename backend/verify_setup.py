#!/usr/bin/env python
"""
Verification and setup script for Thermal CVD ML backend.
Checks dependencies, initializes models, and validates setup.
"""

import sys
import os
from pathlib import Path


def check_dependencies():
    """Check if all required packages are installed."""
    print("🔍 Checking dependencies...")
    
    required_packages = {
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn',
        'pandas': 'Pandas',
        'numpy': 'NumPy',
        'sklearn': 'Scikit-learn',
        'scipy': 'SciPy',
        'openpyxl': 'OpenPyXL',
        'matplotlib': 'Matplotlib',
        'seaborn': 'Seaborn',
    }
    
    missing = []
    for module, name in required_packages.items():
        try:
            __import__(module)
            print(f"  ✓ {name}")
        except ImportError:
            print(f"  ✗ {name} (MISSING)")
            missing.append(module)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print(f"\nInstall with:")
        print(f"  pip install {' '.join(missing)}")
        return False
    
    print("\n✅ All dependencies installed!")
    return True


def check_data_files():
    """Check if training data files exist."""
    print("\n🔍 Checking data files...")
    
    workspace_root = Path(__file__).parent.parent.parent
    data_files = {
        'labelled.xlsx': workspace_root / 'labelled.xlsx',
        'thermal_cvd_rows.xlsx': workspace_root / 'thermal_cvd_rows.xlsx',
    }
    
    found = []
    missing = []
    
    for name, path in data_files.items():
        if path.exists():
            print(f"  ✓ {name} ({path.stat().st_size / 1024:.1f} KB)")
            found.append(name)
        else:
            print(f"  ✗ {name} (not found at {path})")
            missing.append(name)
    
    if not found:
        print("\n⚠️  No training data found!")
        return False
    
    print(f"\n✅ Found {len(found)} data file(s)")
    return True


def check_module_structure():
    """Check if thermal CVD module structure exists."""
    print("\n🔍 Checking module structure...")
    
    backend_root = Path(__file__).parent
    
    required_files = [
        'app/ml_models/thermal_cvd/__init__.py',
        'app/ml_models/thermal_cvd/data_encoder.py',
        'app/ml_models/thermal_cvd/gp_model.py',
        'app/ml_models/thermal_cvd/bayesian_optimization.py',
        'app/ml_models/thermal_cvd/optimizer.py',
        'app/routes/thermal_cvd_routes.py',
        'app/database/thermal_cvd_models.py',
    ]
    
    found = []
    missing = []
    
    for file_path in required_files:
        full_path = backend_root / file_path
        if full_path.exists():
            print(f"  ✓ {file_path}")
            found.append(file_path)
        else:
            print(f"  ✗ {file_path} (MISSING)")
            missing.append(file_path)
    
    if missing:
        print(f"\n⚠️  Missing module files!")
        return False
    
    print(f"\n✅ All module files present")
    return True


def test_imports():
    """Test if thermal CVD modules can be imported."""
    print("\n🔍 Testing imports...")
    
    try:
        print("  Importing ThermalCVDEncoder...", end=" ")
        from app.ml_models.thermal_cvd import ThermalCVDEncoder
        print("✓")
        
        print("  Importing ThermalCVDGPModel...", end=" ")
        from app.ml_models.thermal_cvd import ThermalCVDGPModel
        print("✓")
        
        print("  Importing BayesianOptimizationEngine...", end=" ")
        from app.ml_models.thermal_cvd import BayesianOptimizationEngine
        print("✓")
        
        print("  Importing ThermalCVDOptimizer...", end=" ")
        from app.ml_models.thermal_cvd import ThermalCVDOptimizer
        print("✓")
        
        print("  Importing API routes...", end=" ")
        from app.routes.thermal_cvd_routes import router, init_thermal_cvd_model
        print("✓")
        
        print("\n✅ All imports successful!")
        return True
        
    except ImportError as e:
        print(f"\n✗ Import failed: {e}")
        return False


def quick_model_test():
    """Quick test of model functionality."""
    print("\n🔍 Quick model test...")
    
    try:
        import pandas as pd
        from app.ml_models.thermal_cvd import ThermalCVDOptimizer
        
        workspace_root = Path(__file__).parent.parent.parent
        
        # Try to load data
        data_file = None
        if (workspace_root / 'labelled.xlsx').exists():
            data_file = workspace_root / 'labelled.xlsx'
        elif (workspace_root / 'thermal_cvd_rows.xlsx').exists():
            data_file = workspace_root / 'thermal_cvd_rows.xlsx'
        
        if not data_file:
            print("  ⚠️  No training data available for testing")
            return True
        
        print(f"  Loading training data from {data_file.name}...", end=" ")
        df = pd.read_excel(data_file)
        print("✓")
        
        print(f"  Initializing optimizer...", end=" ")
        opt = ThermalCVDOptimizer()
        print("✓")
        
        print(f"  Encoding data ({len(df)} samples)...", end=" ")
        opt.load_training_data(df)
        print("✓")
        
        print(f"  Generating search space (5000 points)...", end=" ")
        opt.generate_search_space(n_points=5000)
        print("✓")
        
        print(f"  Training GP model...", end=" ")
        metrics = opt.train_gp()
        print("✓")
        
        print(f"\n  Model Metrics:")
        print(f"    MAE: {metrics['MAE_meV']:.2f} meV")
        print(f"    R²: {metrics['R2_score']:.3f}")
        
        print(f"\n  Testing prediction...", end=" ")
        result = opt.predict_fwhm(GTE=800, GTI=20, FRA=100, Pressure=50)
        print("✓")
        print(f"    Predicted FWHM: {result['predicted_FWHM_meV']:.1f} ± {result['uncertainty_meV']:.1f} meV")
        
        print(f"\n  Testing BO suggestions...", end=" ")
        suggestions = opt.suggest_next_experiment(n_suggestions=3)
        print("✓")
        print(f"    Got {len(suggestions)} suggestions")
        
        print("\n✅ Model test successful!")
        return True
        
    except Exception as e:
        print(f"\n✗ Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all checks."""
    print("=" * 60)
    print("🚀 Thermal CVD Backend - Setup Verification")
    print("=" * 60)
    
    results = []
    
    results.append(("Dependencies", check_dependencies()))
    results.append(("Data Files", check_data_files()))
    results.append(("Module Structure", check_module_structure()))
    results.append(("Imports", test_imports()))
    results.append(("Model Test", quick_model_test()))
    
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    
    for check, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{check:<20} {status}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ Setup verification complete! Backend is ready to use.")
        print("\nTo start the server, run:")
        print("  python server.py")
        print("\nThen make API calls to:")
        print("  http://localhost:8000/thermal-cvd/...")
    else:
        print("❌ Setup verification failed. Please fix the issues above.")
        sys.exit(1)
    print("=" * 60)


if __name__ == "__main__":
    main()
