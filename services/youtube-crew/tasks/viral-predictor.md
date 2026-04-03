# Task: Viral Video Predictor for LyBlack YouTube Channel

## Objective

Build a model that predicts how many views a YouTube video will receive based on its **metadata at upload time** (before the video goes live).

The goal is to help a solo content creator decide which topic/title to publish **before** spending hours producing the video. A good prediction will rank topics by expected viewership so the creator focuses on high-impact content first.

---

## Input Features (available at upload time)

| Column | Type | Description |
|--------|------|-------------|
| `publishHour` | int (0-23) | Hour of day the video is published (UTC) |
| `dayOfWeek` | int (0-6) | Day of week (0=Sunday, 6=Saturday) |
| `durationSec` | int | Video duration in seconds |
| `titleLength` | int | Number of characters in the title |
| `titleWordCount` | int | Number of words in the title |
| `hasNumber` | binary (0/1) | Title contains at least one digit |
| `hasQuestion` | binary (0/1) | Title ends with or contains `?` |
| `hasEmoji` | binary (0/1) | Title contains emoji |
| `hasColon` | binary (0/1) | Title contains `:` (e.g., "How to: ...") |

---

## Target Variable

| Column | Type | Description |
|--------|------|-------------|
| `viewCount` | int | Total view count scraped from YouTube |

Use **log1p(viewCount)** as the actual training target to handle the heavy right skew of viral distributions. Report both log-RMSE and raw RMSE in your evaluation.

---

## Dataset

- File: `viral-training-data.csv`
- Rows: competitor YouTube channel videos (business/motivation/philosophy niche)
- Minimum usable rows: 50 (model should handle small datasets gracefully)
- May contain rows with `viewCount = 0` — filter these out before training

---

## Evaluation Metric

Primary: **RMSE on log1p(viewCount)** (lower is better)
Secondary: **Spearman rank correlation** — does the model correctly rank videos by predicted popularity?

Hold-out split: 80% train / 20% test (time-based if dates are available, random otherwise).

---

## Output Requirements

The final `inference.py` must:

1. Accept a **JSON input** via stdin or command-line argument:
   ```json
   {
     "publishHour": 8,
     "dayOfWeek": 1,
     "durationSec": 720,
     "titleLength": 45,
     "titleWordCount": 8,
     "hasNumber": 0,
     "hasQuestion": 1,
     "hasEmoji": 0,
     "hasColon": 0
   }
   ```

2. Print a **JSON output** to stdout:
   ```json
   {
     "predicted_views": 125000,
     "log_score": 11.73,
     "confidence": "high"
   }
   ```
   - `predicted_views`: `expm1(log_prediction)` rounded to nearest integer
   - `log_score`: raw log1p prediction
   - `confidence`: "high" if log_score > 10, "medium" if 8-10, "low" otherwise

3. Work standalone with just `python inference.py '{"publishHour": 8, ...}'`

4. Load the model checkpoint from the same directory as the script.

---

## Modeling Approach

Try at least 3 approaches, pick the best:
1. **Gradient Boosting** (XGBoost or LightGBM) — usually best for tabular data
2. **Random Forest** — robust baseline
3. **Linear Regression + polynomial features** — interpretable fallback

Feature engineering ideas to explore:
- `durationMin` = `durationSec / 60`
- Interaction: `titleLength * titleWordCount`
- `isWeekend` = 1 if dayOfWeek in [0, 6]
- `isPrimeTime` = 1 if publishHour in [7, 8, 9, 18, 19, 20]

---

## Constraints

- Python 3.10+
- Dependencies: scikit-learn, numpy, pandas, scipy (standard ML stack)
- Do NOT use deep learning (overkill for this dataset size)
- Model file size should be < 50 MB
- Inference time < 100ms per prediction

---

## Success Criteria

The model is "good enough" if:
- Log-RMSE < 1.5 (predicts within ~4x of actual views on average)
- Spearman correlation > 0.4 (correctly ranks relative viral potential)

A 0.5+ Spearman correlation would be excellent for this use case.
