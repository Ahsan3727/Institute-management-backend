import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────
// Sub-schemas (Phase 3.2).
//
// Scope note: this replaces the previous untyped `{ type: Array, default: [] }`
// fields with real structure — required fields, types, and enums for the
// values the UI actually produces (grep-verified against every screen that
// writes to each array). It stops short of splitting these arrays into
// their own top-level collections (Student, Teacher, Attendance, ...),
// which the remediation plan itself flags as a larger, lower-urgency,
// separately-staged change (Phase 3.2 / 3.1 "longer-term" note) — doing
// that now would also require rewriting the client's whole-document sync
// model in AppContext.jsx and adding a dozen new per-entity endpoints,
// which is a bigger project than this pass. Embedded sub-documents here
// get the validation benefit without that migration.
// ─────────────────────────────────────────────────────────────────────────

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, lowercase: true },
    // bcrypt hash ONLY — never plaintext. See src/lib/passwords.js.
    password: { type: String, required: true },
    name: { type: String, default: 'Principal Admin', trim: true },
    mustChangePassword: { type: Boolean, default: false },
  },
  { _id: false }
);

const TeacherSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // bcrypt hash
    mustChangePassword: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    email: { type: String, default: '', trim: true, lowercase: true },
    qualification: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    salary: { type: Number, default: 0, min: 0 },
    assignedStudentIds: { type: [String], default: [] },
  },
  { _id: false }
);

const StudentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // bcrypt hash
    mustChangePassword: { type: Boolean, default: false },
    classId: { type: String, default: null },
    assignedTeacherId: { type: String, default: null },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    admissionDate: { type: String, default: '' },
    tuitionFee: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ClassSchema = new Schema(
  { id: { type: String, required: true }, name: { type: String, required: true, trim: true } },
  { _id: false }
);

const SubjectSchema = new Schema(
  { id: { type: String, required: true }, name: { type: String, required: true, trim: true } },
  { _id: false }
);

const SloSchema = new Schema(
  {
    id: { type: String, required: true },
    classId: { type: String, required: true },
    subjectId: { type: String, required: true },
    term: { type: String, default: 'Term 1' },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const DailyLogSchema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    ts: { type: Number, default: () => Date.now() },
    classId: { type: String, required: true },
    subjectId: { type: String, required: true },
    type: { type: String, enum: ['Taught', 'Revised'], default: 'Taught' },
    sloIds: { type: [String], default: [] },
    teacher: { type: String, default: '' },
  },
  { _id: false }
);

const AttendanceSchema = new Schema(
  {
    id: { type: String, required: true },
    classId: { type: String, required: true },
    date: { type: String, required: true },
    studentId: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
  },
  { _id: false }
);

const TestSchema = new Schema(
  {
    id: { type: String, required: true },
    studentId: { type: String, required: true },
    subject: { type: String, default: '' },
    date: { type: String, default: '' },
    score: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    examType: { type: String, enum: ['Quiz', 'Class Test', 'Midterm', 'Final'], default: 'Class Test' },
    term: { type: String, default: 'Term 1' },
  },
  { _id: false }
);

const FeePaymentSchema = new Schema(
  {
    id: { type: String, required: true },
    studentId: { type: String, required: true },
    month: { type: String, required: true }, // 'YYYY-MM'
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { _id: false }
);

const SalaryPaymentSchema = new Schema(
  {
    id: { type: String, required: true },
    teacherId: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { _id: false }
);

const FeeSubmissionSchema = new Schema(
  {
    id: { type: String, required: true },
    studentId: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'EasyPaisa', 'JazzCash', 'Cash at Office'],
      default: 'Bank Transfer',
    },
    referenceId: { type: String, default: '' },
    date: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Number, default: () => Date.now() },
    reviewedAt: { type: Number, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { _id: false }
);

const InstituteDataSchema = new Schema(
  {
    // ── Multi-tenancy (Phase 2.1) ──────────────────────────────────────
    // Mongo's own `_id` on this document IS the instituteId — there is no
    // more `identifier: 'primary_institute'` singleton. Sessions carry this
    // id (see src/lib/session.js) and every read/write for institute data
    // is scoped by it (see app/api/data/route.js).
    instituteName: { type: String, default: '' },

    admin: { type: AdminSchema, required: true },
    teachers: { type: [TeacherSchema], default: [] },
    classes: { type: [ClassSchema], default: [] },
    subjects: { type: [SubjectSchema], default: [] },
    students: { type: [StudentSchema], default: [] },
    slos: { type: [SloSchema], default: [] },
    dailyLog: { type: [DailyLogSchema], default: [] },
    attendance: { type: [AttendanceSchema], default: [] },
    tests: { type: [TestSchema], default: [] },
    feePayments: { type: [FeePaymentSchema], default: [] },
    feeSubmissions: { type: [FeeSubmissionSchema], default: [] },
    salaryPayments: { type: [SalaryPaymentSchema], default: [] },

    // ── Optimistic concurrency (Phase 3.1) ─────────────────────────────
    // Bumped on every successful PUT. Clients send back the version they
    // last read; a mismatch means someone else's write landed first.
    version: { type: Number, default: 0 },
  },
  { timestamps: true, minimize: false }
);

InstituteDataSchema.index({ 'admin.username': 1 });
InstituteDataSchema.index({ 'teachers.username': 1 });
InstituteDataSchema.index({ 'students.username': 1 });

export default mongoose.models.InstituteData || mongoose.model('InstituteData', InstituteDataSchema);
