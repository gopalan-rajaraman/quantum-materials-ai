"""
Alias Registry for matching dataset headers to internal variables.
Provides a centralized repository of known aliases for various terms.
"""

from typing import List, Dict

class AliasRegistry:
    """
    Central registry for variable aliases.
    Maps an internal variable name to a list of known aliases/synonyms.
    """
    
    # Static dictionary of aliases. Can be expanded or moved to DB later if needed.
    _ALIASES: Dict[str, List[str]] = {
        # Thermal CVD
        "GTE": [
            "Growth Temp",
            "Growth Temperature",
            "Substrate Temp",
            "Substrate Temperature",
            "Temp",
            "Temperature"
        ],
        "GTI": [
            "Growth Time",
            "Reaction Time",
            "Time"
        ],
        "FRA": [
            "Flow Rate A",
            "Ar Flow",
            "Argon Flow"
        ],
        "Pressure": [
            "Chamber Pressure",
            "System Pressure",
            "Press"
        ],
        "PL_FWHM": [
            "FWHM",
            "PL FWHM",
            "Photoluminescence FWHM",
            "Peak Width"
        ],
        "PL_Peak": [
            "Peak Position",
            "PL Peak",
            "Peak Wavelength"
        ],
        "Exp Number": [
            "Sample ID",
            "Sample Number",
            "Experiment ID",
            "Run ID"
        ]
    }

    @classmethod
    def get_aliases(cls, variable_name: str) -> List[str]:
        """
        Get all known aliases for a given variable.
        """
        return cls._ALIASES.get(variable_name, [])

    @classmethod
    def get_all_aliases(cls) -> Dict[str, List[str]]:
        """
        Get the full alias dictionary.
        """
        return cls._ALIASES
