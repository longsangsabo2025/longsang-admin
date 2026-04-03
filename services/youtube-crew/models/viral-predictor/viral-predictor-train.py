#!/usr/bin/env python3
"""
LightGBM Gradient Boosting training script for YouTube viral video prediction.
Predicts viewCount from upload-time metadata using log1p-transformed target.
"""

import os
os.environ['OMP_NUM_THREADS'] = '4'
os.environ['MKL_NUM_THREADS'] = '4'

import sys
import json
import pickle
import signal
import argparse
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import yaml
from scipy import stats
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
import lightgbm as lgb

warnings.filterwarnings('ignore')

# Set all random seeds
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Global state for SIGTERM handling
checkpoint_data = {}
config = {}
output_dir = None


def sigterm_handler(signum, frame):
    """Save checkpoint on SIGTERM."""
    print(f"\n[{datetime.now()}] SIGTERM received, saving checkpoint...")
    if checkpoint_data and output_dir:
        checkpoint_path = Path(output_dir) / "checkpoint_latest.pkl"
        with open(checkpoint_path, 'wb') as f:
            pickle.dump(checkpoint_data, f)
        print(f"[{datetime.now()}] Checkpoint saved to {checkpoint_path}")
    sys.exit(0)


signal.signal(signal.SIGTERM, sigterm_handler)


def load_and_prepare_data(data_dir, test_mode=False, test_max_samples=100):
    """Load data, filter zero views, apply feature engineering."""
    print(f"[{datetime.now()}] Loading data from {data_dir}")

    data_path = Path(data_dir) / "viral-training-data.csv"
    df = pd.read_csv(data_path)

    print(f"[{datetime.now()}] Loaded {len(df)} rows")

    # Filter zero views
    df = df[df['viewCount'] > 0].copy()
    print(f"[{datetime.now()}] After filtering viewCount=0: {len(df)} rows")

    if test_mode:
        df = df.head(test_max_samples)
        print(f"[{datetime.now()}] TEST MODE: Limited to {len(df)} samples")

    # Feature engineering
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

    # Apply log1p transformation to target
    df['log_viewCount'] = np.log1p(df['viewCount'])

    print(f"[{datetime.now()}] Feature engineering complete")

    return df


def get_feature_columns():
    """Define feature columns for modeling."""
    return [
        'publishHour', 'dayOfWeek', 'durationSec', 'titleLength',
        'titleWordCount', 'hasNumber', 'hasQuestion', 'hasEmoji', 'hasColon',
        'durationMin', 'titleAvgWordLen', 'isWeekend', 'isPrimeTime',
        'titleLengthWordProduct', 'durationMin_sq', 'titleLength_sq',
        'durationTitle_interact', 'durationWordCount_interact'
    ]


def stratified_split(df, test_size=0.2, n_bins=5):
    """Stratified train/test split on binned log_viewCount."""
    bins = pd.qcut(df['log_viewCount'], q=n_bins, labels=False, duplicates='drop')

    train_df, test_df = train_test_split(
        df, test_size=test_size, stratify=bins, random_state=RANDOM_SEED
    )

    print(f"[{datetime.now()}] Train: {len(train_df)}, Test: {len(test_df)}")

    return train_df, test_df


def train_fold(X_train, y_train, X_val, y_val, params, num_boost_round=1000,
               early_stopping_rounds=50):
    """Train LightGBM on one fold."""
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

    callbacks = [
        lgb.early_stopping(stopping_rounds=early_stopping_rounds, verbose=False),
        lgb.log_evaluation(period=0)  # Suppress per-iteration output
    ]

    model = lgb.train(
        params,
        train_data,
        num_boost_round=num_boost_round,
        valid_sets=[val_data],
        callbacks=callbacks
    )

    # Predict on validation fold
    y_pred = model.predict(X_val, num_iteration=model.best_iteration)

    return model, y_pred


def cross_validate(train_df, feature_cols, params, num_folds=5,
                   num_boost_round=1000, early_stopping_rounds=50):
    """Perform k-fold cross-validation."""
    print(f"[{datetime.now()}] Starting {num_folds}-fold cross-validation")

    X = train_df[feature_cols].values
    y = train_df['log_viewCount'].values

    # Stratified k-fold on binned targets
    bins = pd.qcut(train_df['log_viewCount'], q=5, labels=False, duplicates='drop')
    skf = StratifiedKFold(n_splits=num_folds, shuffle=True, random_state=RANDOM_SEED)

    fold_models = []
    oof_predictions = np.zeros(len(train_df))
    fold_scores = []

    for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X, bins)):
        print(f"[{datetime.now()}] Training fold {fold_idx + 1}/{num_folds}")

        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # Standardize continuous features
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_val = scaler.transform(X_val)

        # Train fold
        model, y_pred = train_fold(
            X_train, y_train, X_val, y_val, params,
            num_boost_round, early_stopping_rounds
        )

        oof_predictions[val_idx] = y_pred
        fold_models.append((model, scaler))

        # Compute fold metrics
        fold_log_rmse = np.sqrt(mean_squared_error(y_val, y_pred))
        fold_spearman = stats.spearmanr(y_val, y_pred)[0]
        fold_scores.append(fold_log_rmse)

        print(f"[{datetime.now()}] Fold {fold_idx + 1} - log-RMSE: {fold_log_rmse:.4f}, Spearman: {fold_spearman:.4f}")

    # Overall CV metrics
    cv_log_rmse = np.sqrt(mean_squared_error(y, oof_predictions))
    cv_spearman = stats.spearmanr(y, oof_predictions)[0]

    print(f"[{datetime.now()}] CV Results - Mean log-RMSE: {np.mean(fold_scores):.4f} +/- {np.std(fold_scores):.4f}")
    print(f"[{datetime.now()}] Overall log-RMSE: {cv_log_rmse:.4f}, Spearman: {cv_spearman:.4f}")

    return fold_models, cv_log_rmse, cv_spearman, oof_predictions


def train_final_model(train_df, feature_cols, params, num_boost_round=1000):
    """Train final model on full training set."""
    print(f"[{datetime.now()}] Training final model on full training set")

    X_train = train_df[feature_cols].values
    y_train = train_df['log_viewCount'].values

    # Standardize
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    # Train without validation (use full num_boost_round)
    train_data = lgb.Dataset(X_train_scaled, label=y_train)

    model = lgb.train(
        params,
        train_data,
        num_boost_round=num_boost_round,
        callbacks=[lgb.log_evaluation(period=0)]
    )

    return model, scaler


def evaluate_test_set(model, scaler, test_df, feature_cols):
    """Evaluate model on test set."""
    print(f"[{datetime.now()}] Evaluating on test set")

    X_test = test_df[feature_cols].values
    y_test = test_df['log_viewCount'].values
    y_test_raw = test_df['viewCount'].values

    X_test_scaled = scaler.transform(X_test)
    y_pred_log = model.predict(X_test_scaled, num_iteration=model.best_iteration)
    y_pred_raw = np.expm1(y_pred_log)

    # Metrics
    log_rmse = np.sqrt(mean_squared_error(y_test, y_pred_log))
    raw_rmse = np.sqrt(mean_squared_error(y_test_raw, y_pred_raw))
    spearman = stats.spearmanr(y_test, y_pred_log)[0]

    print(f"[{datetime.now()}] Test log-RMSE: {log_rmse:.4f}")
    print(f"[{datetime.now()}] Test raw RMSE: {raw_rmse:.2f}")
    print(f"[{datetime.now()}] Test Spearman: {spearman:.4f}")

    return log_rmse, raw_rmse, spearman


def save_results(output_dir, cv_log_rmse, cv_spearman, test_log_rmse,
                test_raw_rmse, test_spearman, elapsed_time):
    """Save results to JSON."""
    results = {
        "score": cv_log_rmse,  # Primary metric for comparison
        "cv_log_rmse": cv_log_rmse,
        "cv_spearman": cv_spearman,
        "test_log_rmse": test_log_rmse,
        "test_raw_rmse": test_raw_rmse,
        "test_spearman": test_spearman,
        "elapsed_seconds": elapsed_time,
        "timestamp": datetime.now().isoformat()
    }

    results_path = Path(output_dir) / "results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"[{datetime.now()}] Results saved to {results_path}")


def save_checkpoint(output_dir, model, scaler, feature_cols, params):
    """Save model checkpoint."""
    checkpoint = {
        'model': model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'params': params,
        'timestamp': datetime.now().isoformat()
    }

    checkpoint_path = Path(output_dir) / "best_model.pkl"
    with open(checkpoint_path, 'wb') as f:
        pickle.dump(checkpoint, f)

    print(f"[{datetime.now()}] Model checkpoint saved to {checkpoint_path}")


def log_progress(output_dir, step, metrics):
    """Append progress to training_progress.jsonl."""
    progress_entry = {
        "step": step,
        "timestamp": datetime.now().isoformat(),
        **metrics
    }

    progress_path = Path(output_dir) / "training_progress.jsonl"
    with open(progress_path, 'a') as f:
        f.write(json.dumps(progress_entry) + '\n')


def main():
    global checkpoint_data, config, output_dir

    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True, help='Path to config.yaml')
    args = parser.parse_args()

    # Load config
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)

    output_dir = config['output_dir']
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print(f"[{datetime.now()}] Starting training - Output: {output_dir}")
    print(f"[{datetime.now()}] Config: {json.dumps(config, indent=2)}")

    start_time = datetime.now()

    # Load data
    df = load_and_prepare_data(
        config['data_dir'],
        config.get('test_mode', False),
        config.get('test_max_samples', 100)
    )

    # Split data
    train_df, test_df = stratified_split(df, test_size=0.2)

    feature_cols = get_feature_columns()

    # LightGBM parameters
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'boosting_type': 'gbdt',
        'num_leaves': config.get('num_leaves', 31),
        'learning_rate': config.get('learning_rate', 0.05),
        'max_depth': config.get('max_depth', -1),
        'min_child_samples': config.get('min_child_samples', 20),
        'feature_fraction': config.get('feature_fraction', 0.8),
        'bagging_fraction': config.get('bagging_fraction', 0.8),
        'bagging_freq': config.get('bagging_freq', 5),
        'lambda_l1': config.get('lambda_l1', 0.0),
        'lambda_l2': config.get('lambda_l2', 0.0),
        'seed': RANDOM_SEED,
        'verbose': -1,
        'n_jobs': 4  # CPU limit
    }

    # Cross-validation
    num_folds = config.get('num_folds', 5)
    num_boost_round = config.get('num_boost_round', 1000)
    early_stopping_rounds = config.get('early_stopping_rounds', 50)

    fold_models, cv_log_rmse, cv_spearman, oof_predictions = cross_validate(
        train_df, feature_cols, params, num_folds,
        num_boost_round, early_stopping_rounds
    )

    # Log CV results
    log_progress(output_dir, 'cv_complete', {
        'cv_log_rmse': cv_log_rmse,
        'cv_spearman': cv_spearman
    })

    # Train final model on full training set
    final_model, final_scaler = train_final_model(
        train_df, feature_cols, params, num_boost_round
    )

    # Evaluate on test set
    test_log_rmse, test_raw_rmse, test_spearman = evaluate_test_set(
        final_model, final_scaler, test_df, feature_cols
    )

    # Log test results
    log_progress(output_dir, 'test_complete', {
        'test_log_rmse': test_log_rmse,
        'test_raw_rmse': test_raw_rmse,
        'test_spearman': test_spearman
    })

    # Save results
    elapsed_time = (datetime.now() - start_time).total_seconds()
    save_results(
        output_dir, cv_log_rmse, cv_spearman,
        test_log_rmse, test_raw_rmse, test_spearman, elapsed_time
    )

    # Save final model
    save_checkpoint(output_dir, final_model, final_scaler, feature_cols, params)

    # Print summary
    print(f"\n[{datetime.now()}] ========== TRAINING COMPLETE ==========")
    print(f"CV log-RMSE: {cv_log_rmse:.4f}")
    print(f"CV Spearman: {cv_spearman:.4f}")
    print(f"Test log-RMSE: {test_log_rmse:.4f}")
    print(f"Test Spearman: {test_spearman:.4f}")
    print(f"Success criteria: log-RMSE < 1.5, Spearman > 0.4")
    print(f"Elapsed time: {elapsed_time:.2f}s")
    print(f"==========================================\n")

    # Update global checkpoint data
    checkpoint_data = {
        'model': final_model,
        'scaler': final_scaler,
        'feature_cols': feature_cols,
        'params': params
    }


if __name__ == '__main__':
    main()
