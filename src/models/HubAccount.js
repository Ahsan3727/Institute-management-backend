import mongoose from 'mongoose';

const HubAccountSchema = new mongoose.Schema(
  {
    instituteName: { type: String, required: true },
    principalName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
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
