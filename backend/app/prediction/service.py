"""Prediction service providing singleton instance for API and Evaluator."""

from backend.app.data.loader import load_vessels
from backend.app.prediction.dataset import generate_synthetic_voyage_data, split_by_voyage
from backend.app.prediction.residual_model import PhysicsMLResidualPredictor
from backend.app.prediction.surrogate import FuelSurrogate

_PREDICTOR: PhysicsMLResidualPredictor = None
_SURROGATE: FuelSurrogate = None


def get_predictor() -> PhysicsMLResidualPredictor:
    global _PREDICTOR
    if _PREDICTOR is None:
        vessels = load_vessels()
        predictor = PhysicsMLResidualPredictor(vessels)
        # Train on synthetic voyage data
        df = generate_synthetic_voyage_data(vessels, n_voyages_per_vessel=12, seed=42)
        train_df, val_df = split_by_voyage(df, test_ratio=0.20, seed=42)
        predictor.fit(train_df, val_df)
        _PREDICTOR = predictor
    return _PREDICTOR


def get_surrogate() -> FuelSurrogate:
    global _SURROGATE
    if _SURROGATE is None:
        predictor = get_predictor()
        vessels = load_vessels()
        _SURROGATE = FuelSurrogate(predictor, vessels)
    return _SURROGATE
