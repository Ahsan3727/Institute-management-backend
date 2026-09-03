import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    actorRole: { type: String, default: null },
    actorUsername: { type: String, default: null },
    instituteId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    ip: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: 'audit_logs' }
);

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
