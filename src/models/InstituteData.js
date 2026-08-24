import mongoose from 'mongoose';

const InstituteDataSchema = new mongoose.Schema(
  {
    identifier: { type: String, default: 'primary_institute', unique: true, index: true },
    admin: {
      username: { type: String, default: 'admin' },
      password: { type: String, default: 'admin123' },
      name: { type: String, default: 'Principal Admin' },
    },
    teachers: { type: Array, default: [] },
    classes: { type: Array, default: [] },
    subjects: { type: Array, default: [] },
    students: { type: Array, default: [] },
    slos: { type: Array, default: [] },
    dailyLog: { type: Array, default: [] },
    attendance: { type: Array, default: [] },
    tests: { type: Array, default: [] },
    feePayments: { type: Array, default: [] },
    feeSubmissions: { type: Array, default: [] },
    salaryPayments: { type: Array, default: [] },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.InstituteData || mongoose.model('InstituteData', InstituteDataSchema);
