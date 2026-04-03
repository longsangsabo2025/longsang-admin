#!/usr/bin/env python3
"""
Standalone inference script for YouTube viral video prediction.
Loads trained LightGBM model and predicts viewCount from metadata.
"""

import os
import sys
import json
import pickle
import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def engineer_features(df):
    """Apply same feature engineering as training."""
    df = df.copy()

    df['durationMin'] = df['durationSec'] / 60.0
    df['titleAvgWordLen'] = df['titleLength'] / df['titleWordCount'].replace(0, 1)
    df['isWeekend'] = df['dayOfWeek'].isin([0, 6]).astype(int)
    df['isPrimeTime'] = df['publishHour'].isin([7, 8, 9, 18, 19, 20]).astype(int)
    df['titleLengthWordProduct'] = df['titleLength'] * df['titleWordCount']

    # Polynomial interactions
    df['durationMin_sq'] = df['durationMin'] ** 2
    df['titleLength_sq'] = df['titleLength'] ** 2
    df['durationTitle_interact'] = df['durationMin'] * df['titleLength']
    df['durationWordCount_interact'] = df['durationMin'] * df['titleWordCount']

    return df


def get_confidence(log_score):
    """Determine confidence level from log prediction."""
    if log_score > 10:
        return "high"
    elif log_score >= 8:
        return "medium"
    else:
        return "low"


def main():
    parser = argparse.ArgumentParser(description='Predict video views from metadata')
    parser.add_argument('--input', required=True, help='Input data path or JSON string')
    parser.add_argument('--output', required=True, help='Output CSV path')
    args = parser.parse_args()

    # Load model from same directory as script
    script_dir = Path(__file__).parent.absolute()
    model_path = script_dir / "checkpoint.pth"

    if not model_path.exists():
        print(f"ERROR: Model not found at {model_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading model from {model_path}")
    with open(model_path, 'rb') as f:
        checkpoint = pickle.load(f)

    model = checkpoint['model']
    scaler = checkpoint['scaler']
    feature_cols = checkpoint['feature_cols']

    # Load input data
    if args.input.startswith('{'):
        # JSON string input
        data = json.loads(args.input)
        df = pd.DataFrame([data])
    else:
        # File path input - discover files
        input_path = Path(args.input)
        if input_path.is_file():
            df = pd.read_csv(input_path)
        elif input_path.is_dir():
            # Look for test data files
            test_files = list(input_path.glob('*test*.csv'))
            if not test_files:
                # Try to find any CSV that looks like it could be test data
                all_csvs = list(input_path.glob('*.csv'))
                test_files = [f for f in all_csvs if 'test' in f.name.lower()]

            if not test_files:
                # Fall back to training data for demonstration (use first 50 rows)
                training_file = input_path / 'viral-training-data.csv'
                if training_file.exists():
                    print(f"No test data found, using training data for sample submission: {training_file}")
                    df = pd.read_csv(training_file).head(50)
                else:
                    print(f"ERROR: No CSV files found in {input_path}", file=sys.stderr)
                    sys.exit(1)
            else:
                print(f"Found test file: {test_files[0]}")
                df = pd.read_csv(test_files[0])
        else:
            print(f"ERROR: Invalid input path {args.input}", file=sys.stderr)
            sys.exit(1)

    print(f"Loaded {len(df)} samples for prediction")

    # Engineer features
    df = engineer_features(df)

    # Extract features
    X = df[feature_cols].values

    # Standardize
    X_scaled = scaler.transform(X)

    # Predict
    log_predictions = model.predict(X_scaled, num_iteration=model.best_iteration)
    raw_predictions = np.expm1(log_predictions)

    # Create output dataframe
    output_df = pd.DataFrame({
        'predicted_views': raw_predictions.round().astype(int),
        'log_score': log_predictions,
        'confidence': [get_confidence(log_score) for log_score in log_predictions]
    })

    # Add original identifiers if present
    if 'videoId' in df.columns:
        output_df.insert(0, 'videoId', df['videoId'].values)

    # Save predictions
    output_df.to_csv(args.output, index=False)
    print(f"Predictions saved to {args.output}")

    # Sanity check
    non_zero_predictions = (output_df['predicted_views'] > 0).sum()
    print(f"Sanity check: {non_zero_predictions}/{len(output_df)} non-zero predictions")

    if non_zero_predictions == 0:
        print("WARNING: All predictions are zero! Model may not have loaded correctly.", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
