import numpy as np

def upper_confidence_bound(x, model, kappa=2.576):
    """
    Computes the Upper Confidence Bound at points x based on a Gaussian Process model.
    x: Points to evaluate.
    model: Trained Gaussian Process model (scikit-learn).
    kappa: Exploration-exploitation trade-off parameter (higher = more exploration).
    """
    mu, sigma = model.predict(x, return_std=True)
    ucb = mu + kappa * sigma
    return ucb
