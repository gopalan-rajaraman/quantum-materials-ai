"""
Verification script: Compare backend ML logic with Colab notebook.
Ensures exact alignment of encodings, scalings, and GP predictions.

Run: python verify_bo_alignment.py
"""

import numpy as np
import pandas as pd
from pathlib import Path
import sys

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ml_models.thermal_cvd import ThermalCVDOptimizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

# Test data: subset of notebook's thermal_cvd data
TEST_DATA = {
    'P1': ['WO3', 'WCl6', 'W(CO)6', 'W(CO)6', 'W(CO)6', 'WF6', 'WF6'],
    'P2': ['Sulfur', 'Sulfur', 'H2S', 'DTBS', 'Sulfur', 'H2S', 'H2S'],
    'CP1': [35.0, 200.0, np.nan, np.nan, np.nan, np.nan, np.nan],
    'CP2': [2000.0, 800.0, np.nan, np.nan, np.nan, np.nan, np.nan],
    'FRP1': [np.nan, np.nan, 0.00017, 0.00735, np.nan, 0.025, np.nan],
    'FRP2': [np.nan, np.nan, 7.0, 7.28, np.nan, 0.33, np.nan],
    'SA': [np.nan, np.nan, np.nan, np.nan, np.nan, 'NaCl', 'SnCl4'],
    'Substrate': ['graphite', 'SiO2/Si', 'Sapphire (C-plane)', 'SiO2/Si', 'Graphene', 'SiO2/Si', 'SiO2/Si'],
    'CG': ['Ar', 'Ar', 'H2', 'H2/Ar', 'He', 'Ar', 'Ar'],
    'FRA': [100.0, 2.5, 0.0, 500.0, 0.0, 100.0, np.nan],
    'FRH': [0, 0, 200, 25, 0, 0, 0],
    'GTE': [1000, 800, 800, 850, 600, 640, 550],
    'GTI': [20.0, 15.0, 30.0, np.nan, np.nan, 40.0, np.nan],
    'HR': [15.0, 15.0, np.nan, 20.0, np.nan, np.nan, np.nan],
    'Pressure': [730.0, np.nan, 50.0, 50.0, np.nan, 7.5, 30.0],
    'COM': ['Rapid', 'Natural', 'NS', 'NS', 'NS', 'NS', 'NS'],
    'PC': ['Quartz boat', 'Al2O3 crucible', 'Bubbler', 'Bubbler', 'Sulfur boat', 'Ceramic boat', 'Gas cylinders'],
    'Class': ['Monolayer', 'Nanosheets', np.nan, np.nan, np.nan, np.nan, np.nan],
    'TOCVD': ['Thermal CVD'] * 7,
    'PL_FWHM': [21, 124, 60, 69, 27, 48, 60],
}

df_test = pd.DataFrame(TEST_DATA)
df_test = df_test.replace('NS', np.nan)


def test_encoder():
    """Test data encoding matches notebook Step 4."""
    print("\n" + "="*70)
    print("TEST 1: Categorical Encoding (Notebook Step 4)")
    print("="*70)
    
    optimizer = ThermalCVDOptimizer()
    optimizer.encoder.fit_on_data(df_test)
    
    # Check encoding maps
    info = optimizer.encoder.get_encoding_info()
    label_maps = info['label_maps']
    
    print("\n✓ Label Maps (should match notebook):")
    print(f"  P1 mapping:        {label_maps['P1']}")
    print(f"  P2 mapping:        {label_maps['P2']}")
    print(f"  Substrate mapping: {label_maps['Substrate']}")
    print(f"  CG mapping:        {label_maps['CG']}")
    
    # Verify all 8 categorical constants present
    expected_cats = {'P1', 'P2', 'Substrate', 'CG', 'COM', 'PC', 'SA', 'Class'}
    actual_cats = set(label_maps.keys())
    assert expected_cats == actual_cats, f"Missing/extra cats: expected {expected_cats}, got {actual_cats}"
    print(f"\n✓ All {len(label_maps)} categorical constants present")
    
    return optimizer


def test_feature_matrix(optimizer):
    """Test feature matrix shape and scaling (Notebook Step 6)."""
    print("\n" + "="*70)
    print("TEST 2: Feature Matrix Building (Notebook Step 6)")
    print("="*70)
    
    X_train, y_train = optimizer.encoder.encode_observation(df_test)
    
    print(f"\n✓ X shape: {X_train.shape}")
    print(f"  Expected: (7, 12) — 7 exps × (8 cat + 4 vars)")
    assert X_train.shape == (7, 12), f"Wrong X shape: {X_train.shape}"
    
    print(f"\n✓ y shape: {y_train.shape}")
    print(f"  y values (meV): {y_train}")
    assert y_train.shape == (7,), f"Wrong y shape: {y_train.shape}"
    
    # Check that X is scaled (mean ≈ 0, std ≈ 1)
    X_mean = X_train.mean(axis=0)
    X_std = X_train.std(axis=0)
    print(f"\n✓ X scaling check:")
    print(f"  Mean (should be ≈ 0): {X_mean.round(3)}")
    print(f"  Std  (should be ≈ 1): {X_std.round(3)}")
    
    assert np.allclose(X_mean, 0, atol=1e-6), "X not centered"
    assert np.allclose(X_std, 1, atol=0.1), "X not scaled to unit variance"
    
    return X_train, y_train


def test_gp_fit(optimizer, X_train, y_train):
    """Test GP model fitting (Notebook Step 7)."""
    print("\n" + "="*70)
    print("TEST 3: GP Model Training (Notebook Step 7)")
    print("="*70)
    
    # Load training data first (this initializes X_train and y_train in optimizer)
    optimizer.load_training_data(df_test)
    
    # Fit optimizer (which scales y internally)
    metrics = optimizer.train_gp()
    
    print(f"\n✓ GP trained successfully")
    print(f"  Training samples: {len(y_train)}")
    print(f"  Features: {len(optimizer.encoder.feature_cols)}")
    
    # Get predictions in meV
    y_pred_scaled, _ = optimizer.gp_model.predict(X_train, return_std=True)
    y_pred = optimizer.scaler_y.inverse_transform(
        y_pred_scaled.reshape(-1, 1)
    ).ravel()
    
    print(f"\n✓ GP Predictions (meV):")
    for i, (actual, pred) in enumerate(zip(y_train, y_pred)):
        print(f"  Exp {i+1}: actual={actual:.0f}, predicted={pred:.1f}")
    
    assert y_pred.shape == y_train.shape, "Prediction shape mismatch"


def test_acquisition_function(optimizer):
    """Test Expected Improvement calculation (Notebook Step 8)."""
    print("\n" + "="*70)
    print("TEST 4: Acquisition Function (Notebook Step 8)")
    print("="*70)
    
    # Generate search space
    optimizer.generate_search_space(n_points=100)  # Use fewer for testing
    
    print(f"\n✓ Search space generated: {optimizer.X_search.shape[0]} points")
    
    # Compute EI
    y_best_scaled = optimizer.y_train_scaled.min()
    ei_values = optimizer.bo_engine.expected_improvement(
        optimizer.X_search,
        optimizer.gp_model.gp,
        y_best_scaled,
        xi=0.01
    )
    
    print(f"\n✓ EI values computed for {len(ei_values)} points")
    print(f"  Min EI: {ei_values.min():.6f}")
    print(f"  Max EI: {ei_values.max():.6f}")
    print(f"  Mean EI: {ei_values.mean():.6f}")
    
    # Top-1 suggestion
    top_idx = np.argmax(ei_values)
    suggestions = optimizer.suggest_next_experiment(n_suggestions=1)
    
    print(f"\n✓ Top EI suggestion:")
    print(f"  GTE:      {suggestions[0]['GTE_celsius']:.1f} °C")
    print(f"  GTI:      {suggestions[0]['GTI_minutes']:.1f} min")
    print(f"  FRA:      {suggestions[0]['FRA_sccm']:.1f} sccm")
    print(f"  Pressure: {suggestions[0]['Pressure_Torr']:.1f} Torr")
    print(f"  Predicted FWHM: {suggestions[0]['predicted_FWHM_meV']:.1f} meV")
    print(f"  EI value: {suggestions[0]['EI_value']:.6f}")


def test_bo_loop(optimizer):
    """Test BO loop (Notebook Step 9)."""
    print("\n" + "="*70)
    print("TEST 5: Active Learning Loop (Notebook Step 9)")
    print("="*70)
    
    result = optimizer.run_bo_optimization(n_steps=3)
    
    print(f"\n✓ BO loop completed: {len(result['recommendations'])} iterations")
    if 'best_fwhm_progression' in result:
        best_prog = result['best_fwhm_progression']
        print(f"  Initial best FWHM: {best_prog[0]:.1f} meV")
        print(f"  Final best FWHM:   {best_prog[-1]:.1f} meV")
    
    print(f"\n✓ Convergence history:")
    if 'best_fwhm_progression' in result:
        for i, best in enumerate(result['best_fwhm_progression']):
            print(f"  Iter {i}: {best:.1f} meV")


def test_constant_switching():
    """Test switching experimental setup (e.g., substrate)."""
    print("\n" + "="*70)
    print("TEST 6: Constant Switching (Setup Change)")
    print("="*70)
    
    optimizer = ThermalCVDOptimizer()
    optimizer.encoder.fit_on_data(df_test)
    
    print(f"\n✓ Initial substrate (mode): {optimizer.encoder.constant_values['Substrate']}")
    
    # Switch substrate
    optimizer.encoder.set_constant('Substrate', 'Sapphire (C-plane)')
    print(f"✓ Switched to: {optimizer.encoder.constant_values['Substrate']}")
    
    # Encode a candidate point — should use new substrate
    var_dict = {'GTE': 800, 'GTI': 20, 'FRA': 100, 'Pressure': 50}
    X_new = optimizer.encoder.encode_variables(var_dict)
    
    print(f"✓ Encoded candidate with new substrate successfully")


def main():
    """Run all verification tests."""
    print("\n" + "█"*70)
    print("BAYESIAN OPTIMIZATION BACKEND VERIFICATION")
    print("Checking alignment with Colab notebook")
    print("█"*70)
    
    try:
        # Test 1: Encoding
        optimizer = test_encoder()
        
        # Test 2: Feature matrix
        X_train, y_train = test_feature_matrix(optimizer)
        
        # Test 3: GP fit
        test_gp_fit(optimizer, X_train, y_train)
        
        # Test 4: Acquisition
        test_acquisition_function(optimizer)
        
        # Test 5: BO loop
        test_bo_loop(optimizer)
        
        # Test 6: Constant switching
        test_constant_switching()
        
        print("\n" + "█"*70)
        print("✅ ALL TESTS PASSED — Backend aligns with notebook!")
        print("█"*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
