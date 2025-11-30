/**
 * 🔔 Native Notifications
 * 
 * Sends native OS notifications for Bug System alerts,
 * service status changes, and other important events.
 */

const { Notification, nativeImage, shell } = require('electron');
const path = require('path');
const { PATHS, APP_INFO } = require('./config.cjs');
const { loggers } = require('./logger.cjs');

const log = loggers.main;

// Notification types with icons and sounds
const NOTIFICATION_TYPES = {
  error: {
    title: '🔴 Error Alert',
    urgency: 'critical',
  },
  warning: {
    title: '🟡 Warning',
    urgency: 'normal',
  },
  info: {
    title: '🔵 Info',
    urgency: 'low',
  },
  success: {
    title: '🟢 Success',
    urgency: 'low',
  },
  service: {
    title: '⚙️ Service Update',
    urgency: 'normal',
  },
  update: {
    title: '🔄 Update Available',
    urgency: 'normal',
  },
};

class NotificationManager {
  constructor() {
    this.enabled = true;
    this.history = [];
    this.maxHistory = 100;
    this.icon = null;
  }

  /**
   * Initialize notification manager
   */
  init() {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      log.warn('Native notifications not supported on this system');
      this.enabled = false;
      return;
    }

    // Load app icon for notifications
    try {
      this.icon = nativeImage.createFromPath(PATHS.icon);
    } catch (err) {
      log.warn('Failed to load notification icon:', err.message);
    }

    log.info('Notification manager initialized');
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type (error, warning, info, success, service, update)
   * @param {string} options.title - Notification title (optional, uses type default)
   * @param {string} options.body - Notification body text
   * @param {string} options.url - URL to open on click
   * @param {Object} options.data - Additional data to attach
   */
  show(options) {
    if (!this.enabled) {
      log.debug('Notifications disabled, skipping:', options);
      return null;
    }

    const type = options.type || 'info';
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;

    const notification = new Notification({
      title: options.title || typeConfig.title,
      body: options.body || '',
      icon: this.icon,
      urgency: typeConfig.urgency,
      silent: type === 'info', // Only make sound for important notifications
      timeoutType: type === 'error' ? 'never' : 'default',
    });

    // Handle click
    notification.on('click', () => {
      log.debug('Notification clicked:', options);
      
      if (options.url) {
        shell.openExternal(options.url);
      }

      // Emit event for app to handle
      if (options.data && options.data.action) {
        // Could use IPC to send to renderer
      }
    });

    // Show the notification
    notification.show();

    // Add to history
    this._addToHistory({
      type,
      title: notification.title,
      body: notification.body,
      timestamp: new Date().toISOString(),
      data: options.data,
    });

    log.debug('Notification shown:', notification.title);
    return notification;
  }

  /**
   * Show error notification
   */
  error(body, data = {}) {
    return this.show({ type: 'error', body, data });
  }

  /**
   * Show warning notification
   */
  warning(body, data = {}) {
    return this.show({ type: 'warning', body, data });
  }

  /**
   * Show info notification
   */
  info(body, data = {}) {
    return this.show({ type: 'info', body, data });
  }

  /**
   * Show success notification
   */
  success(body, data = {}) {
    return this.show({ type: 'success', body, data });
  }

  /**
   * Show service status notification
   */
  serviceStatus(serviceName, status) {
    const messages = {
      running: `${serviceName} is now running`,
      stopped: `${serviceName} has stopped`,
      error: `${serviceName} encountered an error`,
      restarting: `${serviceName} is restarting...`,
    };

    return this.show({
      type: 'service',
      body: messages[status] || `${serviceName}: ${status}`,
      data: { service: serviceName, status },
    });
  }

  /**
   * Show Bug System alert as notification
   */
  bugAlert(alert) {
    const severityEmoji = {
      critical: '🚨',
      high: '🔴',
      medium: '🟡',
      low: '🔵',
    };

    const emoji = severityEmoji[alert.severity] || '⚠️';
    
    return this.show({
      type: alert.severity === 'critical' ? 'error' : 'warning',
      title: `${emoji} Bug System Alert`,
      body: alert.message || `${alert.error_type}: ${alert.error_count} occurrences`,
      data: { alertId: alert.id, severity: alert.severity },
    });
  }

  /**
   * Show update available notification
   */
  updateAvailable(version) {
    return this.show({
      type: 'update',
      body: `Version ${version} is available. Click to learn more.`,
      url: 'https://github.com/longsang/long-sang-forge/releases',
      data: { version },
    });
  }

  /**
   * Add notification to history
   */
  _addToHistory(notification) {
    this.history.unshift(notification);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
  }

  /**
   * Get notification history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear notification history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled) {
    this.enabled = enabled && Notification.isSupported();
    log.info(`Notifications ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton
const notificationManager = new NotificationManager();

module.exports = {
  NotificationManager,
  notificationManager,
  NOTIFICATION_TYPES,
};
