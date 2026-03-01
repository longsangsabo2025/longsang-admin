/**
 * YouTube Harvester — Type Definitions
 */

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
  };
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

export interface TranscriptData {
  text: string;
  language: string;
  source: string;
}

export interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  mainTopics: string[];
  mentalModels?: string[];
  actionItems: string[];
  quotes?: string[];
  criticalQuestions?: string[];
  suggestedTags: string[];
  knowledgeDocument: string;
}

export interface FinalDocument {
  title: string;
  content: string;
  tags: string[];
  contentType: string;
}

export interface ImportHistoryItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  importedAt: string;
  domain: string;
  tags: string[];
}

export interface YouTubeHarvesterProps {
  readonly selectedDomainId?: string | null;
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  customUrl?: string;
}

export interface SavedChannel {
  id: string;
  channelId: string;
  title: string;
  thumbnail: string;
  addedAt: string;
  lastChecked?: string;
  videosImported: number;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoCount: number;
}

export interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  selected: boolean;
}
