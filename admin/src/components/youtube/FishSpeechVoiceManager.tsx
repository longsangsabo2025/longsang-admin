/**
 * 🐟 Fish Speech Voice Manager
 * Upload audio mẫu để clone voice, quản lý danh sách voices đã tạo.
 * Fish Speech server chạy local trên port 8200.
 */

import { Loader2, Mic, Play, Plus, RefreshCw, Square, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FISH_SPEECH_URL = 'http://localhost:8200';

export interface FishVoiceRef {
  id: string;
}

interface FishSpeechVoiceManagerProps {
  /** Currently selected voice reference_id */
  selectedVoice: string;
  /** Callback when a voice is selected */
  onSelectVoice: (voiceId: string) => void;
  /** Show as compact inline picker (true) or full manager panel (false) */
  compact?: boolean;
}

export function FishSpeechVoiceManager({
  selectedVoice,
  onSelectVoice,
  compact,
}: FishSpeechVoiceManagerProps) {
  const [voices, setVoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add voice form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVoiceId, setNewVoiceId] = useState('');
  const [newVoiceText, setNewVoiceText] = useState('');
  const [newVoiceFile, setNewVoiceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${FISH_SPEECH_URL}/v1/references/list`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setVoices(data.reference_ids || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không kết nối được Fish Speech server (port 8200)'
      );
      setVoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const handleAddVoice = async () => {
    if (!newVoiceId.trim() || !newVoiceFile || !newVoiceText.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('id', newVoiceId.trim());
      formData.append('text', newVoiceText.trim());
      formData.append('audio', newVoiceFile);

      const res = await fetch(`${FISH_SPEECH_URL}/v1/references/add`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string })?.message || `Error ${res.status}`);
      }
      // Reset form & refresh
      setNewVoiceId('');
      setNewVoiceText('');
      setNewVoiceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddForm(false);
      await fetchVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Xóa voice "${id}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${FISH_SPEECH_URL}/v1/references/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reference_id: id }),
      });
      if (!res.ok) throw new Error(`Delete error ${res.status}`);
      if (selectedVoice === id) onSelectVoice('default');
      await fetchVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (id: string) => {
    if (previewingId === id) {
      // Stop preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
      setPreviewingId(null);
      setPreviewAudioUrl(null);
      return;
    }
    setPreviewingId(id);
    try {
      const body: Record<string, unknown> = {
        text: 'Xin chào, đây là giọng đọc mẫu từ Fish Speech.',
        format: 'wav',
        chunk_length: 200,
        top_p: 0.8,
        temperature: 0.8,
        repetition_penalty: 1.1,
        streaming: false,
        references: [],
      };
      if (id !== 'default') body.reference_id = id;

      const res = await fetch(`${FISH_SPEECH_URL}/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`TTS error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(url);
      setTimeout(() => {
        previewAudioRef.current?.play();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setPreviewingId(null);
    }
  };

  // ─── Compact Mode: just a voice selector ───
  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 h-8 px-2 text-xs border rounded-md bg-background"
            value={selectedVoice}
            onChange={(e) => onSelectVoice(e.target.value)}
          >
            <option value="default">🎵 Default (no clone)</option>
            {voices.map((v) => (
              <option key={v} value={v}>
                🎤 {v}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={fetchVoices}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {voices.length === 0 && !loading && (
          <p className="text-[10px] text-muted-foreground">
            Chưa có voice clone. Mở Voice Manager để thêm.
          </p>
        )}
      </div>
    );
  }

  // ─── Full Manager Mode ───
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-orange-400">🐟 Fish Speech Voice Manager</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={fetchVoices}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-3 w-3" /> Thêm Voice
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
          ⚠️ {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Đóng
          </button>
        </div>
      )}

      {/* Add Voice Form */}
      {showAddForm && (
        <div className="border border-orange-500/30 bg-orange-500/5 rounded-lg p-3 space-y-2">
          <span className="text-[11px] font-medium text-orange-300">📤 Upload giọng mẫu mới</span>
          <p className="text-[10px] text-muted-foreground">
            Upload file audio 5-30 giây (WAV/MP3). Nhập text tương ứng với nội dung audio. Fish
            Speech sẽ clone giọng đó.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Tên Voice (ID)</Label>
              <Input
                className="h-7 text-xs"
                placeholder="vd: narrator-male-vi"
                value={newVoiceId}
                onChange={(e) => setNewVoiceId(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                maxLength={50}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">File Audio (5-30s)</Label>
              <Input
                ref={fileInputRef}
                className="h-7 text-xs"
                type="file"
                accept=".wav,.mp3,.flac,.ogg"
                onChange={(e) => setNewVoiceFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Nội dung text trong audio</Label>
            <Input
              className="h-7 text-xs"
              placeholder="Nhập chính xác text mà audio đang đọc..."
              value={newVoiceText}
              onChange={(e) => setNewVoiceText(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1"
              disabled={uploading || !newVoiceId.trim() || !newVoiceFile || !newVoiceText.trim()}
              onClick={handleAddVoice}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {uploading ? 'Đang upload...' : 'Upload & Tạo Voice'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => setShowAddForm(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Voice List */}
      <div className="space-y-1">
        {/* Default voice */}
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
            selectedVoice === 'default'
              ? 'bg-orange-500/20 border border-orange-500/40'
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onSelectVoice('default')}
        >
          <Mic className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <span className="text-xs flex-1">Default Voice</span>
          <span className="text-[9px] text-muted-foreground">built-in</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview('default');
            }}
          >
            {previewingId === 'default' ? (
              <Square className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Custom voices */}
        {loading && voices.length === 0 ? (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground py-2 px-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Đang tải danh sách voices...
          </div>
        ) : (
          voices.map((id) => (
            <div
              key={id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                selectedVoice === id
                  ? 'bg-orange-500/20 border border-orange-500/40'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectVoice(id)}
            >
              <Mic className="h-3.5 w-3.5 text-green-400 shrink-0" />
              <span className="text-xs flex-1 truncate">{id}</span>
              <span className="text-[9px] text-muted-foreground">cloned</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(id);
                }}
                disabled={previewingId !== null && previewingId !== id}
              >
                {previewingId === id ? (
                  <Square className="h-3 w-3 text-yellow-400" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(id);
                }}
                disabled={deletingId === id}
              >
                {deletingId === id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))
        )}

        {!loading && voices.length === 0 && (
          <p className="text-[10px] text-muted-foreground px-2 py-1">
            Chưa có voice clone nào. Bấm "Thêm Voice" để upload giọng mẫu.
          </p>
        )}
      </div>

      {/* Hidden audio element for previews */}
      {previewAudioUrl && (
        <audio
          ref={previewAudioRef}
          src={previewAudioUrl}
          onEnded={() => {
            setPreviewingId(null);
          }}
          className="hidden"
        />
      )}

      <p className="text-[9px] text-muted-foreground">
        💡 Upload file audio 5-30 giây (giọng rõ ràng, ít noise) + text tương ứng. Fish Speech sẽ
        clone giọng đó cho voiceover.
      </p>
    </div>
  );
}
