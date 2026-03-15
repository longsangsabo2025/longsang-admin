"""
🎤 Edge TTS Server — FREE Microsoft Text-to-Speech
====================================================
Lightweight HTTP server wrapping edge-tts for the browser pipeline.
No API key needed. 300+ voices. Vietnamese supported.

Start:  python services/edge-tts-server.py
Health: GET  http://localhost:5111/health
Synth:  POST http://localhost:5111/synthesize  {"text":"...", "voice":"vi-VN-HoaiMyNeural", "speed":1.0}
Voices: GET  http://localhost:5111/voices?lang=vi
"""

import asyncio
import io
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import edge_tts

PORT = 5111

class TTSHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/health':
            self._json_response({'status': 'ok', 'engine': 'edge-tts', 'version': edge_tts.__version__})
        elif parsed.path == '/voices':
            qs = parse_qs(parsed.query)
            lang = qs.get('lang', [None])[0]
            voices = asyncio.run(self._list_voices(lang))
            self._json_response({'voices': voices, 'total': len(voices)})
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

    def do_POST(self):
        if self.path != '/synthesize':
            self.send_response(404)
            self._cors()
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            params = json.loads(body)
        except json.JSONDecodeError:
            self._json_response({'error': 'Invalid JSON'}, 400)
            return

        text = params.get('text', '').strip()
        if not text:
            self._json_response({'error': 'text is required'}, 400)
            return

        voice = params.get('voice', 'vi-VN-HoaiMyNeural')
        speed = float(params.get('speed', 1.0))

        try:
            audio_bytes = asyncio.run(self._synthesize(text, voice, speed))
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(audio_bytes)))
            self.end_headers()
            self.wfile.write(audio_bytes)
        except Exception as e:
            self._json_response({'error': str(e)}, 500)

    def _json_response(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    async def _list_voices(self, lang=None):
        voices = await edge_tts.list_voices()
        if lang:
            voices = [v for v in voices if v['Locale'].lower().startswith(lang.lower())]
        return [
            {'id': v['ShortName'], 'name': v['FriendlyName'], 'gender': v['Gender'], 'locale': v['Locale']}
            for v in voices
        ]

    async def _synthesize(self, text, voice, speed):
        rate = f"+{int((speed - 1) * 100)}%" if speed >= 1 else f"{int((speed - 1) * 100)}%"
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk['type'] == 'audio':
                buf.write(chunk['data'])
        return buf.getvalue()

    def log_message(self, format, *args):
        # Quieter logging
        sys.stderr.write(f"[Edge-TTS] {args[0]}\n")


if __name__ == '__main__':
    print(f"🎤 Edge TTS Server starting on http://localhost:{PORT}")
    print(f"   Health: http://localhost:{PORT}/health")
    print(f"   Voices: http://localhost:{PORT}/voices?lang=vi")
    print(f"   Synth:  POST http://localhost:{PORT}/synthesize")
    server = HTTPServer(('127.0.0.1', PORT), TTSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Edge TTS Server stopped")
        server.server_close()
