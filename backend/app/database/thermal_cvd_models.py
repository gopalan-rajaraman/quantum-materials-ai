"""
Database models for Thermal CVD experiments and results.
"""

from datetime import datetime
from typing import Optional, Dict, Any


class ThermalCVDExperiment:
    """
    Model for a single Thermal CVD experiment.
    Can be stored in Firebase or any database.
    """

    def __init__(
        self,
        GTE: float,
        GTI: float,
        FRA: float,
        Pressure: float,
        experiment_id: Optional[str] = None,
        status: str = 'planned',
        notes: str = '',
        timestamp: Optional[str] = None,
    ):
        """
        Initialize experiment.

        Args:
            GTE: Growth Temperature (°C)
            GTI: Growth Time (min)
            FRA: Ar Flow Rate (sccm)
            Pressure: Pressure (Torr)
            experiment_id: Unique ID (generated if not provided)
            status: 'planned', 'running', 'completed', 'failed'
            notes: Optional notes
            timestamp: Creation timestamp (auto-generated if not provided)
        """
        import uuid

        self.experiment_id = experiment_id or str(uuid.uuid4())
        self.GTE = GTE
        self.GTI = GTI
        self.FRA = FRA
        self.Pressure = Pressure
        self.status = status
        self.notes = notes
        self.timestamp = timestamp or datetime.utcnow().isoformat()

        # To be filled after experiment
        self.result: Optional['ThermalCVDResult'] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            'experiment_id': self.experiment_id,
            'GTE': self.GTE,
            'GTI': self.GTI,
            'FRA': self.FRA,
            'Pressure': self.Pressure,
            'status': self.status,
            'notes': self.notes,
            'timestamp': self.timestamp,
            'result': self.result.to_dict() if self.result else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ThermalCVDExperiment':
        """Create from dictionary."""
        exp = cls(
            GTE=data['GTE'],
            GTI=data['GTI'],
            FRA=data['FRA'],
            Pressure=data['Pressure'],
            experiment_id=data.get('experiment_id'),
            status=data.get('status', 'planned'),
            notes=data.get('notes', ''),
            timestamp=data.get('timestamp'),
        )
        if data.get('result'):
            exp.result = ThermalCVDResult.from_dict(data['result'])
        return exp


class ThermalCVDResult:
    """
    Results from a completed Thermal CVD experiment.
    """

    def __init__(
        self,
        PL_FWHM: float,
        PL_Peak: float,
        morphology: str = '',
        notes: str = '',
        timestamp: Optional[str] = None,
    ):
        """
        Initialize result.

        Args:
            PL_FWHM: Measured PL FWHM (meV) - the key metric we're minimizing
            PL_Peak: Measured PL Peak Position (eV)
            morphology: Observed morphology class (e.g., 'Monolayer', 'Nanosheets')
            notes: Optional observation notes
            timestamp: Measurement timestamp
        """
        self.PL_FWHM = PL_FWHM
        self.PL_Peak = PL_Peak
        self.morphology = morphology
        self.notes = notes
        self.timestamp = timestamp or datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'PL_FWHM': self.PL_FWHM,
            'PL_Peak': self.PL_Peak,
            'morphology': self.morphology,
            'notes': self.notes,
            'timestamp': self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ThermalCVDResult':
        """Create from dictionary."""
        return cls(
            PL_FWHM=data['PL_FWHM'],
            PL_Peak=data['PL_Peak'],
            morphology=data.get('morphology', ''),
            notes=data.get('notes', ''),
            timestamp=data.get('timestamp'),
        )


class BORecommendationRecord:
    """
    A record of a BO recommendation and whether it was executed.
    """

    def __init__(
        self,
        GTE: float,
        GTI: float,
        FRA: float,
        Pressure: float,
        predicted_FWHM: float,
        uncertainty: float,
        EI_value: float,
        bo_step: int,
        recommendation_id: Optional[str] = None,
        executed: bool = False,
        experiment_id: Optional[str] = None,
        timestamp: Optional[str] = None,
    ):
        """
        Initialize recommendation record.

        Args:
            GTE, GTI, FRA, Pressure: Recommended parameters
            predicted_FWHM: GP-predicted FWHM at this point
            uncertainty: GP uncertainty (std)
            EI_value: Expected Improvement value
            bo_step: Which BO iteration this came from
            recommendation_id: Unique ID for this recommendation
            executed: Whether this recommendation was actually run as an experiment
            experiment_id: If executed, link to the experiment
            timestamp: When this recommendation was generated
        """
        import uuid

        self.recommendation_id = recommendation_id or str(uuid.uuid4())
        self.GTE = GTE
        self.GTI = GTI
        self.FRA = FRA
        self.Pressure = Pressure
        self.predicted_FWHM = predicted_FWHM
        self.uncertainty = uncertainty
        self.EI_value = EI_value
        self.bo_step = bo_step
        self.executed = executed
        self.experiment_id = experiment_id
        self.timestamp = timestamp or datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'recommendation_id': self.recommendation_id,
            'GTE': self.GTE,
            'GTI': self.GTI,
            'FRA': self.FRA,
            'Pressure': self.Pressure,
            'predicted_FWHM': self.predicted_FWHM,
            'uncertainty': self.uncertainty,
            'EI_value': self.EI_value,
            'bo_step': self.bo_step,
            'executed': self.executed,
            'experiment_id': self.experiment_id,
            'timestamp': self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BORecommendationRecord':
        """Create from dictionary."""
        return cls(
            GTE=data['GTE'],
            GTI=data['GTI'],
            FRA=data['FRA'],
            Pressure=data['Pressure'],
            predicted_FWHM=data['predicted_FWHM'],
            uncertainty=data['uncertainty'],
            EI_value=data['EI_value'],
            bo_step=data['bo_step'],
            recommendation_id=data.get('recommendation_id'),
            executed=data.get('executed', False),
            experiment_id=data.get('experiment_id'),
            timestamp=data.get('timestamp'),
        )
