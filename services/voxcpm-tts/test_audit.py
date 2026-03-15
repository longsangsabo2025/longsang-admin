"""TTS Language Audit — Test Vietnamese pronunciation quality via Whisper back-check."""
import sys
import os
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
import requests
import time

TTS_URL = "http://localhost:8100"

TESTS = [
    "Xin chào các bạn, chào mừng đến với kênh Đứng Dậy Đi.",
    "Giấc ngủ là nền tảng sức khỏe vững chắc cho bạn vươn lên.",
    "Thế giới này không công bằng, nhưng bạn có quyền lựa chọn.",
    "Theo số liệu từ Ngân hàng Nhà nước, tỷ lệ người trẻ tiếp cận dịch vụ tài chính hiện đại còn rất thấp.",
    "Đa số chúng ta dành cả đời để chạy theo những ánh hào quang lấp lánh.",
]


def main():
    print("=" * 60)
    print("  TTS LANGUAGE AUDIT — Vietnamese Back-Check")
    print("=" * 60)
    print()

    results = []
    for i, text in enumerate(TESTS):
        t0 = time.time()
        try:
            r = requests.post(
                f"{TTS_URL}/v1/tts-verify",
                json={"text": text, "voice_clone": False, "speed": 0.92, "min_similarity": 0.3},
                timeout=120,
            )
        except Exception as e:
            print(f"[{i+1}] CONNECTION ERROR: {e}")
            continue

        elapsed = time.time() - t0

        if r.status_code != 200:
            print(f"[{i+1}] ERROR {r.status_code}: {r.text[:200]}")
            continue

        d = r.json()
        verdict = "PASS ✓" if d["pass"] else "FAIL ✗"
        sim = d["similarity"]

        print(f"[{i+1}] {verdict}  similarity={sim:.2f}  duration={d['duration']}s  time={elapsed:.1f}s")
        print(f"     IN:  {d['original'][:90]}")
        print(f"     OUT: {d['transcribed'][:90]}")
        print()

        results.append({"pass": d["pass"], "sim": sim})

    print("=" * 60)
    passed = sum(1 for r in results if r["pass"])
    avg_sim = sum(r["sim"] for r in results) / len(results) if results else 0
    print(f"  RESULT: {passed}/{len(results)} passed | avg similarity: {avg_sim:.2f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
