import base64
import json
from pathlib import Path
import re
import requests

PROJECT = "https://diexsbzqwsbpilsymnfb.supabase.co"
SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"
GEMINI_KEY = "AIzaSyDUDKmoF09Z1k1uUrb9suJzSe0FF3ycyMw"
RUN_ID = "step_scriptWriter_1772691110039"
CHANNEL = "dung-day-di"
VOICE = "Algenib"

headers = {"apikey": SERVICE, "Authorization": f"Bearer {SERVICE}"}

# 1) Load run
r = requests.get(
    f"{PROJECT}/rest/v1/pipeline_runs",
    headers=headers,
    params={"select": "pipeline_id,stages,input,status", "pipeline_id": f"eq.{RUN_ID}"},
    timeout=30,
)
r.raise_for_status()
rows = r.json()
if not rows:
    raise SystemExit("Run not found")
row = rows[0]
stages = row.get("stages") or {}
result = stages.get("result") or {"outputDir": "remote", "files": {}}
files = result.get("files") or {}

script_txt = files.get("script.txt")
if isinstance(script_txt, dict):
    script_txt = script_txt.get("script") or ""
if not isinstance(script_txt, str) or not script_txt.strip():
    raise SystemExit("script.txt missing or invalid")

def clean_text_for_tts(text: str) -> str:
    t = text or ""
    # Remove fenced code blocks wrappers and markdown noise from script.txt.
    t = t.replace("```", "\n")
    t = re.sub(r"^\s*---\s*\d{2}:\d{2}:\d{2}\s+SECTION\s+---.*$", "", t, flags=re.M)
    t = re.sub(r"^\s*\*\*\(.*?\)\*\*\s*$", "", t, flags=re.M)
    t = re.sub(r"\*\*(.*?)\*\*", r"\1", t)
    t = re.sub(r"^\s*VOICE\s*:\s*", "", t, flags=re.M)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

text = clean_text_for_tts(script_txt)
print(f"script chars raw={len(script_txt.strip())} cleaned={len(text)}")

def split_chunks(t: str, max_len: int = 1800):
    if len(t) <= max_len:
        return [t]
    parts = []
    cur = ""
    for p in t.split("\n\n"):
        p = p.strip()
        if not p:
            continue
        candidate = (cur + "\n\n" + p).strip() if cur else p
        if len(candidate) <= max_len:
            cur = candidate
        else:
            if cur:
                parts.append(cur)
                cur = ""
            if len(p) <= max_len:
                cur = p
            else:
                # hard split very long paragraph
                for i in range(0, len(p), max_len):
                    parts.append(p[i:i + max_len])
    if cur:
        parts.append(cur)
    return parts

# 2) Generate single Gemini TTS audio (one call)
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={GEMINI_KEY}"
payload = {
    "systemInstruction": {
        "parts": [
            {
                "text": f'You are a single professional narrator named "{VOICE}". CRITICAL: maintain EXACTLY the same vocal identity, tone, pitch, pace, and speaking style for every piece of text you read.'
            }
        ]
    },
    "contents": [{"parts": [{"text": text}]}],
    "generationConfig": {
        "responseModalities": ["AUDIO"],
        "temperature": 0.1,
        "speechConfig": {
            "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}
        },
    },
}
def synth_chunk(chunk_text: str) -> bytes:
    last_err = None
    for attempt in range(1, 6):
        try:
            res = requests.post(url, json={**payload, "contents": [{"parts": [{"text": chunk_text}]}]}, timeout=180)
            if res.status_code >= 400:
                raise RuntimeError(f"Gemini TTS error {res.status_code}: {res.text[:200]}")
            data = res.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            for p in parts:
                inline = p.get("inlineData") or {}
                if inline.get("data"):
                    return base64.b64decode(inline.get("data"))
            raise RuntimeError("No audio returned")
        except Exception as e:
            last_err = e
            if attempt < 5:
                import time
                time.sleep(attempt * 2)
            else:
                raise RuntimeError(str(last_err))

pcm = b""
try:
    print("synth mode=one-shot")
    pcm = synth_chunk(text)
    print(f"  one-shot ok ({len(text)} chars)")
except Exception as one_err:
    print(f"  one-shot failed, fallback chunked: {one_err}")
    chunks = split_chunks(text, 1800)
    print(f"synth chunks={len(chunks)}")
    for i, ch in enumerate(chunks, 1):
        try:
            pcm += synth_chunk(ch)
            print(f"  chunk {i}/{len(chunks)} ok ({len(ch)} chars)")
        except Exception as e:
            # retry smaller split for this chunk
            print(f"  chunk {i} failed, retry split: {e}")
            sub = split_chunks(ch, 900)
            for j, sch in enumerate(sub, 1):
                pcm += synth_chunk(sch)
                print(f"    sub {j}/{len(sub)} ok ({len(sch)} chars)")
# Wrap PCM as WAV (16-bit mono 24k)
def wav_header(pcm_len, sr=24000, ch=1, bps=16):
    import struct
    br = sr * ch * bps // 8
    ba = ch * bps // 8
    return (
        b"RIFF" + struct.pack("<I", 36 + pcm_len) + b"WAVE" + b"fmt " +
        struct.pack("<IHHIIHH", 16, 1, ch, sr, br, ba, bps) + b"data" + struct.pack("<I", pcm_len)
    )
raw_wav = wav_header(len(pcm)) + pcm

# 3) Upload to Supabase Storage
path = f"pipeline-audio/{CHANNEL}/{RUN_ID}/single-narration.wav"
up_headers = {
    "apikey": SERVICE,
    "Authorization": f"Bearer {SERVICE}",
    "x-upsert": "true",
    "Content-Type": "audio/wav",
}
up = requests.post(f"{PROJECT}/storage/v1/object/post-images/{path}", headers=up_headers, data=raw_wav, timeout=60)
if up.status_code not in (200, 201):
    raise SystemExit(f"upload failed: {up.status_code} {up.text}")
public_url = f"{PROJECT}/storage/v1/object/public/post-images/{path}"

# 4) Build consistent voiceover.json using full narration URL for all scenes
storyboard = files.get("storyboard.json") or {}
scenes = storyboard.get("scenes") if isinstance(storyboard, dict) else None
if not isinstance(scenes, list):
    scenes = []

def clean(s):
    if not isinstance(s, str):
        return ""
    return " ".join(s.split())

scene_items = []
if scenes:
    chars = [max(1, len(clean((sc or {}).get("dialogue", "")))) for sc in scenes]
    total_chars = max(1, sum(chars))
    total_dur = max(1, round(len(text) / 4.5))
    for idx, sc in enumerate(scenes):
        scene_num = int((sc or {}).get("scene", idx + 1))
        dur = max(1, round(total_dur * (chars[idx] / total_chars)))
        scene_items.append({
            "scene": scene_num,
            "url": public_url,
            "duration": dur,
            "charCount": chars[idx],
            "engine": "gemini-tts",
        })
else:
    total_dur = max(1, round(len(text) / 4.5))
    scene_items.append({
        "scene": 1,
        "url": public_url,
        "duration": total_dur,
        "charCount": len(text),
        "engine": "gemini-tts",
    })

vo = {
    "clips": scene_items,
    "totalClips": len(scene_items),
    "successCount": len(scene_items),
    "failCount": 0,
    "totalDuration": sum(c["duration"] for c in scene_items),
    "engine": "gemini-tts",
    "voice": VOICE,
    "speed": 1,
    "singleNarration": True,
    "fullNarrationUrl": public_url,
    "fullAudioUrl": public_url,
}

# archive previous voiceover if exists
history = files.get("voiceover-history.json")
if not isinstance(history, list):
    history = []
old_vo = files.get("voiceover.json")
if isinstance(old_vo, dict) and old_vo.get("clips"):
    old_vo = {**old_vo, "archivedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z"}
    history.append(old_vo)

files["voiceover.json"] = vo
files["voiceover-history.json"] = history
result["files"] = files
stages["result"] = result

patch_headers = {
    "apikey": SERVICE,
    "Authorization": f"Bearer {SERVICE}",
    "Content-Type": "application/json",
}
patch = requests.patch(
    f"{PROJECT}/rest/v1/pipeline_runs?pipeline_id=eq.{RUN_ID}",
    headers=patch_headers,
    json={"stages": stages},
    timeout=30,
)
if patch.status_code not in (200, 204):
    raise SystemExit(f"patch failed: {patch.status_code} {patch.text}")

print("DONE")
print(public_url)
print(f"clips={len(scene_items)} totalDuration={vo['totalDuration']}")
