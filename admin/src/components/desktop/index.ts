/**
 * 🖥️ Desktop-only components
 *
 * These components only render when running in Electron desktop app.
 */

export { default as useElectron, isElectron } from '@/hooks/useElectron';
export { ServiceStatusBadges, ServiceStatusPanel } from './ServiceStatusPanel';
