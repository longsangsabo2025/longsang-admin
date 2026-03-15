#!/usr/bin/env python3
"""
VoxCPM-1.5-VN TTS API Server
FastAPI server compatible with voice-producer.js pipeline.

Endpoints:
  GET  /v1/health   → Health check
  POST /v1/tts      → Text-to-speech with voice cloning

Usage:
  python server.py [--port 8100] [--host 0.0.0.0]
"""

import argparse
import asyncio
import io
import sys
import time
import traceback
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field


# ── Monkey-patch torchaudio.load (torchcodec FFmpeg DLL workaround) ──────────

def load_audio_soundfile(wav_path, target_sr=None):
    """Load audio using soundfile (avoids torchcodec FFmpeg DLL issue)."""
    data, sr = sf.read(str(wav_path), dtype="float32")
    if data.ndim == 1:
        data = data[np.newaxis, :]
    else:
        data = data.T
    audio = torch.from_numpy(data)
    if target_sr and sr != target_sr:
        audio = torchaudio.functional.resample(audio, sr, target_sr)
        sr = target_sr
    return audio, sr


def monkey_patch_torchaudio_load():
    original_load = torchaudio.load
    def patched_load(uri, *args, **kwargs):
        try:
            return original_load(uri, *args, **kwargs)
        except (RuntimeError, ImportError, OSError):
            print(f"[Patch] torchcodec fallback → soundfile: {uri}", file=sys.stderr)
            return load_audio_soundfile(uri)
    torchaudio.load = patched_load


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="VoxCPM-1.5-VN TTS Server", version="1.0.0")

# Global model state
model = None
voice_ref_path = None
voice_ref_text = None
sample_rate = 44100


class TTSRequest(BaseModel):
    text: str = Field(..., description="Vietnamese text to synthesize")
    reference_id: str = Field(default="", description="Ignored (kept for Fish Speech compat)")
    prompt_text: str = Field(default="", description="Transcript of reference audio (optional)")
    cfg_value: float = Field(default=2.0, ge=0.5, le=5.0)
    inference_timesteps: int = Field(default=25, ge=1, le=50, description="Higher = better quality, slower")
    max_len: int = Field(default=2000, ge=100, le=5000)
    min_len: int = Field(default=50, ge=0, le=500)
    normalize: bool = Field(default=False)
    voice_clone: bool = Field(default=True, description="Enable voice cloning")
    speed: float = Field(default=0.92, ge=0.5, le=2.0, description="Playback speed multiplier (0.92 = slightly slower for podcast)")


whisper_model = None


def _get_whisper():
    global whisper_model
    if whisper_model is None:
        from faster_whisper import WhisperModel
        whisper_model = WhisperModel("medium", device="cuda", compute_type="float16")
        print("[Server] Whisper medium loaded on CUDA", file=sys.stderr)
    return whisper_model


def _transcribe_audio(audio_np, sr):
    """Transcribe audio numpy array using faster-whisper."""
    wm = _get_whisper()
    tmp = io.BytesIO()
    sf.write(tmp, audio_np, sr, format="WAV", subtype="PCM_16")
    tmp.seek(0)
    segments, info = wm.transcribe(tmp, language="vi", beam_size=3, vad_filter=True)
    text = " ".join(seg.text.strip() for seg in segments)
    return text, info.language_probability


def _word_overlap(original: str, transcribed: str) -> float:
    """Compute word-level overlap between original and transcribed text."""
    def normalize(s):
        return set(s.lower().strip().split())
    a, b = normalize(original), normalize(transcribed)
    if not a or not b:
        return 0.0
    overlap = len(a & b)
    return (2 * overlap) / (len(a) + len(b))


@app.get("/v1/health")
async def health():
    return {
        "status": "ok",
        "model": "VoxCPM-1.5-VN",
        "device": str(next(model.tts_model.parameters()).device) if model else "unloaded",
        "voice_ref": str(voice_ref_path) if voice_ref_path else None,
        "whisper": "available",
    }


def _generate_sync(req: TTSRequest):
    """Run TTS generation synchronously (called from thread pool)."""
    prompt_wav = str(voice_ref_path) if (req.voice_clone and voice_ref_path) else None
    prompt_text_val = voice_ref_text if (req.voice_clone and voice_ref_text) else None
    if req.prompt_text:
        prompt_text_val = req.prompt_text

    audio_np = model.generate(
        text=req.text,
        prompt_wav_path=prompt_wav,
        prompt_text=prompt_text_val,
        cfg_value=req.cfg_value,
        inference_timesteps=req.inference_timesteps,
    )

    if req.speed != 1.0 and 0.5 <= req.speed <= 2.0:
        effective_sr = int(sample_rate * req.speed)
        audio_tensor = torch.from_numpy(audio_np).unsqueeze(0).float()
        audio_tensor = torchaudio.functional.resample(audio_tensor, effective_sr, sample_rate)
        audio_np = audio_tensor.squeeze(0).numpy()

    buf = io.BytesIO()
    sf.write(buf, audio_np, sample_rate, format="WAV", subtype="PCM_16")
    return audio_np, buf.getvalue()


@app.post("/v1/tts")
async def tts(req: TTSRequest):
    if model is None:
        raise HTTPException(503, "Model not loaded")

    if not req.text or len(req.text.strip()) < 2:
        raise HTTPException(400, "Text too short")

    t0 = time.time()

    try:
        loop = asyncio.get_event_loop()
        audio_np, wav_bytes = await loop.run_in_executor(None, _generate_sync, req)

        duration = len(audio_np) / sample_rate
        elapsed = time.time() - t0
        rtf = elapsed / duration if duration > 0 else 0

        print(
            f"[TTS] {len(req.text)} chars -> {duration:.2f}s audio, "
            f"RTF={rtf:.2f}, elapsed={elapsed:.1f}s",
            file=sys.stderr,
        )

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "X-Audio-Duration": f"{duration:.2f}",
                "X-Processing-Time": f"{elapsed:.2f}",
                "X-RTF": f"{rtf:.3f}",
            },
        )

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[TTS ERROR] {e}\n{tb}", file=sys.stderr)
        raise HTTPException(500, detail=f"TTS failed: {str(e)}")


class TTSVerifyRequest(BaseModel):
    text: str = Field(..., description="Vietnamese text to synthesize and verify")
    cfg_value: float = Field(default=2.0, ge=0.5, le=5.0)
    inference_timesteps: int = Field(default=25, ge=1, le=50)
    speed: float = Field(default=0.92, ge=0.5, le=2.0)
    voice_clone: bool = Field(default=True)
    min_similarity: float = Field(default=0.3, ge=0.0, le=1.0,
                                  description="Minimum word overlap to pass")


def _tts_verify_sync(req: TTSVerifyRequest):
    """Generate TTS then verify with Whisper in one shot."""
    tts_req = TTSRequest(
        text=req.text, cfg_value=req.cfg_value,
        inference_timesteps=req.inference_timesteps,
        speed=req.speed, voice_clone=req.voice_clone,
    )
    audio_np, wav_bytes = _generate_sync(tts_req)
    transcript, lang_prob = _transcribe_audio(audio_np, sample_rate)
    similarity = _word_overlap(req.text, transcript)
    return audio_np, wav_bytes, transcript, similarity, lang_prob


@app.post("/v1/tts-verify")
async def tts_verify(req: TTSVerifyRequest):
    """TTS + Whisper back-check in one call. Returns JSON with audio (base64) + verification."""
    import base64

    if model is None:
        raise HTTPException(503, "Model not loaded")
    if not req.text or len(req.text.strip()) < 2:
        raise HTTPException(400, "Text too short")

    t0 = time.time()
    try:
        loop = asyncio.get_event_loop()
        audio_np, wav_bytes, transcript, similarity, lang_prob = \
            await loop.run_in_executor(None, _tts_verify_sync, req)

        duration = len(audio_np) / sample_rate
        elapsed = time.time() - t0
        passed = similarity >= req.min_similarity

        verdict = "PASS" if passed else "FAIL"
        print(
            f"[VERIFY] {verdict} sim={similarity:.2f} | "
            f"in={req.text[:50]}... | out={transcript[:50]}... | "
            f"{duration:.1f}s audio, {elapsed:.1f}s total",
            file=sys.stderr,
        )

        return {
            "pass": passed,
            "similarity": round(similarity, 3),
            "original": req.text,
            "transcribed": transcript,
            "duration": round(duration, 2),
            "elapsed": round(elapsed, 2),
            "language_probability": round(lang_prob, 3),
            "audio_base64": base64.b64encode(wav_bytes).decode() if passed else None,
            "audio_size": len(wav_bytes),
        }

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[VERIFY ERROR] {e}\n{tb}", file=sys.stderr)
        raise HTTPException(500, detail=f"TTS verify failed: {str(e)}")


@app.post("/v1/stt")
async def stt(audio: bytes = None):
    """Transcribe uploaded WAV audio to text using Whisper."""
    from fastapi import UploadFile, File

    raise HTTPException(501, "Use /v1/tts-verify for integrated TTS+STT verification")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    global model, voice_ref_path, voice_ref_text, sample_rate

    parser = argparse.ArgumentParser("VoxCPM-1.5-VN TTS Server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8100)
    parser.add_argument("--ckpt_dir", default="./pretrained/VoxCPM-1.5-VN")
    parser.add_argument("--voice_ref", default="", help="Path to voice reference WAV (10s recommended)")
    parser.add_argument("--voice_ref_text", default="", help="Transcript of reference audio")
    args = parser.parse_args()

    # Monkey-patch before importing VoxCPM (it uses torchaudio internally)
    monkey_patch_torchaudio_load()

    from voxcpm.core import VoxCPM

    print(f"[Server] Loading VoxCPM-1.5-VN from {args.ckpt_dir}...", file=sys.stderr)
    model = VoxCPM.from_pretrained(
        hf_model_id=args.ckpt_dir,
        load_denoiser=False,
        optimize=True,
    )
    sample_rate = model.tts_model.sample_rate
    print(f"[Server] Model loaded. Device: cuda, Sample rate: {sample_rate}Hz", file=sys.stderr)

    if args.voice_ref and Path(args.voice_ref).exists():
        voice_ref_path = Path(args.voice_ref).resolve()
        voice_ref_text = args.voice_ref_text or None

        # Auto-transcribe reference audio if no text provided
        if voice_ref_text is None:
            print(f"[Server] Auto-transcribing reference audio with Whisper...", file=sys.stderr)
            try:
                import whisper
                whisper_model = whisper.load_model("medium")
                result = whisper_model.transcribe(str(voice_ref_path), language="vi")
                voice_ref_text = result.get("text", "").strip()
                if voice_ref_text:
                    print(f"[Server] Voice ref transcript: {voice_ref_text[:100]}...", file=sys.stderr)
                else:
                    voice_ref_text = "Xin chào các bạn, chào mừng đến với kênh Đứng Dậy Đi."
                    print(f"[Server] Whisper returned empty — using default text", file=sys.stderr)
                del whisper_model  # free VRAM
                torch.cuda.empty_cache()
            except Exception as e:
                voice_ref_text = "Xin chào các bạn, chào mừng đến với kênh Đứng Dậy Đi."
                print(f"[Server] Whisper failed ({e}), using default text", file=sys.stderr)

        print(f"[Server] Voice reference: {voice_ref_path}", file=sys.stderr)
    else:
        print("[Server] No voice reference — TTS only (no cloning)", file=sys.stderr)

    print(f"[Server] Starting on http://{args.host}:{args.port}", file=sys.stderr)
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
