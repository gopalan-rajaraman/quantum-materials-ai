import difflib
from typing import List, Dict, Any, Optional
from app.services.alias_registry import AliasRegistry

class MatchingEngine:
    """
    Engine to match dataset columns to required experiment variables.
    Hierarchy: Template -> Exact -> Alias -> Fuzzy -> Unmapped
    """

    @classmethod
    def match_columns(
        cls, 
        required_variables: List[Dict[str, Any]], 
        file_columns: List[str], 
        template: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Returns a list of mapping suggestions for the UI.
        Each item is like:
        {
            "internal_name": "GTE",
            "description": "Growth Temperature",
            "mapped_column": "Substrate Temp",
            "confidence": "Alias Match", # Template Match, Exact Match, Alias Match, Fuzzy Match (XX%), Unmapped
            "type": "numeric"
        }
        """
        results = []
        available_columns = set(file_columns)

        for var in required_variables:
            var_name = var["name"]
            desc = var.get("desc", "")
            var_type = var.get("type", "unknown")

            mapped_col = None
            confidence = "Unmapped"

            # 1. Template Match
            if template and var_name in template:
                t_col = template[var_name]
                if t_col in available_columns:
                    mapped_col = t_col
                    confidence = "Template Match"

            # 2. Exact Match
            if not mapped_col:
                if var_name in available_columns:
                    mapped_col = var_name
                    confidence = "Exact Match"

            # 3. Alias Match
            if not mapped_col:
                aliases = AliasRegistry.get_aliases(var_name)
                for alias in aliases:
                    if alias in available_columns:
                        mapped_col = alias
                        confidence = "Alias Match"
                        break

            # 4. Fuzzy Match
            if not mapped_col:
                # Get all possible names (name + aliases)
                all_targets = [var_name] + AliasRegistry.get_aliases(var_name)
                best_match = None
                best_score = 0.0

                for col in available_columns:
                    # check against all targets
                    for target in all_targets:
                        seq = difflib.SequenceMatcher(None, col.lower(), target.lower())
                        score = seq.ratio()
                        if score > best_score:
                            best_score = score
                            best_match = col

                if best_match and best_score > 0.8: # Threshold of 80%
                    mapped_col = best_match
                    confidence = f"Fuzzy Match ({int(best_score * 100)}%)"

            if mapped_col:
                available_columns.remove(mapped_col)

            results.append({
                "internal_name": var_name,
                "description": desc,
                "mapped_column": mapped_col,
                "confidence": confidence,
                "type": var_type
            })

        return results
