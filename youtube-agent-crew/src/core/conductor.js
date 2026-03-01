/**
 * Conductor — The Elon Musk of the agent crew
 * 
 * Responsibilities:
 * - Load pipeline definitions
 * - Execute stages in order (sequential or parallel)
 * - Route messages between agents
 * - Monitor progress, handle errors, retry
 * - Report final results + cost summary
 */
import { nanoid } from 'nanoid';
import { messageBus } from './message-bus.js';
import { memory } from './memory.js';
import { reportPipelineRun } from './reporter.js';
import { startAll as startGpuServices, stopAll as stopGpuServices } from '../utils/gpu-services.js';
import { autoSeed as runAutoSeed } from '../utils/auto-seeder.js';
import { repurposeContent } from '../utils/content-repurposer.js';
import { createPipelineHooks } from '../utils/telegram-notifier.js';
import chalk from 'chalk';
import ora from 'ora';

export class Conductor {
  constructor() {
    this.agents = new Map(); // id → agent instance
    this.pipelines = new Map(); // name → pipeline definition
    this.activeRuns = new Map();
    this.tg = createPipelineHooks();

    // Listen to all messages
    messageBus.on('conductor', (msg) => this.handleMessage(msg));
  }

  /**
   * Register an agent with the conductor
   */
  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    this.log(`Registered agent: ${agent.name} (${agent.id}) [${agent.model}]`);
  }

  /**
   * Register a pipeline definition
   */
  registerPipeline(pipeline) {
    this.pipelines.set(pipeline.name, pipeline);
    this.log(`Registered pipeline: ${pipeline.name} (${pipeline.stages.length} stages)`);
  }

  /**
   * Execute a pipeline with checkpointing, resume, parallel stages, and cost budget
   * @param {string} pipelineName 
   * @param {object} input - Initial input data
   * @param {object} opts - { resume: pipelineId, maxCost: 0.50 }
   * @returns {object} - Final results from all stages
   */
  async executePipeline(pipelineName, input = {}, opts = {}) {
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) throw new Error(`Pipeline not found: ${pipelineName}`);

    // Resume support: reuse existing pipelineId and skip completed stages
    let resumeFromStage = 0;
    let runId, pipelineId;

    if (opts.resume) {
      pipelineId = opts.resume;
      runId = pipelineId.split('_').pop();
      const checkpoint = await memory.restore(pipelineId);
      if (checkpoint) {
        resumeFromStage = checkpoint.stageIndex + 1;
        this.log(chalk.yellow(`♻️  RESUMING from stage ${resumeFromStage} (${checkpoint.stageName})`));
      } else {
        this.log(chalk.yellow(`⚠️  No checkpoint found for ${pipelineId}, starting fresh`));
        resumeFromStage = 0;
      }
    } else {
      runId = nanoid(10);
      pipelineId = `${pipelineName}_${runId}`;
    }

    const maxCost = opts.maxCost || parseFloat(process.env.PIPELINE_MAX_COST || '0') || Infinity;
    
    this.log(chalk.bold(`\n${'='.repeat(60)}`));
    this.log(chalk.bold(`🚀 PIPELINE: ${pipelineName.toUpperCase()}`));
    this.log(chalk.bold(`   Run ID: ${runId}`));
    if (resumeFromStage > 0) this.log(chalk.bold(`   Resume from: Stage ${resumeFromStage + 1}`));
    if (maxCost < Infinity) this.log(chalk.bold(`   Cost budget: $${maxCost.toFixed(2)}`));
    this.log(chalk.bold(`${'='.repeat(60)}\n`));

    const startTime = Date.now();
    const run = {
      id: runId,
      pipelineId,
      pipelineName,
      startTime,
      status: 'running',
      stageResults: {},
      errors: [],
    };
    this.activeRuns.set(runId, run);

    // Store initial input in memory (only if fresh run)
    if (resumeFromStage === 0) {
      memory.set(pipelineId, 'input', input);
    }

    // Start GPU services (TTS + ComfyUI) before pipeline runs
    let gpuStarted = false;
    if (opts.gpuServices !== false) {
      try {
        const gpuStatus = await startGpuServices();
        gpuStarted = true;
        this.log(chalk.cyan(`🖥️  GPU: TTS=${gpuStatus.tts ? '✓' : '✗'} ComfyUI=${gpuStatus.comfyui ? '✓' : '✗'}`));
        if (!gpuStatus.tts) this.tg.onServiceDown('TTS Server');
        if (!gpuStatus.comfyui) this.tg.onServiceDown('ComfyUI');
      } catch (e) {
        this.log(chalk.yellow(`⚠️  GPU services startup failed: ${e.message} — continuing anyway`));
        this.tg.onServiceDown('GPU Services');
      }
    }

    // Telegram: pipeline started
    this.tg.onStart({ topic: input.topic || input.videoUrl || pipelineName, pipelineId, maxCost: maxCost < Infinity ? maxCost : null });

    try {
      let i = resumeFromStage;
      while (i < pipeline.stages.length) {
        // Cost budget check
        const currentCost = this.getTotalCost();
        if (currentCost >= maxCost) {
          this.log(chalk.red(`💰 COST LIMIT reached: $${currentCost.toFixed(4)} >= $${maxCost.toFixed(2)}`));
          this.log(chalk.yellow(`Pipeline paused. Resume with: --resume ${pipelineId}`));
          await memory.checkpoint(pipelineId, i - 1, pipeline.stages[i - 1]?.name || 'unknown');
          this.tg.onCostAlert({ amount: currentCost, limit: maxCost });
          run.status = 'paused_cost';
          break;
        }

        const stage = pipeline.stages[i];

        // ─── PARALLEL STAGE SUPPORT ─────────────────────
        // If stage has parallel: true AND next stage also has parallel: true,
        // run them concurrently
        if (stage.parallel && i + 1 < pipeline.stages.length && pipeline.stages[i + 1].parallel) {
          const parallelStages = [stage];
          let j = i + 1;
          while (j < pipeline.stages.length && pipeline.stages[j].parallel) {
            parallelStages.push(pipeline.stages[j]);
            j++;
          }

          this.log(chalk.bold(`\n--- [${i + 1}-${j}/${pipeline.stages.length}] PARALLEL: ${parallelStages.map(s => s.name).join(' + ')} ---`));

          const parallelPromises = parallelStages.map(async (pStage, idx) => {
            const agent = this.agents.get(pStage.agentId);
            if (!agent) throw new Error(`Agent not found: ${pStage.agentId}`);

            const task = typeof pStage.task === 'function'
              ? pStage.task(memory.getAll(pipelineId), input)
              : pStage.task;

            try {
              const result = await agent.execute(task, {
                pipelineId,
                responseFormat: pStage.responseFormat || 'text',
              });
              memory.set(pipelineId, pStage.outputKey || `stage_${i + idx}_output`, result);
              run.stageResults[pStage.name] = {
                agentId: pStage.agentId,
                output: result.substring(0, 200) + (result.length > 200 ? '...' : ''),
                tokens: agent.totalTokens,
                durationMs: Date.now() - startTime,
              };
              this.log(chalk.green(`  ✓ ${agent.name} completed`));
              return { stage: pStage.name, success: true };
            } catch (error) {
              this.log(chalk.red(`  ✗ ${agent.name} failed: ${error.message}`));
              run.errors.push({ stage: pStage.name, error: error.message });
              if (pStage.required !== false) throw error;
              return { stage: pStage.name, success: false };
            }
          });

          await Promise.allSettled(parallelPromises);

          // Checkpoint after parallel block
          await memory.checkpoint(pipelineId, j - 1, parallelStages[parallelStages.length - 1].name);
          i = j;
          continue;
        }

        // ─── SEQUENTIAL STAGE ───────────────────────────
        const stageNum = `[${i + 1}/${pipeline.stages.length}]`;
        this.log(chalk.bold(`\n--- ${stageNum} Stage: ${stage.name} ---`));

        // Check if stage should be skipped
        if (stage.condition && !stage.condition(memory.getAll(pipelineId))) {
          this.log(chalk.yellow(`Skipped (condition not met)`));
          i++;
          continue;
        }

        const agent = this.agents.get(stage.agentId);
        if (!agent) {
          throw new Error(`Agent not found: ${stage.agentId}`);
        }

        // Build task from template + memory
        const task = typeof stage.task === 'function'
          ? stage.task(memory.getAll(pipelineId), input)
          : stage.task;

        const spinner = ora({
          text: `${agent.name} is working...`,
          color: 'cyan',
        }).start();

        try {
          const result = await agent.execute(task, {
            pipelineId,
            responseFormat: stage.responseFormat || 'text',
          });

          // Store stage output with a clean key
          memory.set(pipelineId, stage.outputKey || `stage_${i}_output`, result);
          run.stageResults[stage.name] = {
            agentId: stage.agentId,
            output: result.substring(0, 200) + (result.length > 200 ? '...' : ''),
            tokens: agent.totalTokens,
            durationMs: Date.now() - startTime,
          };

          spinner.succeed(`${agent.name} completed`);

          // Post-processing hook
          if (stage.postProcess) {
            const processed = await stage.postProcess(result, memory.getAll(pipelineId));
            if (processed) {
              memory.set(pipelineId, `${stage.outputKey || `stage_${i}`}_processed`, processed);
            }
          }

          // Checkpoint after each stage
          await memory.checkpoint(pipelineId, i, stage.name);

          // Telegram: stage done (with per-stage cost delta)
          const stageCost = agent.totalCost - (agent._prevCostSnapshot || 0);
          agent._prevCostSnapshot = agent.totalCost;
          this.tg.onStageComplete({ stageIndex: i, totalStages: pipeline.stages.length, stageName: stage.name, durationMs: Date.now() - startTime, cost: stageCost });

        } catch (error) {
          spinner.fail(`${agent.name} failed: ${error.message}`);
          run.errors.push({ stage: stage.name, error: error.message });

          // Telegram: stage failed
          this.tg.onStageFail?.({ stageIndex: i, totalStages: pipeline.stages.length, stageName: stage.name, error: error.message });

          // Retry logic
          if (stage.retries && stage.retries > 0) {
            this.log(chalk.yellow(`Retrying (${stage.retries} attempts left)...`));
            stage.retries--;
            continue; // Retry same stage (i stays the same)
          }

          if (stage.required !== false) {
            // Checkpoint before crash so we can resume
            await memory.checkpoint(pipelineId, i - 1, pipeline.stages[i - 1]?.name || 'input');
            throw error; // Fatal — stop pipeline
          }
          // Non-required stage — continue
          this.log(chalk.yellow(`Non-critical stage failed, continuing...`));
        }

        i++;
      }

      // Pipeline complete
      run.status = run.status === 'paused_cost' ? 'paused_cost' : 'completed';
      run.durationMs = Date.now() - startTime;
      run.totalCost = this.getTotalCost();

      // ─── AUTO-SEED HOOK: fire after successful pipeline completion ────
      if (run.status === 'completed') {
        const allMem = memory.getAll(pipelineId);
        const ytUrl = allMem.youtube_url;
        const ytId = allMem.youtube_video_id;
        if (ytUrl) {
          this.log(chalk.cyan('🌱 Auto-seeding: distributing video to social platforms...'));
          try {
            let meta = {};
            try { meta = JSON.parse(allMem.publish_metadata || '{}'); } catch {}
            const ytMeta = meta.metadata?.youtube || {};
            run.seedResult = await runAutoSeed({
              videoUrl: ytUrl,
              videoId: ytId,
              title: ytMeta.title || input.topic || 'New Video',
              description: ytMeta.description || '',
              tags: ytMeta.tags || [],
              pipelineId,
            }, {
              log: (msg, level) => this.log(chalk.cyan(`🌱 ${msg}`)),
            });
            this.log(chalk.green('🌱 Auto-seed complete'));
            const seededPlatforms = run.seedResult?.platforms || [];
            if (seededPlatforms.length) this.tg.onAutoSeedDone?.({ platforms: seededPlatforms, videoUrl: ytUrl });
          } catch (err) {
            this.log(chalk.yellow(`🌱 Auto-seed failed (non-blocking): ${err.message}`));
          }
        } else {
          this.log(chalk.yellow('🌱 Auto-seed skipped: no YouTube URL (video not uploaded yet)'));
        }

        // ─── CONTENT REPURPOSE HOOK: generate blog, social, newsletter ───
        if (process.env.ENABLE_CONTENT_REPURPOSE) {
          this.log(chalk.cyan('📝 Content repurpose: generating blog, social media, newsletter...'));
          try {
            run.repurposeResult = await repurposeContent(pipelineId, {
              log: (msg, level) => this.log(chalk.cyan(`📝 ${msg}`)),
            });
            const fileCount = run.repurposeResult?.files?.length || 0;
            this.log(chalk.green(`📝 Content repurpose complete: ${fileCount} files generated`));
          } catch (err) {
            this.log(chalk.yellow(`📝 Content repurpose failed (non-blocking): ${err.message}`));
          }
        }
      }

      this.printSummary(run);

      // Telegram: pipeline completed
      if (run.status === 'completed') {
        let title = input.topic || 'Untitled';
        let videoUrl = null;
        try {
          const allMem = memory.getAll(pipelineId);
          const meta = JSON.parse(allMem.publish_metadata || '{}');
          title = meta.metadata?.youtube?.title || meta.youtube?.title || title;
          videoUrl = allMem.youtube_url || null;
        } catch {}
        this.tg.onComplete({ title, pipelineId, durationMs: run.durationMs, totalCost: run.totalCost, videoUrl });
      }

      reportPipelineRun(this, pipelineId, memory.getAll(pipelineId), run).catch(() => {});
      return {
        runId,
        pipelineId,
        results: memory.getAll(pipelineId),
        stats: run,
      };

    } catch (error) {
      run.status = 'failed';
      run.durationMs = Date.now() - startTime;
      run.failReason = error.message;
      this.log(chalk.red(`\n❌ PIPELINE FAILED: ${error.message}`));
      this.log(chalk.yellow(`💾 Resume with: --resume ${pipelineId}`));

      // Telegram: pipeline failed
      const failedStage = run.errors[run.errors.length - 1];
      const stageIdx = failedStage ? pipeline.stages.findIndex(s => s.name === failedStage.stage) : null;
      this.tg.onFail({ pipelineId, stageIndex: stageIdx, stageName: failedStage?.stage, error: error.message });

      // Ensure the fatal error is included in run.errors
      if (!run.errors.some(e => e.error === error.message)) {
        run.errors.push({ stage: failedStage?.stage ?? 'unknown', error: error.message });
      }

      // Report failure to Supabase (so triggers fire and dashboard updates)
      reportPipelineRun(this, pipelineId, memory.getAll(pipelineId), run).catch((reportErr) => {
        this.log(chalk.yellow(`⚠ Failed to report failed run: ${reportErr.message}`));
      });

      throw error;
    } finally {
      // Stop GPU services after pipeline completes or fails
      if (gpuStarted) {
        try {
          await stopGpuServices();
          this.log(chalk.cyan('🖥️  GPU services stopped'));
        } catch { /* best-effort cleanup */ }
      }
    }
  }

  /**
   * Handle messages from agents
   */
  handleMessage(msg) {
    // Log errors
    if (msg.type === 'error') {
      this.log(chalk.red(`Error from ${msg.from}: ${msg.payload.error}`));
    }
  }

  /**
   * Get total cost across all agents
   */
  getTotalCost() {
    let total = 0;
    for (const agent of this.agents.values()) {
      total += agent.totalCost;
    }
    return total;
  }

  /**
   * Print pipeline execution summary
   */
  printSummary(run) {
    this.log(chalk.bold(`\n${'='.repeat(60)}`));
    this.log(chalk.bold.green(`✅ PIPELINE COMPLETE: ${run.pipelineName}`));
    this.log(chalk.bold(`${'='.repeat(60)}`));
    this.log(`Duration: ${(run.durationMs / 1000).toFixed(1)}s`);
    this.log(`Status: ${run.status}`);
    this.log(`Errors: ${run.errors.length}`);
    this.log(`Total Cost: $${run.totalCost.toFixed(4)}`);
    this.log('');

    // Per-agent stats
    this.log(chalk.bold('Agent Stats:'));
    for (const agent of this.agents.values()) {
      if (agent.executionCount > 0) {
        this.log(`  ${agent.name}: ${agent.executionCount} calls, ${agent.stats.estimatedCost}`);
      }
    }
    this.log(chalk.bold(`${'='.repeat(60)}\n`));
  }

  /**
   * Log with conductor prefix
   */
  log(message) {
    console.log(`${chalk.bold.magenta('[Conductor]')} ${message}`);
  }
}

export default Conductor;
