/**
 * SmartAudio — Audio player that auto-detects and fixes raw PCM data
 *
 * Supabase-stored audio from Gemini TTS may be raw PCM (no WAV header).
 * This component fetches the audio, checks if it's playable, and wraps
 * PCM in a WAV header if needed.
 */

import { Download, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

function wrapPcmInWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Blob {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcmData.length, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
  v.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  v.setUint16(34, bitsPerSample, true);
  w(36, 'data');
  v.setUint32(40, pcmData.length, true);
  return new Blob([header, pcmData], { type: 'audio/wav' });
}

function isValidAudioHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // WAV: RIFF
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  // MP3: ID3 tag or sync word
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true;
  // OGG
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  return false;
}

interface SmartAudioProps {
  src: string;
  className?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
  showDownload?: boolean;
  showRegenerate?: boolean;
}

export default function SmartAudio({
  src,
  className,
  onRegenerate,
  regenerating,
  showDownload = true,
  showRegenerate = true,
}: SmartAudioProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);

        let blob: Blob;
        if (isValidAudioHeader(bytes)) {
          // Already valid audio format
          blob = new Blob([bytes], { type: res.headers.get('content-type') || 'audio/wav' });
        } else {
          // Raw PCM — wrap in WAV
          blob = wrapPcmInWav(bytes);
        }

        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src]);

  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    const filename = src.split('/').pop() || 'audio.wav';
    a.download = filename;
    a.click();
  }, [blobUrl, src]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">Loading audio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <span className="text-[9px] text-red-400">⚠️ Không tải được audio</span>
        {showRegenerate && onRegenerate && (
          <button
            type="button"
            className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <RotateCcw className="h-2.5 w-2.5" /> Tạo lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <audio
        ref={audioRef}
        controls
        src={blobUrl || undefined}
        className="h-7 flex-1 min-w-0"
        preload="auto"
      />
      {showDownload && blobUrl && (
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-blue-400 transition-colors shrink-0"
          onClick={handleDownload}
          title="Tải xuống"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
      {showRegenerate && onRegenerate && (
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-purple-400 transition-colors shrink-0"
          onClick={onRegenerate}
          disabled={regenerating}
          title="Tạo lại clip này"
        >
          {regenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
