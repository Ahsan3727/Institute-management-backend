import mongoose from 'mongoose';

const HubAccountSchema = new mongoose.Schema(
  {
    instituteName: { type: String, required: true, trim: true },
    principalName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash ONLY — hashed in app/api/hub/route.js before this is ever
    // written. Never plaintext, never returned to the client.
    password: { type: String, required: true },
    // Phase 2.1: each Hub account owns its own InstituteData document
    // instead of every account overwriting one shared institute.
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstituteData', required: true },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'hub_accounts',
  }
);

const HubAccount =
  mongoose.models.HubAccount || mongoose.model('HubAccount', HubAccountSchema);

export default HubAccount;
