"""Separate vocals from background music using demucs, save with soundfile."""
import torch
import soundfile as sf
import numpy as np
from demucs.pretrained import get_model
from demucs.apply import apply_model

INPUT_WAV = r"d:\0.PROJECTS\00-MASTER-ADMIN\apps\admin\services\fish-speech\references\sabo-0211\sample.wav"
OUTPUT_WAV = r"d:\0.PROJECTS\00-MASTER-ADMIN\apps\admin\services\fish-speech\references\sabo-0211\vocals.wav"

print("Loading demucs model...")
model = get_model("htdemucs")
model.to("cuda")
model.eval()

print(f"Reading {INPUT_WAV}...")
data, sr = sf.read(INPUT_WAV)
print(f"  Input: sr={sr}, duration={len(data)/sr:.1f}s, shape={data.shape}")

# Convert to torch tensor [batch, channels, samples]
if data.ndim == 1:
    audio = torch.from_numpy(data).float().unsqueeze(0).unsqueeze(0)
    # Duplicate mono to stereo (demucs expects stereo)
    audio = audio.repeat(1, 2, 1)
else:
    audio = torch.from_numpy(data.T).float().unsqueeze(0)

# Resample to model's sample rate if needed
if sr != model.samplerate:
    import torchaudio
    resampler = torchaudio.transforms.Resample(sr, model.samplerate)
    audio = resampler(audio)
    print(f"  Resampled {sr} -> {model.samplerate}")

print("Separating vocals...")
with torch.no_grad():
    sources = apply_model(model, audio.to("cuda"), device="cuda")

# Find vocals index
vocal_idx = model.sources.index("vocals")
vocals = sources[0, vocal_idx].cpu().numpy()  # [channels, samples]

# Convert to mono
if vocals.ndim > 1:
    vocals_mono = vocals.mean(axis=0)
else:
    vocals_mono = vocals

# Normalize
max_val = np.max(np.abs(vocals_mono))
if max_val > 0:
    vocals_mono = vocals_mono / max_val * 0.95

print(f"  Vocals: duration={len(vocals_mono)/model.samplerate:.1f}s")

# Save with soundfile (no torchcodec needed)
sf.write(OUTPUT_WAV, vocals_mono, model.samplerate, subtype="PCM_16")
size_kb = len(vocals_mono) * 2 / 1024  # 16-bit = 2 bytes per sample
print(f"  Saved: {OUTPUT_WAV} ({size_kb:.0f} KB)")
print("Done!")
