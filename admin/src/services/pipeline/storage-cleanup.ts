/**
 * 🧹 Storage Cleanup — deletes Supabase storage files for pipeline runs
 *
 * Called when a user deletes a run, or as a batch cleanup for
 * interrupted/failed runs that accumulated storage waste.
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'post-images';

/** List all files under a prefix (pagination-aware, max 1000 files) */
async function listFiles(prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000, offset: 0 });

  if (error || !data) return [];

  const paths: string[] = [];
  for (const item of data) {
    if (item.id) {
      // It's a file (has id), not a folder placeholder
      paths.push(`${prefix}/${item.name}`);
    }
  }
  return paths;
}

/**
 * Delete all storage files for a specific run:
 * - pipeline-images/{channelId}/{runId}/
 * - pipeline-audio/{channelId}/{runId}/
 * - pipeline-video/{channelId}/{runId}/
 */
export async function deleteRunStorageFiles(channelId: string, runId: string): Promise<void> {
  const prefixes = [
    `pipeline-images/${channelId}/${runId}`,
    `pipeline-audio/${channelId}/${runId}`,
    `pipeline-video/${channelId}/${runId}`,
  ];

  for (const prefix of prefixes) {
    const files = await listFiles(prefix);
    if (files.length === 0) continue;

    // Supabase remove() takes an array of file paths (no bucket prefix)
    const { error } = await supabase.storage.from(BUCKET).remove(files);
    if (error) {
      console.warn(`[storage-cleanup] Failed to delete ${prefix}:`, error.message);
    }
  }
}

/**
 * Batch cleanup: delete all storage files for a list of run IDs under a channel.
 * Returns counts of runs cleaned and files deleted.
 */
export async function batchCleanupRuns(
  channelId: string,
  runIds: string[]
): Promise<{ runsProcessed: number; errors: string[] }> {
  let runsProcessed = 0;
  const errors: string[] = [];

  for (const runId of runIds) {
    try {
      await deleteRunStorageFiles(channelId, runId);
      runsProcessed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${runId}: ${msg}`);
    }
  }

  return { runsProcessed, errors };
}

/**
 * Get storage usage summary for a channel.
 * Returns folder names and estimated file counts.
 */
export async function getChannelStorageStats(
  channelId: string
): Promise<{ prefix: string; folders: { name: string; fileCount: number }[] }[]> {
  const prefixes = [
    `pipeline-images/${channelId}`,
    `pipeline-audio/${channelId}`,
    `pipeline-video/${channelId}`,
  ];

  const results: { prefix: string; folders: { name: string; fileCount: number }[] }[] = [];
  for (const prefix of prefixes) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 200, offset: 0 });

    if (error || !data) {
      results.push({ prefix, folders: [] });
      continue;
    }

    const folders = data
      .filter((item) => !item.id) // folders have no id
      .map((f) => ({ name: f.name, fileCount: 0 }));

    // Get file counts per folder
    for (const folder of folders) {
      const files = await listFiles(`${prefix}/${folder.name}`);
      folder.fileCount = files.length;
    }

    results.push({ prefix, folders });
  }

  return results;
}
