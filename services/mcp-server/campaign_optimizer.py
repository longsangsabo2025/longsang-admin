"""
╔═══════════════════════════════════════════════════════════════╗
║           CAMPAIGN OPTIMIZATION AGENT                         ║
║  Phase 2: Auto-optimize campaigns based on performance       ║
╚═══════════════════════════════════════════════════════════════╝

Uses Brain domain agent + A/B testing to optimize campaigns:
- Analyze campaign performance
- Identify winning variants
- Suggest optimizations
- Learn from past campaigns
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict

try:
    from ab_testing import ab_testing_service

    AB_TESTING_AVAILABLE = True
except ImportError:
    AB_TESTING_AVAILABLE = False
    logging.warning("A/B testing service not available")

try:
    from advanced_optimization import advanced_optimization_service

    ADVANCED_OPTIMIZATION_AVAILABLE = True
except ImportError:
    ADVANCED_OPTIMIZATION_AVAILABLE = False
    logging.warning("Advanced optimization service not available")

logger = logging.getLogger(__name__)


@dataclass
class OptimizationRecommendation:
    """Campaign optimization recommendation"""

    recommendation_type: str  # 'pause', 'scale_up', 'modify', 'keep'
    variant: str  # 'A', 'B', or 'all'
    reason: str
    confidence: float
    expected_improvement: Optional[float] = None
    action: str = ""  # Specific action to take


@dataclass
class CampaignPerformance:
    """Campaign performance metrics"""

    campaign_id: str
    variant_a_name: str
    variant_b_name: str
    variant_a_metrics: Dict[str, Any]
    variant_b_metrics: Dict[str, Any]
    variant_a_impressions: int
    variant_b_impressions: int
    variant_a_conversions: int
    variant_b_conversions: int
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str = "active"  # active, paused, completed


class CampaignOptimizer:
    """
    Campaign optimization agent

    Analyzes campaign performance and provides optimization recommendations
    """

    def __init__(self, brain_api_url: Optional[str] = None):
        self.brain_api_url = brain_api_url
        self.ab_testing_available = AB_TESTING_AVAILABLE
        self.advanced_optimization_available = ADVANCED_OPTIMIZATION_AVAILABLE
        self.optimization_history: List[Dict] = []

    async def analyze_campaign(
        self,
        campaign_data: CampaignPerformance,
        min_impressions: int = 1000,
        confidence_level: float = 0.95,
    ) -> Dict:
        """
        Analyze campaign performance and provide optimization recommendations

        Args:
            campaign_data: Campaign performance data
            min_impressions: Minimum impressions required for analysis
            confidence_level: Confidence level for statistical tests

        Returns:
            Dict with analysis results and recommendations
        """
        try:
            # Check if we have enough data
            total_impressions = (
                campaign_data.variant_a_impressions
                + campaign_data.variant_b_impressions
            )

            if total_impressions < min_impressions:
                return {
                    "success": False,
                    "error": f"Insufficient data. Need at least {min_impressions} impressions, got {total_impressions}",
                    "recommendation": {
                        "type": "wait",
                        "reason": "Need more data for statistical significance",
                        "action": "Continue running campaign to gather more data",
                    },
                }

            # Prepare data for A/B testing
            ab_test_data = {
                "variant_a_name": campaign_data.variant_a_name,
                "variant_b_name": campaign_data.variant_b_name,
                "metrics": {},
                "conversions": {
                    "variant_a_conversions": campaign_data.variant_a_conversions,
                    "variant_a_impressions": campaign_data.variant_a_impressions,
                    "variant_b_conversions": campaign_data.variant_b_conversions,
                    "variant_b_impressions": campaign_data.variant_b_impressions,
                },
            }

            # Add continuous metrics if available
            if "CTR" in campaign_data.variant_a_metrics:
                ab_test_data["metrics"]["CTR"] = {
                    "variant_a": campaign_data.variant_a_metrics.get("CTR", []),
                    "variant_b": campaign_data.variant_b_metrics.get("CTR", []),
                }

            if "CPC" in campaign_data.variant_a_metrics:
                ab_test_data["metrics"]["CPC"] = {
                    "variant_a": campaign_data.variant_a_metrics.get("CPC", []),
                    "variant_b": campaign_data.variant_b_metrics.get("CPC", []),
                }

            # Run A/B testing analysis
            if self.ab_testing_available:
                ab_results = ab_testing_service.analyze_campaign_performance(
                    campaign_data=ab_test_data, confidence_level=confidence_level
                )
            else:
                # Fallback: Simple comparison
                ab_results = self._simple_comparison(campaign_data)

            # Generate recommendations
            recommendations = self._generate_recommendations(
                campaign_data=campaign_data,
                ab_results=ab_results,
                confidence_level=confidence_level,
            )

            # Get insights from Brain (if available)
            brain_insights = None
            if self.brain_api_url:
                try:
                    brain_insights = await self._get_brain_insights(
                        campaign_data, ab_results
                    )
                except Exception as e:
                    logger.warning(f"Could not get Brain insights: {e}")

            # Build response
            result = {
                "success": True,
                "campaign_id": campaign_data.campaign_id,
                "analysis": {
                    "total_impressions": total_impressions,
                    "variant_a_impressions": campaign_data.variant_a_impressions,
                    "variant_b_impressions": campaign_data.variant_b_impressions,
                    "variant_a_conversions": campaign_data.variant_a_conversions,
                    "variant_b_conversions": campaign_data.variant_b_conversions,
                    "variant_a_conversion_rate": (
                        campaign_data.variant_a_conversions
                        / campaign_data.variant_a_impressions
                        * 100
                        if campaign_data.variant_a_impressions > 0
                        else 0
                    ),
                    "variant_b_conversion_rate": (
                        campaign_data.variant_b_conversions
                        / campaign_data.variant_b_impressions
                        * 100
                        if campaign_data.variant_b_impressions > 0
                        else 0
                    ),
                },
                "ab_test_results": ab_results,
                "recommendations": [asdict(rec) for rec in recommendations],
                "brain_insights": brain_insights,
                "timestamp": datetime.now().isoformat(),
            }

            # Store in history
            self.optimization_history.append(result)

            return result

        except Exception as e:
            logger.error(f"Error analyzing campaign: {e}")
            return {"success": False, "error": str(e)}

    def _simple_comparison(self, campaign_data: CampaignPerformance) -> Dict:
        """Simple comparison when A/B testing is not available"""
        a_rate = (
            campaign_data.variant_a_conversions / campaign_data.variant_a_impressions
            if campaign_data.variant_a_impressions > 0
            else 0
        )
        b_rate = (
            campaign_data.variant_b_conversions / campaign_data.variant_b_impressions
            if campaign_data.variant_b_impressions > 0
            else 0
        )

        return {
            "success": True,
            "results": [
                {
                    "metric": "Conversion Rate",
                    "variant_a_value": a_rate,
                    "variant_b_value": b_rate,
                    "improvement_percent": (
                        ((b_rate - a_rate) / a_rate * 100) if a_rate > 0 else 0
                    ),
                    "is_significant": False,  # Can't determine without statistical test
                    "winner": (
                        "B" if b_rate > a_rate else "A" if a_rate > b_rate else None
                    ),
                }
            ],
            "summary": {
                "total_tests": 1,
                "significant_tests": 0,
                "overall_winner": (
                    "B" if b_rate > a_rate else "A" if a_rate > b_rate else None
                ),
            },
        }

    def _generate_recommendations(
        self,
        campaign_data: CampaignPerformance,
        ab_results: Dict,
        confidence_level: float,
    ) -> List[OptimizationRecommendation]:
        """Generate optimization recommendations based on A/B test results"""
        recommendations = []

        if not ab_results.get("success"):
            return recommendations

        summary = ab_results.get("summary", {})
        overall_winner = summary.get("overall_winner")
        significant_tests = summary.get("significant_tests", 0)
        total_tests = summary.get("total_tests", 0)

        # Check if we have significant results
        if significant_tests > 0 and overall_winner:
            # We have a clear winner
            winner_variant = overall_winner
            loser_variant = "B" if winner_variant == "A" else "A"

            # Calculate improvement
            results = ab_results.get("results", [])
            avg_improvement = 0
            if results:
                improvements = [
                    r.get("improvement_percent", 0)
                    for r in results
                    if r.get("is_significant")
                ]
                if improvements:
                    avg_improvement = sum(improvements) / len(improvements)

            # Recommendation 1: Scale up winner
            recommendations.append(
                OptimizationRecommendation(
                    recommendation_type="scale_up",
                    variant=winner_variant,
                    reason=f"Variant {winner_variant} is performing significantly better ({avg_improvement:.2f}% improvement)",
                    confidence=confidence_level,
                    expected_improvement=avg_improvement,
                    action=f"Increase budget for variant {winner_variant} by 50-100%",
                )
            )

            # Recommendation 2: Pause or reduce loser
            recommendations.append(
                OptimizationRecommendation(
                    recommendation_type="pause",
                    variant=loser_variant,
                    reason=f"Variant {loser_variant} is underperforming compared to variant {winner_variant}",
                    confidence=confidence_level,
                    expected_improvement=-avg_improvement,
                    action=f"Pause variant {loser_variant} or reduce budget by 50%",
                )
            )
        else:
            # No clear winner - need more data or variants are similar
            if significant_tests == 0:
                recommendations.append(
                    OptimizationRecommendation(
                        recommendation_type="keep",
                        variant="all",
                        reason="No significant difference between variants. Need more data or variants are similar.",
                        confidence=0.5,
                        action="Continue running both variants with equal budget",
                    )
                )
            else:
                # Mixed results
                recommendations.append(
                    OptimizationRecommendation(
                        recommendation_type="modify",
                        variant="all",
                        reason="Mixed results across different metrics. Consider creating new variants.",
                        confidence=0.6,
                        action="Test new creative variations or adjust targeting",
                    )
                )

        # Additional recommendations based on conversion rates
        a_rate = (
            campaign_data.variant_a_conversions
            / campaign_data.variant_a_impressions
            * 100
            if campaign_data.variant_a_impressions > 0
            else 0
        )
        b_rate = (
            campaign_data.variant_b_conversions
            / campaign_data.variant_b_impressions
            * 100
            if campaign_data.variant_b_impressions > 0
            else 0
        )

        # Low conversion rate warning
        if a_rate < 1.0 and b_rate < 1.0:
            recommendations.append(
                OptimizationRecommendation(
                    recommendation_type="modify",
                    variant="all",
                    reason="Both variants have low conversion rates (<1%). Consider improving targeting or creative.",
                    confidence=0.8,
                    action="Review targeting parameters and creative messaging",
                )
            )

        return recommendations

    async def _get_brain_insights(
        self, campaign_data: CampaignPerformance, ab_results: Dict
    ) -> Optional[Dict]:
        """Get insights from Brain domain agent"""
        if not self.brain_api_url:
            return None

        try:
            # Query Brain for similar campaigns or optimization strategies
            import httpx

            query = f"""
            Analyze this ad campaign performance:
            - Product: {campaign_data.campaign_id}
            - Variant A: {campaign_data.variant_a_name}
            - Variant B: {campaign_data.variant_b_name}
            - Conversion rates: A={campaign_data.variant_a_conversions}/{campaign_data.variant_a_impressions}, B={campaign_data.variant_b_conversions}/{campaign_data.variant_b_impressions}

            Provide optimization recommendations based on similar campaigns or industry best practices.
            """

            # This would call Brain API - placeholder for now
            # response = await httpx.post(f"{self.brain_api_url}/query", json={"query": query})

            return {
                "note": "Brain integration pending - would query domain knowledge for optimization insights"
            }
        except Exception as e:
            logger.warning(f"Error getting Brain insights: {e}")
            return None

    def get_optimization_history(self, campaign_id: Optional[str] = None) -> List[Dict]:
        """Get optimization history"""
        if campaign_id:
            return [
                h
                for h in self.optimization_history
                if h.get("campaign_id") == campaign_id
            ]
        return self.optimization_history


# Export service instance
campaign_optimizer = CampaignOptimizer()
