#!/usr/bin/env python3
"""
Generate SRT subtitles using faster-whisper (GPU accelerated).
Called by video-composer.js as a subprocess.

Requires: faster-whisper with CUDA support (pip install faster-whisper)
Usage:    python faster-whisper-srt.py <audio_path> <output_dir> [model_size]
"""
import os
import sys
import time


def format_timestamp(seconds):
    """Convert float seconds to SRT format: HH:MM:SS,mmm"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    if len(sys.argv) < 3:
        print(
            "Usage: faster-whisper-srt.py <audio_path> <output_dir> [model_size]",
            file=sys.stderr,
        )
        sys.exit(1)

    audio_path = sys.argv[1]
    output_dir = sys.argv[2]
    model_size = sys.argv[3] if len(sys.argv) > 3 else "medium"

    t0 = time.time()

    from faster_whisper import WhisperModel

    print(f"[faster-whisper] Loading {model_size} on CUDA (float16)...", file=sys.stderr)
    model = WhisperModel(model_size, device="cuda", compute_type="float16")
    print(f"[faster-whisper] Model loaded in {time.time() - t0:.1f}s", file=sys.stderr)

    print(f"[faster-whisper] Transcribing: {audio_path}", file=sys.stderr)
    t1 = time.time()

    segments, info = model.transcribe(
        audio_path,
        language="vi",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    srt_entries = []
    for i, seg in enumerate(segments, 1):
        start = format_timestamp(seg.start)
        end = format_timestamp(seg.end)
        srt_entries.append(f"{i}\n{start} --> {end}\n{seg.text.strip()}\n")

    transcribe_time = time.time() - t1

    base_name = os.path.splitext(os.path.basename(audio_path))[0]
    srt_path = os.path.join(output_dir, f"{base_name}.srt")

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_entries))

    total = time.time() - t0
    print(
        f"[faster-whisper] Done: {len(srt_entries)} segments in {transcribe_time:.1f}s "
        f"(total {total:.1f}s, lang={info.language} p={info.language_probability:.2f})",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
