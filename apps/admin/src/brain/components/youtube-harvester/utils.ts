/**
 * YouTube Harvester — Utility Functions
 */

export function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] || '0';
  const seconds = match[3]?.padStart(2, '0') || '00';
  return `${hours}${minutes}:${seconds}`;
}

export function formatNumber(num: string): string {
  const n = parseInt(num, 10);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return num;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractChannelId(
  url: string
): { type: 'id' | 'handle' | 'custom'; value: string } | null {
  // Channel ID: youtube.com/channel/UCxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/([^/?]+)/);
  if (channelMatch) return { type: 'id', value: channelMatch[1] };

  // Handle: youtube.com/@handle or @handle
  const handleMatch = url.match(/@([^/?]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };

  // Custom URL: youtube.com/c/customname
  const customMatch = url.match(/youtube\.com\/c\/([^/?]+)/);
  if (customMatch) return { type: 'custom', value: customMatch[1] };

  // Direct ID input
  if (url.startsWith('UC') && url.length === 24) {
    return { type: 'id', value: url };
  }

  return null;
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}
