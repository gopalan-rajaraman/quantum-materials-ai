import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, RBF, ConstantKernel as C

class GPModel:
    def __init__(self, kernel_type="matern"):
        if kernel_type == "matern":
            # Matern kernel is generally preferred for physical processes (less smooth than RBF)
            self.kernel = C(1.0, (1e-3, 1e3)) * Matern(length_scale=1.0, length_scale_bounds=(0.5, 20.0), nu=2.5)
        else:
            self.kernel = C(1.0, (1e-3, 1e3)) * RBF(1.0, length_scale_bounds=(0.5, 20.0))
            
        self.model = GaussianProcessRegressor(
            kernel=self.kernel, 
            n_restarts_optimizer=10, 
            normalize_y=True,
            alpha=1e-4 # Reduced noise level so uncertainty collapses aggressively around observations
        )
        self.is_trained = False
        
    def tune_hyperparameters(self, X, y):
        """
        Runs an initial hyperparameter tuning phase on aggregated historical datasets
        to learn the bounds of the chemical space before active optimization begins.
        """
        print(f"Tuning Gaussian Process on {len(X)} historical data points...")
        # In a real scenario, this might involve cross-validation or grid search over kernel bounds
        # For sklearn's GPR, .fit() automatically optimizes the kernel's hyperparameters via L-BFGS-B
        self.model.fit(X, y)
        self.is_trained = True
        
        # Extract the optimized kernel parameters
        optimized_kernel = self.model.kernel_
        return {"message": "Tuning complete", "optimized_kernel": str(optimized_kernel)}
        
    def train(self, X, y):
        """Trains the Gaussian Process on the dataset X, y."""
        self.model.fit(X, y)
        self.is_trained = True
        return self.model
        
    def predict(self, X):
        """Returns the mean and standard deviation at points X."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet. Call train() first.")
        mu, sigma = self.model.predict(X, return_std=True)
        return mu, sigma
