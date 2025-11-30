/**
 * 🔔 Alert Detector Service
 *
 * Detects anomalies and generates alerts
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Detect anomalies in workflow executions
 */
async function detectAnomalies() {
  const alerts = [];

  try {
    // Get recent executions
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100);

    if (!executions || executions.length === 0) {
      return alerts;
    }

    // Check for sudden failure spike
    const recentFailures = executions
      .slice(0, 10)
      .filter(e => e.status === 'failed').length;

    if (recentFailures >= 5) {
      alerts.push({
        type: 'anomaly',
        severity: 'critical',
        message: `Phát hiện ${recentFailures} lỗi trong 10 executions gần nhất`,
        metadata: {
          failureRate: recentFailures / 10,
          recentExecutions: executions.slice(0, 10).map(e => ({
            id: e.id,
            status: e.status,
            error: e.error_message
          }))
        }
      });
    }

    // Check for performance degradation
    const executionTimes = executions
      .filter(e => e.execution_time_ms)
      .map(e => e.execution_time_ms);

    if (executionTimes.length > 10) {
      const recentAvg = executionTimes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const previousAvg = executionTimes.slice(10, 20).reduce((a, b) => a + b, 0) / 10;

      if (recentAvg > previousAvg * 1.5) {
        alerts.push({
          type: 'anomaly',
          severity: 'warning',
          message: `Execution time tăng ${((recentAvg / previousAvg - 1) * 100).toFixed(1)}% so với trước`,
          metadata: {
            recentAverage: Math.round(recentAvg),
            previousAverage: Math.round(previousAvg)
          }
        });
      }
    }

    // Check for pattern opportunities
    // TODO: Implement pattern detection

  } catch (error) {
    console.error('Error detecting anomalies:', error);
  }

  return alerts;
}

/**
 * Store alerts in database
 */
async function storeAlerts(alerts, userId = null) {
  if (alerts.length === 0) return;

  try {
    const { error } = await supabase
      .from('intelligent_alerts')
      .insert(alerts.map(alert => ({
        ...alert,
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        detected_at: new Date().toISOString()
      })));

    if (error) throw error;
  } catch (error) {
    console.error('Error storing alerts:', error);
  }
}

/**
 * Run detection and store alerts
 */
async function runDetection(userId = null) {
  const alerts = await detectAnomalies();
  await storeAlerts(alerts, userId);
  return alerts;
}

module.exports = {
  detectAnomalies,
  storeAlerts,
  runDetection
};

