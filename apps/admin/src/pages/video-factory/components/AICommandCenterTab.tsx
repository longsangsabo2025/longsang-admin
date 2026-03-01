import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';
import {
  videoFactoryService,
  type ViralScriptsResponse,
  type ContentCalendarResponse,
  type RepurposeResponse,
  type TrendScoutResponse,
  type VideoScriptResponse,
  type SEOMetadataResponse,
} from '@/services/video-factory.service';
import { type AISkill, AI_SKILLS } from './ai-command-center';
import { ViralScriptSkill } from './ai-command-center/ViralScriptSkill';
import { ContentCalendarSkill } from './ai-command-center/ContentCalendarSkill';
import { ContentRepurposeSkill } from './ai-command-center/ContentRepurposeSkill';
import { TrendScoutSkill } from './ai-command-center/TrendScoutSkill';
import { VideoScriptSkill } from './ai-command-center/VideoScriptSkill';
import { SEOMetadataSkill } from './ai-command-center/SEOMetadataSkill';

// ─── AI Command Center Tab (Orchestrator) ─────────────────────────────────────

export const AICommandCenterTab = () => {
  const { toast } = useToast();
  const [activeSkill, setActiveSkill] = useState<AISkill | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Viral Scripts state ──
  const [vsNiche, setVsNiche] = useState('');
  const [vsPlatform, setVsPlatform] = useState('tiktok');
  const [vsTopic, setVsTopic] = useState('');
  const [vsCount, setVsCount] = useState(3);
  const [vsResult, setVsResult] = useState<ViralScriptsResponse | null>(null);

  // ── Content Calendar state ──
  const [calNiche, setCalNiche] = useState('');
  const [calDays, setCalDays] = useState(7);
  const [calPostsPerDay, setCalPostsPerDay] = useState(3);
  const [calPlatforms, setCalPlatforms] = useState<string[]>(['tiktok', 'youtube']);
  const [calResult, setCalResult] = useState<ContentCalendarResponse | null>(null);

  // ── Repurpose state ──
  const [rpPrompt, setRpPrompt] = useState('');
  const [rpSource, setRpSource] = useState('tiktok');
  const [rpNiche, setRpNiche] = useState('');
  const [rpResult, setRpResult] = useState<RepurposeResponse | null>(null);

  // ── Trend Scout state ──
  const [tsNiche, setTsNiche] = useState('');
  const [tsPlatform, setTsPlatform] = useState('all');
  const [tsCount, setTsCount] = useState(5);
  const [tsResult, setTsResult] = useState<TrendScoutResponse | null>(null);

  // ── Video Script state ──
  const [scTopic, setScTopic] = useState('');
  const [scDuration, setScDuration] = useState('60s');
  const [scStyle, setScStyle] = useState('narration');
  const [scNiche, setScNiche] = useState('');
  const [scPlatform, setScPlatform] = useState('youtube');
  const [scResult, setScResult] = useState<VideoScriptResponse | null>(null);

  // ── SEO state ──
  const [seoDesc, setSeoDesc] = useState('');
  const [seoNiche, setSeoNiche] = useState('');
  const [seoPlatforms, setSeoPlatforms] = useState<string[]>(['tiktok', 'youtube', 'instagram']);
  const [seoPrompt, setSeoPrompt] = useState('');
  const [seoResult, setSeoResult] = useState<SEOMetadataResponse | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Copied!' });
  };

  // ── Handlers ──
  const handleViralScripts = async () => {
    if (!vsNiche.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.generateViralScripts({
        niche: vsNiche, platform: vsPlatform, topic: vsTopic || undefined, count: vsCount,
      });
      setVsResult(result);
      toast({ title: `🎬 ${result.scripts?.length || 0} viral scripts generated!` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleCalendar = async () => {
    if (!calNiche.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.generateContentCalendar({
        niche: calNiche, platforms: calPlatforms, days: calDays, posts_per_day: calPostsPerDay,
      });
      setCalResult(result);
      toast({ title: `📅 ${result.days?.length || 0}-day calendar generated!` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleRepurpose = async () => {
    if (!rpPrompt.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.repurposeContent({
        prompt: rpPrompt, source_platform: rpSource, niche: rpNiche || undefined,
      });
      setRpResult(result);
      toast({ title: `🔄 ${result.variations?.length || 0} variations generated!` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleTrendScout = async () => {
    if (!tsNiche.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.scoutTrends({
        niche: tsNiche, platform: tsPlatform, count: tsCount,
      });
      setTsResult(result);
      toast({ title: `🎯 ${result.trends?.length || 0} trends discovered!` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleVideoScript = async () => {
    if (!scTopic.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.generateVideoScript({
        topic: scTopic, duration: scDuration, style: scStyle, niche: scNiche || undefined, platform: scPlatform,
      });
      setScResult(result);
      toast({ title: `✍️ Script "${result.title}" generated!` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSEO = async () => {
    if (!seoDesc.trim() || !seoNiche.trim()) return;
    setLoading(true);
    try {
      const result = await videoFactoryService.generateSEOMetadata({
        content_description: seoDesc, niche: seoNiche, platforms: seoPlatforms, existing_prompt: seoPrompt || undefined,
      });
      setSeoResult(result);
      toast({ title: `🏷️ SEO metadata generated! Score: ${result.seo_score}/100` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* ── Skill Selector ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {AI_SKILLS.map(skill => (
          <Card
            key={skill.id}
            className={`cursor-pointer transition-all hover:scale-[1.02] ${activeSkill === skill.id ? skill.color + ' ring-2 ring-primary' : 'hover:border-primary/30'}`}
            onClick={() => setActiveSkill(activeSkill === skill.id ? null : skill.id)}
          >
            <CardContent className="pt-4 pb-3 text-center">
              <span className="text-2xl">{skill.icon}</span>
              <p className="text-xs font-semibold mt-1">{skill.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{skill.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Active Skill Panel ─────────────────────────────────────── */}
      {activeSkill === 'viral-scripts' && (
        <ViralScriptSkill
          vsNiche={vsNiche} setVsNiche={setVsNiche}
          vsPlatform={vsPlatform} setVsPlatform={setVsPlatform}
          vsTopic={vsTopic} setVsTopic={setVsTopic}
          vsCount={vsCount} setVsCount={setVsCount}
          vsResult={vsResult} loading={loading}
          onGenerate={handleViralScripts} copyToClipboard={copyToClipboard}
        />
      )}

      {activeSkill === 'content-calendar' && (
        <ContentCalendarSkill
          calNiche={calNiche} setCalNiche={setCalNiche}
          calDays={calDays} setCalDays={setCalDays}
          calPostsPerDay={calPostsPerDay} setCalPostsPerDay={setCalPostsPerDay}
          calPlatforms={calPlatforms} setCalPlatforms={setCalPlatforms}
          calResult={calResult} loading={loading}
          onGenerate={handleCalendar} copyToClipboard={copyToClipboard}
        />
      )}

      {activeSkill === 'repurpose' && (
        <ContentRepurposeSkill
          rpPrompt={rpPrompt} setRpPrompt={setRpPrompt}
          rpSource={rpSource} setRpSource={setRpSource}
          rpNiche={rpNiche} setRpNiche={setRpNiche}
          rpResult={rpResult} loading={loading}
          onGenerate={handleRepurpose} copyToClipboard={copyToClipboard}
        />
      )}

      {activeSkill === 'trend-scout' && (
        <TrendScoutSkill
          tsNiche={tsNiche} setTsNiche={setTsNiche}
          tsPlatform={tsPlatform} setTsPlatform={setTsPlatform}
          tsCount={tsCount} setTsCount={setTsCount}
          tsResult={tsResult} loading={loading}
          onGenerate={handleTrendScout} copyToClipboard={copyToClipboard}
        />
      )}

      {activeSkill === 'video-script' && (
        <VideoScriptSkill
          scTopic={scTopic} setScTopic={setScTopic}
          scDuration={scDuration} setScDuration={setScDuration}
          scStyle={scStyle} setScStyle={setScStyle}
          scNiche={scNiche} setScNiche={setScNiche}
          scPlatform={scPlatform} setScPlatform={setScPlatform}
          scResult={scResult} loading={loading}
          onGenerate={handleVideoScript} copyToClipboard={copyToClipboard}
        />
      )}

      {activeSkill === 'seo-metadata' && (
        <SEOMetadataSkill
          seoDesc={seoDesc} setSeoDesc={setSeoDesc}
          seoNiche={seoNiche} setSeoNiche={setSeoNiche}
          seoPlatforms={seoPlatforms} setSeoPlatforms={setSeoPlatforms}
          seoPrompt={seoPrompt} setSeoPrompt={setSeoPrompt}
          seoResult={seoResult} loading={loading}
          onGenerate={handleSEO} copyToClipboard={copyToClipboard}
        />
      )}

      {/* ── No Skill Selected ──────────────────────────────────────── */}
      {!activeSkill && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center text-muted-foreground">
            <Bot className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select an AI Skill above</p>
            <p className="text-sm">Each skill uses Gemini 2.0 Flash to generate professional content</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
