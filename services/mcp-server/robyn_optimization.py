"""
╔═══════════════════════════════════════════════════════════════╗
║           ROBYN MARKETING MIX MODELING                         ║
║  Phase 3: Meta's Robyn for marketing mix optimization       ║
╚═══════════════════════════════════════════════════════════════╝

Robyn is Meta's open-source marketing mix modeling (MMM) solution.
This module provides a simplified interface for Robyn integration.

Note: Full Robyn requires R environment. This is a Python wrapper
that can call Robyn via R script or use simplified MMM algorithms.
"""

import logging
import subprocess
import json
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    import numpy as np
    import pandas as pd
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    logger.warning("numpy/pandas not available. Robyn optimization will be limited.")


class RobynOptimizer:
    """
    Robyn Marketing Mix Modeling Optimizer

    Provides simplified MMM functionality:
    - Media channel attribution
    - Budget allocation optimization
    - ROI calculation
    - Channel effectiveness analysis
    """

    def __init__(self, robyn_r_script_path: Optional[str] = None):
        """
        Initialize Robyn optimizer

        Args:
            robyn_r_script_path: Path to Robyn R script (optional)
        """
        self.robyn_r_script_path = robyn_r_script_path
        self.use_r_robyn = robyn_r_script_path and Path(robyn_r_script_path).exists()

    def optimize_budget_allocation(
        self,
        historical_data: List[Dict],
        total_budget: float,
        channels: List[str]
    ) -> Dict:
        """
        Optimize budget allocation across media channels using MMM

        Args:
            historical_data: Historical campaign data
            total_budget: Total budget to allocate
            channels: List of media channels

        Returns:
            Optimized budget allocation
        """
        try:
            if not NUMPY_AVAILABLE:
                return self._simple_budget_allocation(historical_data, total_budget, channels)

            # Convert to DataFrame
            df = pd.DataFrame(historical_data)

            # Calculate channel effectiveness (simplified MMM)
            channel_roi = {}
            channel_spend = {}

            for channel in channels:
                channel_col = f'{channel}_spend'
                if channel_col in df.columns:
                    spend = df[channel_col].sum()
                    conversions = df.get('conversions', df.get('revenue', 0)).sum()
                    channel_spend[channel] = spend
                    if spend > 0:
                        channel_roi[channel] = conversions / spend
                    else:
                        channel_roi[channel] = 0

            # Allocate budget based on ROI (simplified approach)
            # In full Robyn, this would use sophisticated MMM models
            total_roi = sum(channel_roi.values())
            allocations = {}

            if total_roi > 0:
                for channel in channels:
                    # Weighted allocation based on ROI
                    weight = channel_roi.get(channel, 0) / total_roi if total_roi > 0 else 1 / len(channels)
                    allocations[channel] = {
                        'allocated_budget': total_budget * weight,
                        'proportion': weight,
                        'roi': channel_roi.get(channel, 0),
                        'expected_conversions': total_budget * weight * channel_roi.get(channel, 0)
                    }
            else:
                # Equal allocation if no ROI data
                equal_share = total_budget / len(channels)
                for channel in channels:
                    allocations[channel] = {
                        'allocated_budget': equal_share,
                        'proportion': 1 / len(channels),
                        'roi': 0,
                        'expected_conversions': 0
                    }

            return {
                'success': True,
                'total_budget': total_budget,
                'allocations': allocations,
                'method': 'simplified_mmm',
                'note': 'Full Robyn MMM requires R environment. This is a simplified version.'
            }

        except Exception as e:
            logger.error(f"Robyn optimization error: {e}")
            return {
                'success': False,
                'error': str(e),
                'fallback': self._simple_budget_allocation(historical_data, total_budget, channels)
            }

    def _simple_budget_allocation(
        self,
        historical_data: List[Dict],
        total_budget: float,
        channels: List[str]
    ) -> Dict:
        """Simple budget allocation fallback"""
        equal_share = total_budget / len(channels) if channels else total_budget

        allocations = {}
        for channel in channels:
            allocations[channel] = {
                'allocated_budget': equal_share,
                'proportion': 1 / len(channels) if channels else 1,
                'roi': 0,
                'expected_conversions': 0
            }

        return {
            'success': True,
            'total_budget': total_budget,
            'allocations': allocations,
            'method': 'equal_allocation_fallback'
        }

    def calculate_channel_attribution(
        self,
        historical_data: List[Dict],
        channels: List[str]
    ) -> Dict:
        """
        Calculate channel attribution using simplified MMM

        Args:
            historical_data: Historical campaign data
            channels: List of media channels

        Returns:
            Channel attribution results
        """
        try:
            if not NUMPY_AVAILABLE:
                return {
                    'success': False,
                    'error': 'numpy/pandas required for attribution calculation'
                }

            df = pd.DataFrame(historical_data)

            attribution = {}
            total_conversions = df.get('conversions', df.get('revenue', 0)).sum()

            for channel in channels:
                channel_col = f'{channel}_spend'
                if channel_col in df.columns:
                    channel_spend = df[channel_col].sum()
                    total_spend = sum(df.get(f'{c}_spend', 0).sum() for c in channels)

                    if total_spend > 0:
                        # Simplified attribution: proportional to spend
                        # Full Robyn would use sophisticated models
                        attribution[channel] = {
                            'attribution_percent': (channel_spend / total_spend) * 100,
                            'attributed_conversions': (channel_spend / total_spend) * total_conversions if total_conversions > 0 else 0,
                            'spend': channel_spend
                        }

            return {
                'success': True,
                'total_conversions': total_conversions,
                'attribution': attribution,
                'method': 'simplified_proportional',
                'note': 'Full Robyn attribution requires R environment'
            }

        except Exception as e:
            logger.error(f"Attribution calculation error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def call_robyn_r_script(
        self,
        input_data_path: str,
        output_path: str
    ) -> Dict:
        """
        Call full Robyn R script (if available)

        Args:
            input_data_path: Path to input CSV
            output_path: Path to output JSON

        Returns:
            Robyn results
        """
        if not self.use_r_robyn:
            return {
                'success': False,
                'error': 'Robyn R script not configured'
            }

        try:
            # Call R script
            result = subprocess.run(
                ['Rscript', self.robyn_r_script_path, input_data_path, output_path],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes
            )

            if result.returncode == 0:
                # Read output
                with open(output_path, 'r') as f:
                    robyn_results = json.load(f)

                return {
                    'success': True,
                    'results': robyn_results
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr
                }

        except Exception as e:
            logger.error(f"Robyn R script error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Export service instance
robyn_optimizer = RobynOptimizer()

