"""
╔═══════════════════════════════════════════════════════════════╗
║           ADVANCED OPTIMIZATION ALGORITHMS                     ║
║  Phase 3: Multi-armed bandit, Bayesian optimization          ║
╚═══════════════════════════════════════════════════════════════╝

Advanced algorithms for campaign optimization:
- Multi-armed bandit (Thompson Sampling)
- Bayesian optimization
- Time-series forecasting
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import math

try:
    import numpy as np
    from scipy import stats
    from scipy.optimize import minimize
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    logging.warning("numpy/scipy not available. Advanced optimization will be limited.")

logger = logging.getLogger(__name__)

@dataclass
class OptimizationResult:
    """Optimization result"""
    variant: str
    recommended_budget: float
    confidence: float
    expected_improvement: float
    algorithm: str

class AdvancedOptimizationService:
    """
    Advanced optimization algorithms for campaign management

    Algorithms:
    - Multi-armed bandit (Thompson Sampling)
    - Bayesian optimization
    - Time-series forecasting
    """

    def __init__(self):
        self.numpy_available = NUMPY_AVAILABLE
        if not self.numpy_available:
            logger.warning("numpy/scipy not available. Install with: pip install numpy scipy")

    def thompson_sampling(
        self,
        variants: List[Dict],
        total_budget: float,
        alpha: float = 1.0,
        beta: float = 1.0
    ) -> Dict:
        """
        Multi-armed bandit using Thompson Sampling

        Args:
            variants: List of variant data with conversions and impressions
            total_budget: Total budget to allocate
            alpha: Beta distribution alpha parameter (default 1.0)
            beta: Beta distribution beta parameter (default 1.0)

        Returns:
            Dict with budget allocation recommendations
        """
        if not self.numpy_available:
            return {
                "success": False,
                "error": "numpy not available"
            }

        try:
            allocations = []
            total_allocated = 0

            # Calculate Thompson Sampling probabilities
            samples = []
            for variant in variants:
                conversions = variant.get("conversions", 0)
                impressions = variant.get("impressions", 1)

                # Beta distribution parameters
                a = alpha + conversions
                b = beta + (impressions - conversions)

                # Sample from Beta distribution
                sample = np.random.beta(a, b)
                samples.append({
                    "variant": variant.get("variant_id", "unknown"),
                    "sample": sample,
                    "conversion_rate": conversions / impressions if impressions > 0 else 0,
                    "conversions": conversions,
                    "impressions": impressions
                })

            # Sort by sample value (descending)
            samples.sort(key=lambda x: x["sample"], reverse=True)

            # Allocate budget proportionally to samples
            total_sample = sum(s["sample"] for s in samples)

            for sample in samples:
                if total_sample > 0:
                    proportion = sample["sample"] / total_sample
                    allocated = total_budget * proportion
                else:
                    # Equal allocation if no data
                    allocated = total_budget / len(samples)

                allocations.append({
                    "variant": sample["variant"],
                    "allocated_budget": allocated,
                    "proportion": proportion,
                    "confidence": sample["sample"],
                    "conversion_rate": sample["conversion_rate"]
                })
                total_allocated += allocated

            # Normalize to ensure total equals budget
            if total_allocated > 0:
                for alloc in allocations:
                    alloc["allocated_budget"] = (alloc["allocated_budget"] / total_allocated) * total_budget

            return {
                "success": True,
                "algorithm": "thompson_sampling",
                "total_budget": total_budget,
                "allocations": allocations,
                "recommendation": allocations[0] if allocations else None
            }

        except Exception as e:
            logger.error(f"Error in Thompson Sampling: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def bayesian_optimization(
        self,
        campaign_data: Dict,
        objective: str = "maximize_conversions",
        budget_constraint: float = None
    ) -> Dict:
        """
        Bayesian optimization for campaign parameters

        Args:
            campaign_data: Campaign performance data
            objective: Optimization objective (maximize_conversions, minimize_cpa, etc.)
            budget_constraint: Maximum budget constraint

        Returns:
            Dict with optimization recommendations
        """
        if not self.numpy_available:
            return {
                "success": False,
                "error": "numpy not available"
            }

        try:
            # Extract historical data
            variants = campaign_data.get("variants", [])

            if len(variants) < 2:
                return {
                    "success": False,
                    "error": "Need at least 2 variants for optimization"
                }

            # Define objective function
            if objective == "maximize_conversions":
                def objective_func(params):
                    # params: [budget_variant_1, budget_variant_2, ...]
                    total_conversions = 0
                    for i, variant in enumerate(variants):
                        budget = params[i]
                        conv_rate = variant.get("conversion_rate", 0)
                        # Simple linear model (can be improved)
                        conversions = budget * conv_rate / variant.get("cpc", 1)
                        total_conversions += conversions
                    return -total_conversions  # Negative for minimization
            else:
                # Default: minimize CPA
                def objective_func(params):
                    total_cost = sum(params)
                    total_conversions = 0
                    for i, variant in enumerate(variants):
                        budget = params[i]
                        conv_rate = variant.get("conversion_rate", 0)
                        conversions = budget * conv_rate / variant.get("cpc", 1)
                        total_conversions += conversions
                    if total_conversions > 0:
                        return total_cost / total_conversions
                    return float('inf')

            # Constraints
            constraints = []
            if budget_constraint:
                constraints.append({
                    'type': 'eq',
                    'fun': lambda x: sum(x) - budget_constraint
                })

            # Bounds: each variant gets at least 0, at most budget_constraint
            bounds = [(0, budget_constraint or 1000)] * len(variants)

            # Initial guess: equal allocation
            x0 = [(budget_constraint or 1000) / len(variants)] * len(variants)

            # Optimize
            result = minimize(
                objective_func,
                x0,
                method='SLSQP',
                bounds=bounds,
                constraints=constraints
            )

            if result.success:
                allocations = []
                for i, variant in enumerate(variants):
                    allocations.append({
                        "variant": variant.get("variant_id", f"variant_{i}"),
                        "recommended_budget": result.x[i],
                        "conversion_rate": variant.get("conversion_rate", 0),
                        "cpc": variant.get("cpc", 0)
                    })

                return {
                    "success": True,
                    "algorithm": "bayesian_optimization",
                    "objective": objective,
                    "total_budget": sum(result.x),
                    "allocations": allocations,
                    "expected_value": -result.fun if objective == "maximize_conversions" else result.fun
                }
            else:
                return {
                    "success": False,
                    "error": f"Optimization failed: {result.message}"
                }

        except Exception as e:
            logger.error(f"Error in Bayesian optimization: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def forecast_performance(
        self,
        historical_data: List[Dict],
        days_ahead: int = 7
    ) -> Dict:
        """
        Time-series forecasting for campaign performance

        Args:
            historical_data: List of daily performance data
            days_ahead: Number of days to forecast

        Returns:
            Dict with forecasted metrics
        """
        if not self.numpy_available:
            return {
                "success": False,
                "error": "numpy not available"
            }

        try:
            if len(historical_data) < 3:
                return {
                    "success": False,
                    "error": "Need at least 3 data points for forecasting"
                }

            # Extract time series
            dates = [d.get("date") for d in historical_data]
            conversions = [d.get("conversions", 0) for d in historical_data]
            impressions = [d.get("impressions", 0) for d in historical_data]
            spend = [d.get("spend", 0) for d in historical_data]

            # Simple moving average forecast
            window = min(7, len(historical_data))

            forecast_conversions = np.mean(conversions[-window:])
            forecast_impressions = np.mean(impressions[-window:])
            forecast_spend = np.mean(spend[-window:])

            # Trend adjustment (simple linear trend)
            if len(conversions) >= 2:
                trend = (conversions[-1] - conversions[0]) / len(conversions)
                forecast_conversions += trend * days_ahead

            # Generate forecast for each day
            forecast = []
            for i in range(days_ahead):
                forecast.append({
                    "date": (datetime.now() + timedelta(days=i+1)).isoformat(),
                    "conversions": max(0, forecast_conversions + trend * i if len(conversions) >= 2 else forecast_conversions),
                    "impressions": forecast_impressions,
                    "spend": forecast_spend,
                    "conversion_rate": forecast_conversions / forecast_impressions if forecast_impressions > 0 else 0,
                    "cpa": forecast_spend / forecast_conversions if forecast_conversions > 0 else 0
                })

            return {
                "success": True,
                "algorithm": "moving_average_forecast",
                "forecast_days": days_ahead,
                "forecast": forecast,
                "summary": {
                    "total_forecasted_conversions": sum(f["conversions"] for f in forecast),
                    "total_forecasted_spend": sum(f["spend"] for f in forecast),
                    "average_cpa": sum(f["spend"] for f in forecast) / sum(f["conversions"] for f in forecast) if sum(f["conversions"] for f in forecast) > 0 else 0
                }
            }

        except Exception as e:
            logger.error(f"Error in forecasting: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def optimize_budget_allocation(
        self,
        campaign_data: Dict,
        total_budget: float,
        method: str = "thompson_sampling"
    ) -> Dict:
        """
        Optimize budget allocation across variants

        Args:
            campaign_data: Campaign performance data
            total_budget: Total budget to allocate
            method: Optimization method (thompson_sampling, bayesian, equal)

        Returns:
            Dict with budget allocation recommendations
        """
        variants = campaign_data.get("variants", [])

        if method == "thompson_sampling":
            return self.thompson_sampling(variants, total_budget)
        elif method == "bayesian":
            return self.bayesian_optimization(campaign_data, budget_constraint=total_budget)
        else:
            # Equal allocation
            allocation_per_variant = total_budget / len(variants) if variants else 0
            return {
                "success": True,
                "algorithm": "equal_allocation",
                "total_budget": total_budget,
                "allocations": [
                    {
                        "variant": v.get("variant_id", f"variant_{i}"),
                        "allocated_budget": allocation_per_variant,
                        "proportion": 1.0 / len(variants)
                    }
                    for i, v in enumerate(variants)
                ]
            }

# Export service instance
advanced_optimization_service = AdvancedOptimizationService()

