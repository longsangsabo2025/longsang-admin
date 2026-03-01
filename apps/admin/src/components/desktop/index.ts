/**
 * 🖥️ Desktop-only components
 *
 * These components only render when running in Electron desktop app.
 */

export { ServiceStatusPanel, ServiceStatusBadges } from './ServiceStatusPanel';
export { default as useElectron, isElectron } from '@/hooks/useElectron';
