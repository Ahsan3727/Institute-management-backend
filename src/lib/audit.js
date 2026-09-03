import AuditLog from '@/models/AuditLog';

/**
 * Best-effort audit trail write. Never throws — an audit-log failure must
 * not block the primary action it's describing.
 */
export async function recordAudit({ action, actorRole, actorUsername, instituteId, ip, meta } = {}) {
  try {
    await AuditLog.create({
      action,
      actorRole: actorRole || null,
      actorUsername: actorUsername || null,
      instituteId: instituteId || null,
      ip: ip || null,
      meta: meta || null,
    });
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
}
