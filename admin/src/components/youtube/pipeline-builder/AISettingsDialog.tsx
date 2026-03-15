/**
 * 🔑 AISettingsDialog — Quick API key management for Pipeline Builder
 *
 * Allows users to paste API keys for each AI provider directly in the UI.
 * Keys are stored via the existing api-key-pool system (localStorage + Supabase).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  addKey,
  getPool,
  onPoolChange,
  type PoolEntry,
  removeKey,
  testKey,
} from '@/services/pipeline/api-key-pool';

interface AISettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProviderDef {
  engine: string;
  label: string;
  icon: string;
  placeholder: string;
  helpUrl: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    engine: 'gemini',
    label: 'Google Gemini',
    icon: '✨',
    placeholder: 'AIzaSy...',
    helpUrl: 'https://aistudio.google.com/apikey',
  },
  {
    engine: 'openai',
    label: 'OpenAI',
    icon: '🧠',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  {
    engine: 'elevenlabs',
    label: 'ElevenLabs',
    icon: '🎙️',
    placeholder: 'sk_...',
    helpUrl: 'https://elevenlabs.io/app/settings/api-keys',
  },
  {
    engine: 'google-tts',
    label: 'Google Cloud TTS',
    icon: '🔊',
    placeholder: 'AIzaSy...',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
];

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '•'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
}

export function AISettingsDialog({ open, onClose }: AISettingsDialogProps) {
  const [pool, setPool] = useState<PoolEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync pool state
  useEffect(() => {
    setPool(getPool());
    return onPoolChange(() => setPool(getPool()));
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const getKeysForEngine = useCallback(
    (engine: string) => pool.filter((e) => e.engine === engine),
    [pool]
  );

  const handleAdd = useCallback(
    async (engine: string) => {
      const key = drafts[engine]?.trim();
      if (!key) return;

      // Test before adding
      setTesting((p) => ({ ...p, [engine]: true }));
      const result = await testKey(engine, key);
      setTesting((p) => ({ ...p, [engine]: false }));

      if (!result.ok) {
        toast.error(`Key không hợp lệ: ${result.error}`);
        return;
      }

      addKey(engine, key);
      setDrafts((p) => ({ ...p, [engine]: '' }));
      toast.success(`Đã thêm ${PROVIDERS.find((p) => p.engine === engine)?.label} key`);
    },
    [drafts]
  );

  const handleRemove = useCallback((engine: string, key: string) => {
    removeKey(engine, key);
    toast.info('Đã xoá key');
  }, []);

  const toggleShowKey = useCallback((engine: string, key: string) => {
    const id = `${engine}::${key}`;
    setShowKeys((p) => ({ ...p, [id]: !p[id] }));
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="w-[520px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <div>
              <h2 className="text-sm font-bold text-foreground">AI Model Settings</h2>
              <p className="text-[10px] text-muted-foreground">
                Dán API key để kết nối trực tiếp với AI models
              </p>
            </div>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Provider sections */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {PROVIDERS.map((provider) => {
            const keys = getKeysForEngine(provider.engine);
            const draft = drafts[provider.engine] || '';
            const isTesting = testing[provider.engine] || false;

            return (
              <div key={provider.engine} className="space-y-2">
                {/* Provider header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{provider.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{provider.label}</span>
                    {keys.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                        {keys.length} key{keys.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <a
                    href={provider.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-500 hover:text-blue-400 hover:underline"
                  >
                    Lấy key →
                  </a>
                </div>

                {/* Existing keys */}
                {keys.map((entry) => {
                  const id = `${entry.engine}::${entry.key}`;
                  const visible = showKeys[id];
                  return (
                    <div
                      key={entry.key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs group"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${entry.disabled ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                      <code className="flex-1 font-mono text-muted-foreground truncate">
                        {visible ? entry.key : maskKey(entry.key)}
                      </code>
                      <span className="text-[10px] text-muted-foreground/60">
                        {entry.usageCount} uses
                      </span>
                      <button
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        onClick={() => toggleShowKey(entry.engine, entry.key)}
                        title={visible ? 'Ẩn' : 'Hiện'}
                      >
                        {visible ? '🙈' : '👁️'}
                      </button>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-0.5 transition-opacity"
                        onClick={() => handleRemove(entry.engine, entry.key)}
                        title="Xoá key"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                {/* Add key input */}
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="flex-1 text-xs bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={provider.placeholder}
                    value={draft}
                    onChange={(e) =>
                      setDrafts((p) => ({ ...p, [provider.engine]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draft.trim()) handleAdd(provider.engine);
                    }}
                  />
                  <button
                    className="
                      px-3 py-2 text-xs font-medium rounded-lg transition-colors
                      bg-blue-600 hover:bg-blue-500 text-white
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-1.5 min-w-[80px] justify-center
                    "
                    disabled={!draft.trim() || isTesting}
                    onClick={() => handleAdd(provider.engine)}
                  >
                    {isTesting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Testing...
                      </>
                    ) : (
                      '+ Thêm'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground">
            🔒 Keys được lưu trong trình duyệt (localStorage) và Supabase. Không gửi đến bên thứ 3.
          </p>
        </div>
      </div>
    </div>
  );
}
