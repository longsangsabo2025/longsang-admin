"""
╔═══════════════════════════════════════════════════════════════╗
║           A/B TESTING FRAMEWORK                               ║
║  Phase 2: Statistical analysis for campaign optimization    ║
╚═══════════════════════════════════════════════════════════════╝

Uses scipy.stats for statistical tests:
- t-test (continuous metrics: CTR, CPC, etc.)
- chi-square (conversion rates)
- Confidence intervals
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

try:
    from scipy import stats
    import numpy as np
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logging.warning("scipy not available. A/B testing will be limited.")

logger = logging.getLogger(__name__)

@dataclass
class ABTestResult:
    """A/B test result"""
    variant_a_name: str
    variant_b_name: str
    metric: str
    variant_a_value: float
    variant_b_value: float
    variant_a_count: int
    variant_b_count: int
    p_value: float
    is_significant: bool
    confidence_level: float
    improvement_percent: float
    winner: Optional[str]  # 'A', 'B', or None
    confidence_interval: Tuple[float, float]
    test_type: str  # 't-test', 'chi-square', etc.

class ABTestingService:
    """
    A/B testing service for ad campaigns

    Statistical tests:
    - t-test: For continuous metrics (CTR, CPC, CPA, etc.)
    - chi-square: For conversion rates
    - Confidence intervals: For effect size estimation
    """

    def __init__(self):
        self.scipy_available = SCIPY_AVAILABLE
        if not self.scipy_available:
            logger.warning("scipy not available. Install with: pip install scipy numpy")

    def test_continuous_metric(
        self,
        variant_a_data: List[float],
        variant_b_data: List[float],
        variant_a_name: str = "Variant A",
        variant_b_name: str = "Variant B",
        metric: str = "CTR",
        confidence_level: float = 0.95
    ) -> ABTestResult:
        """
        Perform t-test for continuous metrics (CTR, CPC, CPA, etc.)

        Args:
            variant_a_data: List of metric values for variant A
            variant_b_data: List of metric values for variant B
            variant_a_name: Name of variant A
            variant_b_name: Name of variant B
            metric: Metric name (e.g., "CTR", "CPC")
            confidence_level: Confidence level (0.95 = 95%)

        Returns:
            ABTestResult with statistical analysis
        """
        if not self.scipy_available:
            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric=metric,
                variant_a_value=0,
                variant_b_value=0,
                variant_a_count=len(variant_a_data),
                variant_b_count=len(variant_b_data),
                p_value=1.0,
                is_significant=False,
                confidence_level=confidence_level,
                improvement_percent=0,
                winner=None,
                confidence_interval=(0, 0),
                test_type="t-test (unavailable)"
            )

        try:
            # Convert to numpy arrays
            a_data = np.array(variant_a_data)
            b_data = np.array(variant_b_data)

            # Calculate means
            a_mean = np.mean(a_data)
            b_mean = np.mean(b_data)

            # Perform t-test (two-sample, independent)
            t_stat, p_value = stats.ttest_ind(a_data, b_data)

            # Calculate improvement
            if a_mean > 0:
                improvement_percent = ((b_mean - a_mean) / a_mean) * 100
            else:
                improvement_percent = 0

            # Determine significance
            alpha = 1 - confidence_level
            is_significant = p_value < alpha

            # Determine winner
            if is_significant:
                winner = "B" if b_mean > a_mean else "A"
            else:
                winner = None

            # Calculate confidence interval for difference
            # Standard error of difference
            se_diff = np.sqrt(
                np.var(a_data, ddof=1) / len(a_data) +
                np.var(b_data, ddof=1) / len(b_data)
            )

            # t-critical value
            df = len(a_data) + len(b_data) - 2
            t_critical = stats.t.ppf(1 - alpha/2, df)

            diff = b_mean - a_mean
            margin = t_critical * se_diff
            ci_lower = diff - margin
            ci_upper = diff + margin

            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric=metric,
                variant_a_value=a_mean,
                variant_b_value=b_mean,
                variant_a_count=len(a_data),
                variant_b_count=len(b_data),
                p_value=float(p_value),
                is_significant=is_significant,
                confidence_level=confidence_level,
                improvement_percent=float(improvement_percent),
                winner=winner,
                confidence_interval=(float(ci_lower), float(ci_upper)),
                test_type="t-test"
            )

        except Exception as e:
            logger.error(f"Error in continuous metric test: {e}")
            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric=metric,
                variant_a_value=0,
                variant_b_value=0,
                variant_a_count=len(variant_a_data),
                variant_b_count=len(variant_b_data),
                p_value=1.0,
                is_significant=False,
                confidence_level=confidence_level,
                improvement_percent=0,
                winner=None,
                confidence_interval=(0, 0),
                test_type="t-test (error)"
            )

    def test_conversion_rate(
        self,
        variant_a_conversions: int,
        variant_a_impressions: int,
        variant_b_conversions: int,
        variant_b_impressions: int,
        variant_a_name: str = "Variant A",
        variant_b_name: str = "Variant B",
        confidence_level: float = 0.95
    ) -> ABTestResult:
        """
        Perform chi-square test for conversion rates

        Args:
            variant_a_conversions: Number of conversions for variant A
            variant_a_impressions: Number of impressions for variant A
            variant_b_conversions: Number of conversions for variant B
            variant_b_impressions: Number of impressions for variant B
            variant_a_name: Name of variant A
            variant_b_name: Name of variant B
            confidence_level: Confidence level (0.95 = 95%)

        Returns:
            ABTestResult with statistical analysis
        """
        if not self.scipy_available:
            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric="Conversion Rate",
                variant_a_value=0,
                variant_b_value=0,
                variant_a_count=variant_a_impressions,
                variant_b_count=variant_b_impressions,
                p_value=1.0,
                is_significant=False,
                confidence_level=confidence_level,
                improvement_percent=0,
                winner=None,
                confidence_interval=(0, 0),
                test_type="chi-square (unavailable)"
            )

        try:
            # Calculate conversion rates
            a_rate = variant_a_conversions / variant_a_impressions if variant_a_impressions > 0 else 0
            b_rate = variant_b_conversions / variant_b_impressions if variant_b_impressions > 0 else 0

            # Create contingency table
            # [conversions, non-conversions]
            a_non_conversions = variant_a_impressions - variant_a_conversions
            b_non_conversions = variant_b_impressions - variant_b_conversions

            contingency_table = [
                [variant_a_conversions, a_non_conversions],
                [variant_b_conversions, b_non_conversions]
            ]

            # Perform chi-square test
            chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

            # Calculate improvement
            if a_rate > 0:
                improvement_percent = ((b_rate - a_rate) / a_rate) * 100
            else:
                improvement_percent = 0

            # Determine significance
            alpha = 1 - confidence_level
            is_significant = p_value < alpha

            # Determine winner
            if is_significant:
                winner = "B" if b_rate > a_rate else "A"
            else:
                winner = None

            # Calculate confidence interval for difference (normal approximation)
            # Standard error of difference
            se_a = np.sqrt(a_rate * (1 - a_rate) / variant_a_impressions) if variant_a_impressions > 0 else 0
            se_b = np.sqrt(b_rate * (1 - b_rate) / variant_b_impressions) if variant_b_impressions > 0 else 0
            se_diff = np.sqrt(se_a**2 + se_b**2)

            # z-critical value (normal distribution for large samples)
            z_critical = stats.norm.ppf(1 - alpha/2)

            diff = b_rate - a_rate
            margin = z_critical * se_diff
            ci_lower = diff - margin
            ci_upper = diff + margin

            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric="Conversion Rate",
                variant_a_value=a_rate,
                variant_b_value=b_rate,
                variant_a_count=variant_a_impressions,
                variant_b_count=variant_b_impressions,
                p_value=float(p_value),
                is_significant=is_significant,
                confidence_level=confidence_level,
                improvement_percent=float(improvement_percent),
                winner=winner,
                confidence_interval=(float(ci_lower), float(ci_upper)),
                test_type="chi-square"
            )

        except Exception as e:
            logger.error(f"Error in conversion rate test: {e}")
            return ABTestResult(
                variant_a_name=variant_a_name,
                variant_b_name=variant_b_name,
                metric="Conversion Rate",
                variant_a_value=0,
                variant_b_value=0,
                variant_a_count=variant_a_impressions,
                variant_b_count=variant_b_impressions,
                p_value=1.0,
                is_significant=False,
                confidence_level=confidence_level,
                improvement_percent=0,
                winner=None,
                confidence_interval=(0, 0),
                test_type="chi-square (error)"
            )

    def analyze_campaign_performance(
        self,
        campaign_data: Dict,
        confidence_level: float = 0.95
    ) -> Dict:
        """
        Analyze A/B test results for a campaign

        Args:
            campaign_data: Campaign data with variants and metrics
            confidence_level: Confidence level

        Returns:
            Dict with analysis results
        """
        results = []

        # Test each metric
        for metric_name, metric_data in campaign_data.get("metrics", {}).items():
            variant_a_data = metric_data.get("variant_a", [])
            variant_b_data = metric_data.get("variant_b", [])

            if len(variant_a_data) > 0 and len(variant_b_data) > 0:
                result = self.test_continuous_metric(
                    variant_a_data=variant_a_data,
                    variant_b_data=variant_b_data,
                    variant_a_name=campaign_data.get("variant_a_name", "Variant A"),
                    variant_b_name=campaign_data.get("variant_b_name", "Variant B"),
                    metric=metric_name,
                    confidence_level=confidence_level
                )
                results.append(result)

        # Test conversion rate if available
        if "conversions" in campaign_data:
            conv_data = campaign_data["conversions"]
            conv_result = self.test_conversion_rate(
                variant_a_conversions=conv_data.get("variant_a_conversions", 0),
                variant_a_impressions=conv_data.get("variant_a_impressions", 0),
                variant_b_conversions=conv_data.get("variant_b_conversions", 0),
                variant_b_impressions=conv_data.get("variant_b_impressions", 0),
                variant_a_name=campaign_data.get("variant_a_name", "Variant A"),
                variant_b_name=campaign_data.get("variant_b_name", "Variant B"),
                confidence_level=confidence_level
            )
            results.append(conv_result)

        # Summary
        significant_results = [r for r in results if r.is_significant]
        winners = {
            "A": sum(1 for r in significant_results if r.winner == "A"),
            "B": sum(1 for r in significant_results if r.winner == "B")
        }

        overall_winner = None
        if winners["A"] > winners["B"]:
            overall_winner = "A"
        elif winners["B"] > winners["A"]:
            overall_winner = "B"

        return {
            "success": True,
            "results": [
                {
                    "variant_a_name": r.variant_a_name,
                    "variant_b_name": r.variant_b_name,
                    "metric": r.metric,
                    "variant_a_value": r.variant_a_value,
                    "variant_b_value": r.variant_b_value,
                    "variant_a_count": r.variant_a_count,
                    "variant_b_count": r.variant_b_count,
                    "p_value": r.p_value,
                    "is_significant": r.is_significant,
                    "confidence_level": r.confidence_level,
                    "improvement_percent": r.improvement_percent,
                    "winner": r.winner,
                    "confidence_interval": r.confidence_interval,
                    "test_type": r.test_type
                }
                for r in results
            ],
            "summary": {
                "total_tests": len(results),
                "significant_tests": len(significant_results),
                "winners": winners,
                "overall_winner": overall_winner
            }
        }

# Export service instance
ab_testing_service = ABTestingService()

