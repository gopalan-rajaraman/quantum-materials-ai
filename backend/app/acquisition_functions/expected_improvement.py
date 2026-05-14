import numpy as np
from scipy.stats import norm

def expected_improvement(x, model, best_y, xi=0.01):
    """
    Computes the Expected Improvement at points x based on a Gaussian Process model.
    x: Points to evaluate.
    model: Trained Gaussian Process model (scikit-learn).
    best_y: The best (maximum) target value observed so far.
    xi: Exploration-exploitation trade-off parameter.
    """
    mu, sigma = model.predict(x, return_std=True)
    
    with np.errstate(divide='warn'):
        imp = mu - best_y - xi
        Z = imp / sigma
        ei = imp * norm.cdf(Z) + sigma * norm.pdf(Z)
        ei[sigma == 0.0] = 0.0

    return ei
