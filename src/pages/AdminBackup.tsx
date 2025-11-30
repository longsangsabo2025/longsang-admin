/**
 * =================================================================
 * ADMIN BACKUP PAGE
 * =================================================================
 * /admin/backup - Manage backups
 */

import { BackupManager } from "@/components/admin/BackupManager";

export default function AdminBackup() {
  return (
    <div className="container mx-auto py-6">
      <BackupManager />
    </div>
  );
}
