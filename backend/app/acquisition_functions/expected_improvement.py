import numpy as np
from scipy.stats import norm


def expected_improvement(x, model, best_y, xi=0.01):
    """
    Computes Expected Improvement for MINIMIZATION at points x.

    We minimize PL FWHM, so improvement = best_y - mu (lower FWHM is better).
    Matches notebook Step 8:
        imp = y_best_scaled - mu - xi
        Z   = imp / sigma
        ei  = imp * norm.cdf(Z) + sigma * norm.pdf(Z)

    Args:
        x:      Points to evaluate (scaled feature matrix).
        model:  Trained Gaussian Process (scikit-learn).
        best_y: Current best (minimum) observed FWHM in scaled space.
        xi:     Exploration-exploitation trade-off (default 0.01).

    Returns:
        EI values for each point (higher = more promising to try next).
    """
    mu, sigma = model.predict(x, return_std=True)
    sigma = np.maximum(sigma, 1e-9)  # numerical stability — matches notebook

    # Minimization: improvement = best_y - mu - xi
    imp = best_y - mu - xi
    Z = imp / sigma
    ei = imp * norm.cdf(Z) + sigma * norm.pdf(Z)
    ei[sigma < 1e-9] = 0.0

    return ei
