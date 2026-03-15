#!/usr/bin/env python3
"""
VoxCPM-1.5-VN inference script with voice cloning.
Bypasses torchcodec by pre-loading audio with soundfile.
"""

import argparse
import sys
import os
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio

from voxcpm.core import VoxCPM


def load_audio_soundfile(wav_path, target_sr=None):
    """Load audio using soundfile (avoids torchcodec dependency)."""
    data, sr = sf.read(wav_path, dtype="float32")
    if data.ndim == 1:
        data = data[np.newaxis, :]  # (1, T)
    else:
        data = data.T  # (C, T)
    audio = torch.from_numpy(data)
    if target_sr and sr != target_sr:
        audio = torchaudio.functional.resample(audio, sr, target_sr)
        sr = target_sr
    return audio, sr


def monkey_patch_torchaudio_load():
    """Replace torchaudio.load with soundfile-based loader to avoid torchcodec."""
    original_load = torchaudio.load
    def patched_load(uri, *args, **kwargs):
        try:
            return original_load(uri, *args, **kwargs)
        except (RuntimeError, ImportError, OSError):
            print(f"[Patch] torchcodec failed, falling back to soundfile for: {uri}", file=sys.stderr)
            return load_audio_soundfile(uri)
    torchaudio.load = patched_load


def parse_args():
    parser = argparse.ArgumentParser("VoxCPM-1.5-VN Vietnamese TTS")
    parser.add_argument("--ckpt_dir", type=str, default="./pretrained/VoxCPM-1.5-VN")
    parser.add_argument("--text", type=str, required=True)
    parser.add_argument("--prompt_audio", type=str, default="")
    parser.add_argument("--prompt_text", type=str, default="")
    parser.add_argument("--output", type=str, default="output/tts_output.wav")
    parser.add_argument("--cfg_value", type=float, default=2.0)
    parser.add_argument("--inference_timesteps", type=int, default=10)
    parser.add_argument("--max_len", type=int, default=2000)
    parser.add_argument("--min_len", type=int, default=50,
                        help="Minimum generation tokens (prevents early stop). 1 token ≈ 160ms.")
    parser.add_argument("--normalize", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()

    # Monkey-patch torchaudio.load to bypass torchcodec
    monkey_patch_torchaudio_load()

    print(f"[VoxCPM-VN] Loading model: {args.ckpt_dir}", file=sys.stderr)
    model = VoxCPM.from_pretrained(
        hf_model_id=args.ckpt_dir,
        load_denoiser=False,
        optimize=True,
    )

    prompt_wav_path = args.prompt_audio if args.prompt_audio else None
    prompt_text = args.prompt_text if args.prompt_text else None

    print(f"[VoxCPM-VN] Text: '{args.text[:80]}...'", file=sys.stderr)
    if prompt_wav_path:
        print(f"[VoxCPM-VN] Voice cloning from: {prompt_wav_path}", file=sys.stderr)

    audio_np = model.generate(
        text=args.text,
        prompt_wav_path=prompt_wav_path,
        prompt_text=prompt_text,
        cfg_value=args.cfg_value,
        inference_timesteps=args.inference_timesteps,
        max_len=args.max_len,
        min_len=args.min_len,
        normalize=args.normalize,
        denoise=False,
        retry_badcase=True,
        retry_badcase_max_times=3,
    )

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out_path), audio_np, model.tts_model.sample_rate)

    duration = len(audio_np) / model.tts_model.sample_rate
    print(f"[VoxCPM-VN] Saved: {out_path} ({duration:.2f}s, {model.tts_model.sample_rate}Hz)", file=sys.stderr)


if __name__ == "__main__":
    main()
