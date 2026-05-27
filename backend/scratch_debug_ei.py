import sys
sys.path.append('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/quantum-materials-ai/backend')

import pandas as pd
import numpy as np
from app.ml_models.thermal_cvd.optimizer import ThermalCVDOptimizer

def main():
    opt = ThermalCVDOptimizer()
    df = pd.read_excel('c:/Users/Khushboo/OneDrive/Desktop/quantam-ai/labelled.xlsx')
    df = df[df['TOCVD'] == 'Thermal CVD'].copy()
    
    opt.load_training_data(df)
    opt.generate_search_space(n_points=100)
    opt.train_gp()
    
    unscaled_last_x = opt.encoder.scaler_X.inverse_transform([opt.X_train[-1]])[0]
    var_map = {var: i for i, var in enumerate(opt.encoder.VARIABLES)}
    fixed_params = {
        'GTI': float(unscaled_last_x[var_map['GTI']]),
        'FRA': float(unscaled_last_x[var_map['FRA']]),
        'Pressure': float(unscaled_last_x[var_map['Pressure']])
    }
    
    gte_bounds = opt.encoder.VARIABLE_RANGES['GTE']
    gte_range = np.linspace(gte_bounds[0], gte_bounds[1], 100)
    
    var_dicts = []
    for gte in gte_range:
        var_dicts.append({
            'GTE': float(gte),
            'GTI': fixed_params['GTI'],
            'FRA': fixed_params['FRA'],
            'Pressure': fixed_params['Pressure']
        })
        
    X_search_list = [opt.encoder.encode_variables(vd)[0] for vd in var_dicts]
    X_sweep = np.array(X_search_list)
    
    ei_history = opt.get_ei_history(X_sweep)
    print("EI History shapes:", [len(e) for e in ei_history])
    for i, ei_curve in enumerate(ei_history):
        # Print min and max of each curve to see if it's flat
        print(f"Step {i} EI min/max:", np.min(ei_curve), np.max(ei_curve))

if __name__ == '__main__':
    main()
