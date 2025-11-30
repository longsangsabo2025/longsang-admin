/**
 * 🌐 WEBSOCKET BRIDGE SERVER
 * 
 * Real-time bridge between:
 * - Sentry webhooks (production errors)
 * - Web UI (remote control)
 * - VS Code Copilot (local processing)
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 3003;
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, type, connectedAt }
    this.messageQueue = []; // Queue for when no clients connected
    this.stats = {
      totalConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errorsReceived: 0,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Start WebSocket server
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         🌐 WEBSOCKET BRIDGE - Real-time Communication         ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:       ${this.port}                                              ║
║  Status:     ✅ Running                                        ║
║  Clients:    Waiting for connections...                       ║
╚═══════════════════════════════════════════════════════════════╝
`);

    this.wss.on('connection', (ws, req) => {
      const clientId = this._generateClientId();
      const clientIp = req.socket.remoteAddress;
      
      // Store client
      this.clients.set(clientId, {
        ws,
        type: 'unknown',
        connectedAt: new Date().toISOString(),
        ip: clientIp
      });
      
      this.stats.totalConnections++;
      
      console.log(`[WS Bridge] 🔗 Client connected: ${clientId} from ${clientIp}`);
      console.log(`[WS Bridge] 📊 Active clients: ${this.clients.size}`);

      // Send welcome message
      this._send(ws, {
        type: 'welcome',
        clientId,
        message: 'Connected to WebSocket Bridge',
        timestamp: new Date().toISOString()
      });

      // Send any queued messages
      this._flushQueue(ws);

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this._handleMessage(clientId, message);
        } catch (e) {
          console.error(`[WS Bridge] Invalid message from ${clientId}:`, e.message);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        const client = this.clients.get(clientId);
        console.log(`[WS Bridge] 🔌 Client disconnected: ${clientId} (type: ${client?.type})`);
        this.clients.delete(clientId);
        console.log(`[WS Bridge] 📊 Active clients: ${this.clients.size}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WS Bridge] ❌ Client error ${clientId}:`, error.message);
      });
    });

    this.wss.on('error', (error) => {
      console.error('[WS Bridge] ❌ Server error:', error.message);
    });

    return this;
  }

  /**
   * Handle incoming message
   */
  _handleMessage(clientId, message) {
    this.stats.messagesReceived++;
    const client = this.clients.get(clientId);

    console.log(`[WS Bridge] 📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'register':
        // Client identifies itself (vscode, webui, sentry, etc)
        if (client) {
          client.type = message.clientType || 'unknown';
          console.log(`[WS Bridge] 📝 Client ${clientId} registered as: ${client.type}`);
        }
        break;

      case 'error_alert':
        // Error from Sentry or production
        this.stats.errorsReceived++;
        this._handleErrorAlert(clientId, message);
        break;

      case 'task_request':
        // Task from Web UI
        this._handleTaskRequest(clientId, message);
        break;

      case 'task_response':
        // Response from VS Code
        this._handleTaskResponse(clientId, message);
        break;

      case 'ping':
        this._send(client?.ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        // Broadcast to all other clients
        this._broadcast(message, clientId);
    }

    // Emit for external handlers
    this.emit('message', { clientId, message });
  }

  /**
   * Handle error alert (from Sentry)
   */
  _handleErrorAlert(clientId, message) {
    const errorData = {
      type: 'error_alert',
      source: 'sentry',
      error: message.error,
      context: message.context,
      timestamp: new Date().toISOString(),
      priority: message.priority || 'normal'
    };

    console.log(`[WS Bridge] 🚨 Error Alert: ${message.error?.message || 'Unknown error'}`);

    // Send to VS Code clients
    this._sendToType('vscode', errorData);

    // Also send to WebUI for display
    this._sendToType('webui', {
      type: 'error_notification',
      ...errorData
    });

    this.emit('error_alert', errorData);
  }

  /**
   * Handle task request (from Web UI)
   */
  _handleTaskRequest(clientId, message) {
    const taskData = {
      type: 'task_request',
      taskId: message.taskId || this._generateTaskId(),
      task: message.task,
      params: message.params,
      requester: clientId,
      timestamp: new Date().toISOString()
    };

    console.log(`[WS Bridge] 📋 Task Request: ${taskData.task}`);

    // Send to VS Code clients
    const sent = this._sendToType('vscode', taskData);

    if (!sent) {
      // No VS Code connected, queue the task
      this.messageQueue.push(taskData);
      console.log(`[WS Bridge] 📥 Task queued (no VS Code connected)`);

      // Notify requester
      this._sendToClient(clientId, {
        type: 'task_queued',
        taskId: taskData.taskId,
        message: 'VS Code not connected. Task queued for later processing.'
      });
    }

    this.emit('task_request', taskData);
  }

  /**
   * Handle task response (from VS Code)
   */
  _handleTaskResponse(clientId, message) {
    const responseData = {
      type: 'task_response',
      taskId: message.taskId,
      result: message.result,
      status: message.status,
      timestamp: new Date().toISOString()
    };

    console.log(`[WS Bridge] ✅ Task Response: ${message.taskId} - ${message.status}`);

    // Send to all WebUI clients
    this._sendToType('webui', responseData);

    this.emit('task_response', responseData);
  }

  /**
   * Send Sentry webhook data
   */
  handleSentryWebhook(webhookData) {
    const errorAlert = {
      type: 'error_alert',
      source: 'sentry_webhook',
      error: {
        id: webhookData.event?.event_id,
        message: webhookData.event?.message || webhookData.event?.title,
        level: webhookData.event?.level || 'error',
        platform: webhookData.event?.platform,
        culprit: webhookData.event?.culprit,
        url: webhookData.url,
        project: webhookData.project?.name
      },
      context: {
        user: webhookData.event?.user,
        tags: webhookData.event?.tags,
        extra: webhookData.event?.extra,
        stacktrace: webhookData.event?.stacktrace
      },
      timestamp: new Date().toISOString(),
      priority: webhookData.event?.level === 'fatal' ? 'critical' : 'normal'
    };

    this._handleErrorAlert('sentry_webhook', errorAlert);
    return errorAlert;
  }

  /**
   * Send to specific client type
   */
  _sendToType(type, message) {
    let sent = false;
    for (const [clientId, client] of this.clients) {
      if (client.type === type && client.ws.readyState === WebSocket.OPEN) {
        this._send(client.ws, message);
        sent = true;
      }
    }
    return sent;
  }

  /**
   * Send to specific client
   */
  _sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      this._send(client.ws, message);
      return true;
    }
    return false;
  }

  /**
   * Broadcast to all clients except sender
   */
  _broadcast(message, excludeClientId = null) {
    for (const [clientId, client] of this.clients) {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        this._send(client.ws, message);
      }
    }
  }

  /**
   * Send message to websocket
   */
  _send(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      this.stats.messagesSent++;
    }
  }

  /**
   * Flush queued messages to new client
   */
  _flushQueue(ws) {
    if (this.messageQueue.length > 0) {
      console.log(`[WS Bridge] 📤 Flushing ${this.messageQueue.length} queued messages`);
      for (const message of this.messageQueue) {
        this._send(ws, message);
      }
      this.messageQueue = [];
    }
  }

  /**
   * Get bridge stats
   */
  getStats() {
    return {
      ...this.stats,
      activeClients: this.clients.size,
      queuedMessages: this.messageQueue.length,
      clientsByType: this._getClientsByType(),
      uptime: this._getUptime()
    };
  }

  /**
   * Get clients grouped by type
   */
  _getClientsByType() {
    const byType = {};
    for (const [, client] of this.clients) {
      byType[client.type] = (byType[client.type] || 0) + 1;
    }
    return byType;
  }

  /**
   * Get uptime
   */
  _getUptime() {
    const start = new Date(this.stats.startedAt);
    const now = new Date();
    const seconds = Math.floor((now - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Generate client ID
   */
  _generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate task ID
   */
  _generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('[WS Bridge] 🛑 Server stopped');
    }
  }
}

// Singleton instance
let bridgeInstance = null;

function getBridge(options) {
  if (!bridgeInstance) {
    bridgeInstance = new WebSocketBridge(options);
  }
  return bridgeInstance;
}

module.exports = { WebSocketBridge, getBridge };
