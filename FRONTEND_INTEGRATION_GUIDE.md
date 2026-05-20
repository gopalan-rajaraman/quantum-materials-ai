"""
Frontend Integration Guide for Bayesian Optimization
Complete checklist for implementing the thermal CVD BO interface

Reference: Notebook Steps 1-12
Backend endpoints: /thermal-cvd/*
"""

# ============================================================================
# FRONTEND ARCHITECTURE
# ============================================================================

FRONTEND_WORKFLOW = {
    "Step 1": {
        "title": "Upload Experimental Data",
        "user_action": "Drag-drop Excel file with thermal CVD data",
        "backend_endpoint": "POST /thermal-cvd/train",
        "request_body": {
            "file": "multipart/form-data (Excel/.xlsx)"
        },
        "response": {
            "status": "success|error",
            "n_experiments": "number",
            "fwhm_range": "[min, max]",
            "encoding_info": {
                "categorical_maps": "dict of {col: {value: code}}",
                "variable_ranges": "{var: [min, max]}"
            }
        },
        "ui_components": [
            "FileUpload component",
            "DataPreview table (show first 10 rows)",
            "Stats card (n_exps, FWHM min/max)"
        ]
    },
    "Step 2": {
        "title": "Display Encoding Maps",
        "description": "Show how categories are encoded (Step 4 of notebook)",
        "ui_components": [
            "Tabs for each categorical constant",
            "Table: {Original Value} → {Integer Code}",
            "Counts per category"
        ],
        "example": {
            "P1": {"WO3": 3, "WCl6": 1, "W(CO)6": 0, "WF6": 2},
            "Substrate": {"SiO2/Si": 2, "Sapphire": 1, "graphite": 3, "Graphene": 0}
        }
    },
    "Step 3": {
        "title": "Visualize Variables vs Target",
        "description": "Scatter plots of each variable vs FWHM (Notebook Step 5)",
        "backend_data": "From training response + uploaded data",
        "plots_per_variable": [
            "X: GTE (500-1100 °C) | Y: FWHM (meV)",
            "X: GTI (5-60 min) | Y: FWHM (meV)",
            "X: FRA (0-600 sccm) | Y: FWHM (meV)",
            "X: Pressure (1-760 Torr) | Y: FWHM (meV)"
        ],
        "features": [
            "Blue shaded search space background",
            "Color-code points by FWHM (red=high, green=low)",
            "Show range bounds [min, max] as vertical lines"
        ]
    },
    "Step 4": {
        "title": "Fit Gaussian Process",
        "user_action": "Click 'Train Model' button",
        "backend_endpoint": "POST /thermal-cvd/train (already loaded, just fit GP)",
        "ui_action": "Progress spinner until GP fitted",
        "response": {
            "training_metrics": {
                "n_samples": "number",
                "mae": "Mean Absolute Error (meV)",
                "r2_score": "R² score",
                "kernel_params": "GP kernel configuration"
            }
        }
    },
    "Step 5": {
        "title": "Visualize GP Surrogate (1D Slices)",
        "description": "Show 4 plots: GP mean + 2σ confidence + observed data (Notebook Step 8)",
        "backend_endpoint": "GET /thermal-cvd/gp-slice?variable={GTE|GTI|FRA|Pressure}",
        "request_params": {
            "variable": "which variable to slice (other vars at median)",
            "n_points": "200 (for smooth curve)"
        },
        "response": {
            "x_values": "[500, ..., 1100]",
            "mean": "[y_mean_1, y_mean_2, ...]",
            "std": "[y_std_1, y_std_2, ...]",
            "observations": {
                "x": "[x1, x2, ...] (observed values)",
                "y": "[y1, y2, ...] (observed FWHM)"
            }
        },
        "plot_features": [
            "GP mean line (blue)",
            "±2σ shaded band (light blue)",
            "Observed points (red scatter)",
            "Best point highlighted (green star)",
            "Next suggested point (green dashed line)"
        ]
    },
    "Step 6": {
        "title": "Visualize Acquisition Function (EI)",
        "description": "1D slices of Expected Improvement per variable",
        "backend_endpoint": "GET /thermal-cvd/acquisition?variable={GTE|GTI|FRA|Pressure}",
        "request_params": {"variable": "str"},
        "response": {
            "x_values": "array",
            "ei_values": "array (Expected Improvement)",
            "max_ei_point": "float (x-value with max EI)",
            "max_ei_value": "float (EI at max)"
        },
        "plot_features": [
            "Orange filled area under EI curve",
            "Peak marked with green dot",
            "Next suggested x-value as vertical dashed line"
        ]
    },
    "Step 7": {
        "title": "Display Next Suggested Experiment",
        "description": "Show recommended parameters (Notebook Step 8-9 output)",
        "backend_endpoint": "POST /thermal-cvd/suggest?n_suggestions=5",
        "response": [
            {
                "step": 1,
                "GTE_celsius": 724.7,
                "GTI_minutes": 26.6,
                "FRA_sccm": 224.2,
                "Pressure_Torr": 380.2,
                "predicted_FWHM_meV": 55.9,
                "uncertainty_meV": 12.3,
                "EI_value": 0.055992
            }
        ],
        "ui_components": [
            "Card layout (desktop) or list (mobile)",
            "Parameter name + value + unit + range",
            "Color bar showing normalized position in range [0, 1]",
            "Predicted FWHM with uncertainty range"
        ]
    },
    "Step 8": {
        "title": "Run Experiments & Collect Data",
        "description": "User performs suggested experiments in lab, records results",
        "ui_action": "Form to enter: GTE, GTI, FRA, Pressure, Measured FWHM"
    },
    "Step 9": {
        "title": "Upload New Experiment Results",
        "description": "Upload Excel with new experiments (≥10 recommended)",
        "backend_endpoint": "POST /thermal-cvd/add-experiments",
        "request_body": {
            "file": "Excel with columns: GTE, GTI, FRA, Pressure, PL FWHM"
        },
        "ui_action": "Retrain GP, show convergence",
        "response": {
            "n_total_experiments": "updated count",
            "best_fwhm_new": "float (new minimum FWHM)",
            "improvement": "float (delta from previous best)"
        }
    },
    "Step 10": {
        "title": "Active Learning Loop Visualization",
        "description": "Show BO convergence over multiple iterations (Notebook Step 9)",
        "plots": [
            "Line: Best FWHM progression over iterations",
            "Line: Predicted FWHM per iteration",
            "Bar: EI values per iteration (showing decay)",
            "Line: Suggested variable values (normalized to [0, 1])"
        ]
    },
    "Step 11": {
        "title": "Export Results",
        "description": "Download Excel workbook with results (Notebook Step 12)",
        "backend_endpoint": "GET /thermal-cvd/export",
        "response": "Excel file with sheets:",
        "sheets": [
            "Encoded Database (with GP predictions)",
            "Encoding Maps (label→code mappings)",
            "Next Experiment (recommended parameters)",
            "BO History (convergence data)"
        ]
    }
}


# ============================================================================
# BACKEND API ENDPOINTS (FastAPI)
# ============================================================================

BACKEND_ENDPOINTS = {
    "POST /thermal-cvd/train": {
        "summary": "Upload and train on thermal CVD data",
        "request": "Form with 'file' (Excel upload)",
        "response": {
            "status": "success",
            "n_experiments": int,
            "fwhm_range": [float, float],
            "encoding_info": dict,
            "message": str
        }
    },
    
    "POST /thermal-cvd/generate-search-space": {
        "summary": "Generate 5000 candidate points in variable space",
        "request": {"n_points": int},  # optional, default 5000
        "response": {"status": "success", "n_points": int}
    },
    
    "POST /thermal-cvd/fit-gp": {
        "summary": "Train Gaussian Process on uploaded data",
        "request": {},
        "response": {
            "status": "success",
            "kernel": str,  # kernel description
            "mae": float,  # Mean Absolute Error (meV)
            "r2": float
        }
    },
    
    "GET /thermal-cvd/gp-slice": {
        "summary": "Get 1D GP slice for visualization",
        "params": {
            "variable": "GTE|GTI|FRA|Pressure",
            "n_points": "default 200"
        },
        "response": {
            "variable": str,
            "x_values": [float],
            "mean": [float],
            "std": [float],
            "observations": {
                "x": [float],
                "y": [float],
                "best_idx": int
            }
        }
    },
    
    "GET /thermal-cvd/acquisition": {
        "summary": "Get 1D acquisition function (EI) slice",
        "params": {
            "variable": "GTE|GTI|FRA|Pressure",
            "n_points": "default 200"
        },
        "response": {
            "variable": str,
            "x_values": [float],
            "ei_values": [float],
            "max_ei_point": float,
            "max_ei_value": float
        }
    },
    
    "POST /thermal-cvd/suggest": {
        "summary": "Get next experiments by Expected Improvement",
        "request": {"n_suggestions": int},  # default 5
        "response": [
            {
                "step": int,
                "GTE_celsius": float,
                "GTI_minutes": float,
                "FRA_sccm": float,
                "Pressure_Torr": float,
                "predicted_FWHM_meV": float,
                "uncertainty_meV": float,
                "EI_value": float
            }
        ]
    },
    
    "POST /thermal-cvd/predict": {
        "summary": "Predict FWHM for given parameters",
        "request": {
            "GTE": float,
            "GTI": float,
            "FRA": float,
            "Pressure": float
        },
        "response": {
            "predicted_FWHM_meV": float,
            "uncertainty_meV": float,
            "lower_bound_meV": float,
            "upper_bound_meV": float
        }
    },
    
    "POST /thermal-cvd/add-experiments": {
        "summary": "Add new experimental results and retrain GP",
        "request": "Form with 'file' (Excel with new experiments)",
        "response": {
            "status": "success",
            "n_total": int,
            "best_fwhm": float,
            "improvement_meV": float
        }
    },
    
    "POST /thermal-cvd/run-bo-loop": {
        "summary": "Run active learning BO loop (simulation or real)",
        "request": {"n_steps": int},  # default 10
        "response": {
            "recommendations": [dict],  # same as /suggest response
            "convergence_history": {
                "best_fwhm_progression": [float],
                "ei_values": [float],
                "final_best_fwhm": float
            }
        }
    },
    
    "POST /thermal-cvd/update-constant": {
        "summary": "Switch experimental setup (e.g., substrate)",
        "request": {
            "column": "Substrate|P1|P2|CG|COM|PC|SA|Class",
            "value": str  # new value (e.g., 'Sapphire (C-plane)')
        },
        "response": {
            "status": "success",
            "constant_updated": str,
            "encoding": dict  # new encoding map
        }
    },
    
    "GET /thermal-cvd/export": {
        "summary": "Download results as Excel workbook",
        "response": "Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)"
    },
    
    "GET /thermal-cvd/encoding-info": {
        "summary": "Get current encoding maps and variable ranges",
        "response": {
            "constants": dict,
            "label_maps": dict,
            "variables": [str],
            "variable_ranges": dict,
            "feature_cols": [str],
            "n_features": int
        }
    }
}


# ============================================================================
# FRONTEND COMPONENT STRUCTURE (React)
# ============================================================================

COMPONENT_HIERARCHY = """
<ThermalCVDDashboard>
  ├─ <UploadSection>
  │  ├─ FileUpload
  │  ├─ DataPreview (table)
  │  └─ Stats (n_exp, FWHM range)
  │
  ├─ <EncodingVisualizer>
  │  ├─ Tabs (P1, P2, Substrate, CG, COM, PC, SA, Class)
  │  └─ BarCharts (Category → Code)
  │
  ├─ <VariableExplorer>
  │  ├─ 4x ScatterPlots (GTE, GTI, FRA, Pressure vs FWHM)
  │  └─ SearchSpaceVisualization
  │
  ├─ <GPSurrogate>
  │  ├─ 4x LineCharts (1D GP slices)
  │  └─ Legend (mean, ±2σ, observations, best, next)
  │
  ├─ <AcquisitionFunction>
  │  ├─ 4x AreaCharts (EI per variable)
  │  └─ PeakIndicator (max EI point)
  │
  ├─ <SuggestedExperiments>
  │  ├─ ExperimentCard[] (top N suggestions)
  │  └─ ParameterSliders
  │
  ├─ <ExperimentForm>
  │  ├─ InputFields (GTE, GTI, FRA, Pressure, FWHM)
  │  └─ SubmitButton
  │
  ├─ <ActiveLearningTracker>
  │  ├─ ConvergencePlot (best FWHM over iterations)
  │  ├─ EIDecayPlot
  │  └─ VariableTrajectoryPlot
  │
  ├─ <ConstantsSwitcher>
  │  └─ Dropdowns (Substrate, P1, P2, CG, COM, PC, SA, Class)
  │
  └─ <ExportSection>
     └─ DownloadButton (Excel workbook)
"""


# ============================================================================
# DATA FLOW DIAGRAM
# ============================================================================

DATA_FLOW = """
[User Upload Excel]
          ↓
[POST /thermal-cvd/train]
          ↓
[Encode data + Fit scalers + Fit GP]
          ↓
[Display encoding maps, variable ranges, FWHM stats]
          ↓
[POST /thermal-cvd/generate-search-space]
          ↓
[Generate 5000 candidate points]
          ↓
[GET /thermal-cvd/gp-slice (x4 variables)]
          ↓
[Plot 1D GP surrogate slices]
          ↓
[GET /thermal-cvd/acquisition (x4 variables)]
          ↓
[Plot 1D acquisition function slices]
          ↓
[POST /thermal-cvd/suggest?n_suggestions=5]
          ↓
[Compute top N by EI, show recommendations]
          ↓
[User runs experiments in lab]
          ↓
[User uploads new Excel with results]
          ↓
[POST /thermal-cvd/add-experiments]
          ↓
[Merge data + Retrain GP]
          ↓
[Loop → show convergence]
"""


# ============================================================================
# KEY STATE MANAGEMENT (Redux/Context)
# ============================================================================

REDUX_STATE = {
    "thermalCVD": {
        "training": {
            "status": "idle|loading|success|error",
            "n_experiments": int,
            "fwhm_range": [float, float],
            "error_message": str
        },
        "gp_model": {
            "fitted": bool,
            "kernel_config": dict,
            "mae": float,
            "r2": float
        },
        "encoding": {
            "label_maps": dict,
            "variable_ranges": dict,
            "current_constants": dict  # {col: value}
        },
        "suggestions": {
            "loaded": bool,
            "experiments": [dict],  # from /suggest endpoint
            "selected_index": int
        },
        "convergence": {
            "iterations": int,
            "best_fwhm_progression": [float],
            "ei_values": [float]
        }
    }
}


# ============================================================================
# ERROR HANDLING
# ============================================================================

COMMON_ERRORS = {
    "400_invalid_file": {
        "message": "Invalid file format. Please upload .xlsx with required columns.",
        "required_columns": ["GTE", "GTI", "FRA", "Pressure", "PL FWHM"],
        "ui_action": "Show input validation message, highlight missing columns"
    },
    "422_insufficient_data": {
        "message": "Need at least 5 Thermal CVD experiments to train GP.",
        "ui_action": "Disable Train button until enough data uploaded"
    },
    "500_gp_fit_failed": {
        "message": "GP fitting failed. Check data quality and ranges.",
        "ui_action": "Show error details, suggest data preprocessing"
    },
    "no_model_trained": {
        "message": "Please train model first before getting suggestions.",
        "ui_action": "Disable suggest/predict buttons until GP fitted"
    }
}


# ============================================================================
# TESTING CHECKLIST
# ============================================================================

TESTING_CHECKLIST = """
[ ] Test 1: Upload Excel → Verify encoding maps match notebook
[ ] Test 2: Train GP → Check predictions match notebook's predictions
[ ] Test 3: Generate search space → Verify 5000 points in variable bounds
[ ] Test 4: Get GP slices → Verify plots show observed + GP mean + 2σ
[ ] Test 5: Get EI slices → Verify peaks align with high-uncertainty regions
[ ] Test 6: Get suggestions → Verify top suggestion has highest EI
[ ] Test 7: Make prediction → Input custom parameters, verify FWHM ± uncertainty
[ ] Test 8: Add new experiments → Retrain GP, verify best FWHM updated
[ ] Test 9: Run BO loop (simulation) → Verify convergence progression
[ ] Test 10: Switch constants → Change substrate, verify GP retrains
[ ] Test 11: Export → Download Excel, verify all sheets present
[ ] Test 12: Mobile responsiveness → Charts responsive on mobile
[ ] Test 13: Error handling → Upload invalid file, check error message
[ ] Test 14: Loading states → Verify spinners/progress during training
[ ] Test 15: Accessibility → WCAG 2.1 AA compliance (a11y)
"""
