/**
 * Execution Report Exporter
 * Export execution history as PDF, HTML, or JSON reports
 */

import { ExecutionHistory } from '@/hooks/useExecutionHistory';

export interface ExecutionReportOptions {
  format: 'json' | 'html' | 'text';
  includeSteps: boolean;
  includeErrors: boolean;
  dateRange?: { start: Date; end: Date };
}

export function exportExecutionReport(
  executions: ExecutionHistory[],
  options: ExecutionReportOptions
): void {
  const filtered = filterExecutions(executions, options.dateRange);

  switch (options.format) {
    case 'json':
      exportJSON(filtered, options);
      break;
    case 'html':
      exportHTML(filtered, options);
      break;
    case 'text':
      exportText(filtered, options);
      break;
  }
}

function filterExecutions(
  executions: ExecutionHistory[],
  dateRange?: { start: Date; end: Date }
): ExecutionHistory[] {
  if (!dateRange) return executions;

  return executions.filter((exec) => {
    const execDate = exec.timestamp;
    return execDate >= dateRange.start && execDate <= dateRange.end;
  });
}

function exportJSON(executions: ExecutionHistory[], options: ExecutionReportOptions): void {
  const data = executions.map((exec) => ({
    id: exec.id,
    command: exec.command,
    timestamp: exec.timestamp.toISOString(),
    duration: exec.duration,
    status: exec.status,
    error: options.includeErrors ? exec.error : undefined,
    steps: options.includeSteps
      ? exec.steps.map((step) => ({
          id: step.id,
          name: step.name,
          description: step.description,
          status: step.status,
          duration: step.duration,
        }))
      : undefined,
  }));

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, `execution-report-${new Date().toISOString().split('T')[0]}.json`);
}

function exportHTML(executions: ExecutionHistory[], options: ExecutionReportOptions): void {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Execution Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .execution { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
    .execution-header { display: flex; justify-content: space-between; align-items: center; }
    .command { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
    .meta { color: #666; font-size: 12px; }
    .step { margin: 5px 0; padding: 5px; background: #f5f5f5; border-radius: 3px; }
    .status-completed { color: green; }
    .status-failed { color: red; }
    .status-cancelled { color: orange; }
  </style>
</head>
<body>
  <h1>Execution Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Executions: ${executions.length}</p>
  ${executions
    .map(
      (exec) => `
    <div class="execution">
      <div class="execution-header">
        <div>
          <div class="command">${escapeHtml(exec.command)}</div>
          <div class="meta">
            ${exec.timestamp.toLocaleString()} •
            ${(exec.duration / 1000).toFixed(2)}s •
            <span class="status-${exec.status}">${exec.status}</span>
          </div>
        </div>
      </div>
      ${
        options.includeSteps
          ? `
        <div style="margin-top: 10px;">
          <strong>Steps (${exec.steps.length}):</strong>
          ${exec.steps
            .map(
              (step, idx) => `
            <div class="step">
              ${idx + 1}. ${escapeHtml(step.name)} -
              <span class="status-${step.status}">${step.status}</span>
              ${step.duration ? `(${(step.duration / 1000).toFixed(2)}s)` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
      ${
        options.includeErrors && exec.error
          ? `<div style="color: red; margin-top: 10px;">Error: ${escapeHtml(exec.error)}</div>`
          : ''
      }
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, `execution-report-${new Date().toISOString().split('T')[0]}.html`);
}

function exportText(executions: ExecutionHistory[], options: ExecutionReportOptions): void {
  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push('EXECUTION REPORT');
  lines.push('='.repeat(80));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Executions: ${executions.length}`);
  lines.push('');

  executions.forEach((exec, index) => {
    lines.push(`${index + 1}. ${exec.command}`);
    lines.push(`   Status: ${exec.status}`);
    lines.push(`   Time: ${exec.timestamp.toLocaleString()}`);
    lines.push(`   Duration: ${(exec.duration / 1000).toFixed(2)}s`);

    if (options.includeSteps) {
      lines.push(`   Steps (${exec.steps.length}):`);
      exec.steps.forEach((step, stepIdx) => {
        lines.push(`     ${stepIdx + 1}. ${step.name} [${step.status}]`);
        if (step.duration) {
          lines.push(`        Duration: ${(step.duration / 1000).toFixed(2)}s`);
        }
      });
    }

    if (options.includeErrors && exec.error) {
      lines.push(`   Error: ${exec.error}`);
    }

    lines.push('');
  });

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  downloadFile(blob, `execution-report-${new Date().toISOString().split('T')[0]}.txt`);
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
