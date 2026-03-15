/**
 * Message Bus — Inter-agent communication
 * 
 * Agents don't call each other directly.
 * They post messages to the bus. The Conductor routes them.
 * This prevents circular dependencies and enables monitoring.
 */
import EventEmitter from 'eventemitter3';
import { nanoid } from 'nanoid';

class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.messages = [];
    this.subscriptions = new Map(); // agentId → handler
  }

  /**
   * Send a message from one agent to another (or broadcast)
   */
  send({ from, to, type, payload, replyTo = null }) {
    const message = {
      id: nanoid(),
      from,
      to: to || 'broadcast',
      type, // 'task', 'result', 'error', 'request', 'status'
      payload,
      replyTo,
      timestamp: Date.now(),
    };
    this.messages.push(message);

    // Emit to specific agent
    if (to) {
      this.emit(`agent:${to}`, message);
    }
    // Always emit to conductor
    this.emit('conductor', message);
    // Global log
    this.emit('message', message);

    return message;
  }

  /**
   * Agent subscribes to messages addressed to it
   */
  subscribe(agentId, handler) {
    this.subscriptions.set(agentId, handler);
    this.on(`agent:${agentId}`, handler);
  }

  /**
   * Get conversation history between agents
   */
  getHistory(agentId = null, limit = 50) {
    let msgs = this.messages;
    if (agentId) {
      msgs = msgs.filter(m => m.from === agentId || m.to === agentId);
    }
    return msgs.slice(-limit);
  }

  /**
   * Get all results from a pipeline run
   */
  getResults(pipelineId) {
    return this.messages.filter(
      m => m.type === 'result' && m.payload?.pipelineId === pipelineId
    );
  }

  /**
   * Clear history
   */
  clear() {
    this.messages = [];
  }

  /**
   * Stats
   */
  get stats() {
    const byAgent = {};
    for (const msg of this.messages) {
      byAgent[msg.from] = (byAgent[msg.from] || 0) + 1;
    }
    return {
      totalMessages: this.messages.length,
      byAgent,
      errors: this.messages.filter(m => m.type === 'error').length,
    };
  }
}

// Singleton
export const messageBus = new MessageBus();
export default messageBus;
