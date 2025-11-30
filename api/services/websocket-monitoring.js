/**
 * WebSocket Monitoring Server
 * Phase 3: Real-time campaign monitoring via WebSocket
 */

const WebSocket = require('ws');
const CampaignMonitoringService = require('./campaign-monitoring-service');

class WebSocketMonitoringServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/campaign-monitoring'
    });
    this.monitoringService = new CampaignMonitoringService();
    this.clients = new Set();

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle new connections
    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection for campaign monitoring');
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to campaign monitoring',
        timestamp: new Date().toISOString()
      }));

      // Handle messages from client
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log('📡 WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Listen to monitoring service events
    this.monitoringService.on('metrics_update', (data) => {
      this.broadcast({
        type: 'metrics_update',
        ...data
      });
    });

    this.monitoringService.on('metrics_error', (data) => {
      this.broadcast({
        type: 'metrics_error',
        ...data
      });
    });
  }

  /**
   * Handle WebSocket messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} data - Message data
   */
  async handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'start_monitoring':
        try {
          const result = await this.monitoringService.startMonitoring(payload);
          ws.send(JSON.stringify({
            type: 'monitoring_started',
            ...result
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
        break;

      case 'stop_monitoring':
        const stopResult = this.monitoringService.stopMonitoring(payload.campaign_id);
        ws.send(JSON.stringify({
          type: 'monitoring_stopped',
          ...stopResult
        }));
        break;

      case 'get_metrics':
        const metrics = this.monitoringService.getLatestMetrics(payload.campaign_id);
        ws.send(JSON.stringify({
          type: 'metrics',
          campaign_id: payload.campaign_id,
          metrics
        }));
        break;

      case 'get_status':
        const status = this.monitoringService.getStatus();
        ws.send(JSON.stringify({
          type: 'status',
          ...status
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `Unknown message type: ${type}`
        }));
    }
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} data - Data to broadcast
   */
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Get server status
   * @returns {Object} Server status
   */
  getStatus() {
    return {
      connected_clients: this.clients.size,
      active_monitors: this.monitoringService.activeMonitors.size,
      monitoring_status: this.monitoringService.getStatus()
    };
  }
}

module.exports = WebSocketMonitoringServer;

