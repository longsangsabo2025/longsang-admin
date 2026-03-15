"""
Generate reference voice samples for Fish Speech using Edge TTS,
then register them with Fish Speech server via /v1/references/add API.
"""
import asyncio
import io
import requests

# Try edge_tts for generating reference audio  
import edge_tts

FISH_SPEECH_URL = "http://127.0.0.1:8200"

# Voice definitions: (id, edge_tts_voice, sample_text, label_text)
VOICES = [
    (
        "vi-female-hoaimy",
        "vi-VN-HoaiMyNeural",
        "Xin chào các bạn, hôm nay chúng ta sẽ cùng nhau tìm hiểu về những câu chuyện thú vị nhất trong cuộc sống. Mỗi ngày là một cơ hội mới để học hỏi và phát triển bản thân.",
        "Xin chào các bạn, hôm nay chúng ta sẽ cùng nhau tìm hiểu về những câu chuyện thú vị nhất trong cuộc sống.",
    ),
    (
        "vi-male-namminh",
        "vi-VN-NamMinhNeural",
        "Chào mừng các bạn đến với chương trình của chúng tôi. Trong video này, tôi sẽ chia sẻ với các bạn những kiến thức bổ ích và những bài học quý giá từ cuộc sống.",
        "Chào mừng các bạn đến với chương trình của chúng tôi. Trong video này, tôi sẽ chia sẻ những kiến thức bổ ích.",
    ),
    (
        "en-male-guy",
        "en-US-GuyNeural",
        "Welcome to today's video. In this episode, we're going to explore some fascinating topics that will change the way you think about the world around you. Let's get started.",
        "Welcome to today's video. We're going to explore some fascinating topics that will change the way you think.",
    ),
    (
        "en-female-jenny",
        "en-US-JennyNeural",
        "Hi everyone, thanks for joining me today. I'm really excited to share this with you. We have so much to cover, so let's dive right in and explore together.",
        "Hi everyone, thanks for joining me today. I'm really excited to share this with you.",
    ),
]


async def generate_edge_tts(voice: str, text: str) -> bytes:
    """Generate audio using Edge TTS and return WAV bytes."""
    communicate = edge_tts.Communicate(text, voice, rate="+0%")
    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])
    return buffer.getvalue()


def register_reference(ref_id: str, audio_bytes: bytes, text: str):
    """Register a reference voice with Fish Speech server."""
    resp = requests.post(
        f"{FISH_SPEECH_URL}/v1/references/add",
        files={"audio": (f"{ref_id}.mp3", audio_bytes, "audio/mpeg")},
        data={"id": ref_id, "text": text},
    )
    return resp.status_code, resp.text


async def main():
    print("=" * 60)
    print("🐟 Fish Speech Voice Reference Setup")
    print("=" * 60)

    # Check Fish Speech server
    try:
        r = requests.get(f"{FISH_SPEECH_URL}/v1/health", timeout=5)
        print(f"✅ Fish Speech server: {r.json()}")
    except Exception as e:
        print(f"❌ Fish Speech server not available: {e}")
        return

    for ref_id, edge_voice, sample_text, label_text in VOICES:
        print(f"\n📢 Generating: {ref_id} ({edge_voice})...")

        # Step 1: Generate audio with Edge TTS
        try:
            audio_bytes = await generate_edge_tts(edge_voice, sample_text)
            print(f"   ✅ Audio generated: {len(audio_bytes):,} bytes")
        except Exception as e:
            print(f"   ❌ Edge TTS failed: {e}")
            continue

        # Step 2: Register with Fish Speech
        try:
            status, body = register_reference(ref_id, audio_bytes, label_text)
            if status in (200, 201):
                print(f"   ✅ Registered: {ref_id}")
            elif status == 409:
                print(f"   ⚠️ Already exists: {ref_id}")
            else:
                print(f"   ❌ Register failed ({status}): {body}")
        except Exception as e:
            print(f"   ❌ Register failed: {e}")

    # Verify: list references
    print("\n" + "=" * 60)
    try:
        r = requests.get(f"{FISH_SPEECH_URL}/v1/references")
        print(f"📋 Registered references: {r.json()}")
    except Exception as e:
        print(f"⚠️ Could not list references: {e}")

    print("\n✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())
