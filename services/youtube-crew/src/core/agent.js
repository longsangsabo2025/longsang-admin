/**
 * BaseAgent — The DNA of every agent in the crew
 * 
 * Every agent has:
 * - Identity (name, role, model)
 * - System prompt (personality + skills + constraints)
 * - execute() → think → act → report
 * - Message bus connection
 * - Memory access
 */
import { chat, estimateCost } from './llm.js';
import { messageBus } from './message-bus.js';
import { memory } from './memory.js';
import chalk from 'chalk';

export class BaseAgent {
  constructor({
    id,
    name,
    role,
    model = process.env.DEFAULT_MODEL || 'gpt-4o-mini',
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = 4096,
    tools = [],
  }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.tools = tools; // Functions this agent can call
    this.status = 'idle'; // idle, thinking, acting, done, error
    this.totalTokens = { input: 0, output: 0 };
    this.totalCost = 0;
    this.executionCount = 0;

    // Subscribe to messages addressed to this agent
    messageBus.subscribe(this.id, (msg) => this.handleMessage(msg));
  }

  /**
   * Main execution method — override in child classes for custom logic
   * Default: send task to LLM, return result
   */
  async execute(task, context = {}) {
    const pipelineId = context.pipelineId || 'standalone';
    this.status = 'thinking';
    this.log(`Executing: ${task.substring(0, 80)}...`);

    try {
      // Build context from memory
      const memoryContext = memory.getAll(pipelineId);
      const contextStr = Object.keys(memoryContext).length > 0
        ? `\n\n--- PIPELINE CONTEXT ---\n${JSON.stringify(memoryContext, null, 2)}`
        : '';

      // Think (LLM call)
      const result = await chat({
        model: this.model,
        systemPrompt: this.systemPrompt,
        userMessage: task + contextStr,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        responseFormat: context.responseFormat || 'text',
      });

      // Track costs
      this.totalTokens.input += result.tokens.input;
      this.totalTokens.output += result.tokens.output;
      this.totalCost += estimateCost(this.model, result.tokens.input, result.tokens.output);
      this.executionCount++;

      // Store result in shared memory
      memory.set(pipelineId, `${this.id}_output`, result.content);
      memory.set(pipelineId, `${this.id}_meta`, {
        tokens: result.tokens,
        durationMs: result.durationMs,
        model: result.model,
      });

      // Report to bus
      messageBus.send({
        from: this.id,
        to: 'conductor',
        type: 'result',
        payload: {
          pipelineId,
          content: result.content,
          tokens: result.tokens,
          durationMs: result.durationMs,
        },
      });

      this.status = 'done';
      this.log(`Done in ${result.durationMs}ms (${result.tokens.input}+${result.tokens.output} tokens)`);

      return result.content;

    } catch (error) {
      this.status = 'error';
      this.log(`ERROR: ${error.message}`, 'error');

      messageBus.send({
        from: this.id,
        to: 'conductor',
        type: 'error',
        payload: { pipelineId, error: error.message },
      });

      throw error;
    }
  }

  /**
   * Handle incoming messages from other agents
   */
  handleMessage(msg) {
    this.log(`Received ${msg.type} from ${msg.from}`);
    // Override in child classes for reactive behavior
  }

  /**
   * Request help from another agent
   */
  requestHelp(targetAgentId, request) {
    return messageBus.send({
      from: this.id,
      to: targetAgentId,
      type: 'request',
      payload: { request },
    });
  }

  /**
   * Update status on the bus
   */
  reportStatus(status) {
    this.status = status;
    messageBus.send({
      from: this.id,
      type: 'status',
      payload: { status },
    });
  }

  /**
   * Pretty log
   */
  log(message, level = 'info') {
    const colors = {
      info: chalk.cyan,
      warn: chalk.yellow,
      error: chalk.red,
      success: chalk.green,
    };
    const color = colors[level] || chalk.white;
    const prefix = chalk.bold(`[${this.name}]`);
    console.log(`${prefix} ${color(message)}`);
  }

  /**
   * Agent stats
   */
  get stats() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      model: this.model,
      status: this.status,
      executions: this.executionCount,
      totalTokens: this.totalTokens,
      estimatedCost: `$${this.totalCost.toFixed(4)}`,
    };
  }
}

export default BaseAgent;
