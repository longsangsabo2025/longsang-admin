/**
 * Multi-modal AI Agent
 * Handles text, images, audio, and video processing
 */

import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export interface MultimodalInput {
  text?: string;
  images?: Array<{ url: string } | { base64: string }>;
  audio?: Buffer | File;
  video?: { url: string };
}

export interface VisionAnalysis {
  description: string;
  objects: string[];
  text_detected?: string;
  scene: string;
  suggestions: string[];
  confidence: number;
}

export interface AudioTranscription {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface AudioAnalysis {
  transcription: AudioTranscription;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  summary: string;
}

/**
 * Analyze image with GPT-4 Vision
 */
export async function analyzeImage(
  imageInput: { url: string } | { base64: string },
  prompt: string = 'Describe this image in detail. What objects, people, and activities do you see?'
): Promise<VisionAnalysis> {
  try {
    logger.info('Analyzing image with GPT-4 Vision');

    const imageContent =
      'url' in imageInput
        ? { type: 'image_url' as const, image_url: { url: imageInput.url } }
        : { type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${imageInput.base64}` } };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            imageContent,
          ],
        },
      ],
      max_tokens: 1000,
    });

    const description = response.choices[0].message.content || '';

    // Extract structured information
    const analysis: VisionAnalysis = {
      description,
      objects: extractObjects(description),
      scene: extractScene(description),
      suggestions: [],
      confidence: 0.85,
    };

    logger.info('Image analysis completed', { objectsFound: analysis.objects.length });
    return analysis;
  } catch (error) {
    logger.error('Image analysis failed', error);
    throw new Error('Failed to analyze image');
  }
}

/**
 * Analyze multiple images in sequence
 */
export async function analyzeImageSequence(
  images: Array<{ url: string } | { base64: string }>,
  context: string = 'Analyze these images in sequence and describe the story or progression.'
): Promise<{
  individual_analyses: VisionAnalysis[];
  sequence_narrative: string;
  key_changes: string[];
}> {
  try {
    logger.info('Analyzing image sequence', { count: images.length });

    // Analyze each image
    const individual_analyses = await Promise.all(
      images.map((img) => analyzeImage(img, 'Describe this image briefly.'))
    );

    // Generate sequence narrative
    const imageContents = images.map((img, idx) => {
      const imageUrl = 'url' in img ? img.url : `data:image/jpeg;base64,${img.base64}`;
      return {
        type: 'image_url' as const,
        image_url: { url: imageUrl },
      };
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: context },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 1500,
    });

    const sequence_narrative = response.choices[0].message.content || '';

    return {
      individual_analyses,
      sequence_narrative,
      key_changes: extractKeyChanges(sequence_narrative),
    };
  } catch (error) {
    logger.error('Image sequence analysis failed', error);
    throw new Error('Failed to analyze image sequence');
  }
}

/**
 * Transcribe audio with Whisper
 */
export async function transcribeAudio(
  audio: File | Blob,
  options: {
    language?: string;
    prompt?: string;
    temperature?: number;
  } = {}
): Promise<AudioTranscription> {
  try {
    logger.info('Transcribing audio with Whisper');

    const file = audio instanceof File ? audio : new File([audio], 'audio.mp3');

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt,
      temperature: options.temperature || 0,
      response_format: 'verbose_json',
    });

    const result: AudioTranscription = {
      text: transcription.text,
      language: transcription.language || options.language || 'en',
      duration: (transcription as Record<string, number>).duration || 0,
    };

    logger.info('Audio transcription completed', { words: result.text.split(' ').length });
    return result;
  } catch (error) {
    logger.error('Audio transcription failed', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Analyze audio: transcribe + sentiment + topics
 */
export async function analyzeAudio(audio: File | Blob): Promise<AudioAnalysis> {
  try {
    logger.info('Analyzing audio comprehensively');

    // 1. Transcribe
    const transcription = await transcribeAudio(audio);

    // 2. Analyze with GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an audio content analyst. Analyze transcribed audio for sentiment, topics, and provide a summary.',
        },
        {
          role: 'user',
          content: `Analyze this transcription:\n\n${transcription.text}\n\nProvide JSON: {"sentiment": "positive|neutral|negative", "topics": ["topic1", "topic2"], "summary": "..."}`,
        },
      ],
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content || '{}';
    let analysis: { sentiment: string; topics: string[]; summary: string };

    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        sentiment: 'neutral',
        topics: [],
        summary: transcription.text.substring(0, 200),
      };
    }

    return {
      transcription,
      sentiment: analysis.sentiment as 'positive' | 'neutral' | 'negative',
      topics: analysis.topics,
      summary: analysis.summary,
    };
  } catch (error) {
    logger.error('Audio analysis failed', error);
    throw new Error('Failed to analyze audio');
  }
}

/**
 * Generate image with DALL-E
 */
export async function generateImage(
  prompt: string,
  options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'natural' | 'vivid';
    n?: number;
  } = {}
): Promise<Array<{ url: string; revisedPrompt?: string }>> {
  try {
    logger.info('Generating image with DALL-E', { prompt });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      n: options.n || 1,
    });

    const images = response.data.map((img) => ({
      url: img.url!,
      revisedPrompt: img.revised_prompt,
    }));

    logger.info('Image generation completed', { count: images.length });
    return images;
  } catch (error) {
    logger.error('Image generation failed', error);
    throw new Error('Failed to generate image');
  }
}

/**
 * Edit image with DALL-E
 */
export async function editImage(
  image: File | Blob,
  prompt: string,
  mask?: File | Blob,
  options: {
    size?: '1024x1024' | '512x512' | '256x256';
    n?: number;
  } = {}
): Promise<Array<{ url: string }>> {
  try {
    logger.info('Editing image with DALL-E', { prompt });

    const imageFile = image instanceof File ? image : new File([image], 'image.png');
    const maskFile = mask instanceof File ? mask : mask ? new File([mask], 'mask.png') : undefined;

    const response = await openai.images.edit({
      model: 'dall-e-2',
      image: imageFile,
      mask: maskFile,
      prompt,
      size: options.size || '1024x1024',
      n: options.n || 1,
    });

    const images = response.data.map((img) => ({
      url: img.url!,
    }));

    logger.info('Image editing completed', { count: images.length });
    return images;
  } catch (error) {
    logger.error('Image editing failed', error);
    throw new Error('Failed to edit image');
  }
}

/**
 * Complete multimodal interaction
 */
export async function multimodalInteraction(input: MultimodalInput): Promise<{
  response: string;
  analyses: {
    vision?: VisionAnalysis[];
    audio?: AudioAnalysis;
  };
}> {
  try {
    logger.info('Processing multimodal interaction');

    const analyses: {
      vision?: VisionAnalysis[];
      audio?: AudioAnalysis;
    } = {};

    // Process images
    if (input.images && input.images.length > 0) {
      analyses.vision = await Promise.all(input.images.map((img) => analyzeImage(img)));
    }

    // Process audio
    if (input.audio) {
      const audioFile = input.audio instanceof File ? input.audio : new File([input.audio], 'audio.mp3');
      analyses.audio = await analyzeAudio(audioFile);
    }

    // Combine all inputs into comprehensive response
    const contextParts: string[] = [];

    if (input.text) {
      contextParts.push(`User text: ${input.text}`);
    }

    if (analyses.vision) {
      contextParts.push(
        `Image analysis: ${analyses.vision.map((v) => v.description).join(' | ')}`
      );
    }

    if (analyses.audio) {
      contextParts.push(`Audio transcription: ${analyses.audio.transcription.text}`);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a multimodal AI assistant. Synthesize information from text, images, and audio to provide comprehensive responses.',
        },
        {
          role: 'user',
          content: contextParts.join('\n\n'),
        },
      ],
      max_tokens: 1500,
    });

    return {
      response: response.choices[0].message.content || '',
      analyses,
    };
  } catch (error) {
    logger.error('Multimodal interaction failed', error);
    throw new Error('Failed to process multimodal input');
  }
}

// Helper functions
function extractObjects(description: string): string[] {
  // Simple extraction - can be improved with NLP
  const commonObjects = [
    'person',
    'people',
    'car',
    'building',
    'tree',
    'dog',
    'cat',
    'table',
    'chair',
    'computer',
    'phone',
    'book',
  ];
  return commonObjects.filter((obj) => description.toLowerCase().includes(obj));
}

function extractScene(description: string): string {
  const scenes = ['indoor', 'outdoor', 'office', 'home', 'street', 'nature', 'urban'];
  return scenes.find((scene) => description.toLowerCase().includes(scene)) || 'general';
}

function extractKeyChanges(narrative: string): string[] {
  // Extract sentences with change indicators
  const changeWords = ['changed', 'became', 'transformed', 'moved', 'appeared', 'disappeared'];
  const sentences = narrative.split('.').filter((s) => s.trim());

  return sentences
    .filter((s) => changeWords.some((word) => s.toLowerCase().includes(word)))
    .map((s) => s.trim())
    .slice(0, 5);
}
