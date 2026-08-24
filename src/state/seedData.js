import { uid } from '@/utils/helpers';

function thisMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export default function seedData() {
  const month = thisMonth();
  const today = new Date().toISOString().slice(0, 10);

  return {
    teachers: [
      {
        id: 't1',
        name: 'Mr. Ali',
        phone: '0300-1234567',
        email: 'ali@school.edu.pk',
        qualification: 'M.Sc Mathematics',
        joiningDate: '2022-08-01',
        salary: 45000,
      },
      {
        id: 't2',
        name: 'Mrs. Sara',
        phone: '0301-2345678',
        email: 'sara@school.edu.pk',
        qualification: 'B.Ed English',
        joiningDate: '2021-06-15',
        salary: 42000,
      },
      {
        id: 't3',
        name: 'Mr. Ahmed',
        phone: '0302-3456789',
        email: 'ahmed@school.edu.pk',
        qualification: 'M.Sc Physics',
        joiningDate: '2023-01-10',
        salary: 40000,
      },
    ],
    classes: [
      { id: 'c1', name: 'Class 6' },
      { id: 'c2', name: 'Class 7' },
      { id: 'c3', name: 'Class 8' },
    ],
    subjects: [
      { id: 's1', name: 'Math' },
      { id: 's2', name: 'English' },
      { id: 's3', name: 'Science' },
      { id: 's4', name: 'ICT' },
    ],
    students: [
      {
        id: 'st1',
        name: 'Ahmed Khan',
        classId: 'c1',
        guardianName: 'Tariq Khan',
        guardianPhone: '0333-1112222',
        address: 'Street 4, Faisalabad',
        admissionDate: '2023-04-01',
        tuitionFee: 5000,
      },
      {
        id: 'st2',
        name: 'Sara Ali',
        classId: 'c1',
        guardianName: 'Imran Ali',
        guardianPhone: '0333-2223333',
        address: 'Street 9, Faisalabad',
        admissionDate: '2023-04-01',
        tuitionFee: 5000,
      },
      {
        id: 'st3',
        name: 'Hamza Bilal',
        classId: 'c1',
        guardianName: 'Bilal Ahmed',
        guardianPhone: '0333-3334444',
        address: 'Street 2, Faisalabad',
        admissionDate: '2023-05-12',
        tuitionFee: 5000,
      },
      {
        id: 'st4',
        name: 'Ayesha Malik',
        classId: 'c1',
        guardianName: 'Malik Rashid',
        guardianPhone: '0333-4445555',
        address: 'Street 7, Faisalabad',
        admissionDate: '2023-04-20',
        tuitionFee: 5000,
      },
      {
        id: 'st5',
        name: 'Muhammad Zain',
        classId: 'c1',
        guardianName: 'Waseem Akhtar',
        guardianPhone: '0333-5556666',
        address: 'Street 1, Faisalabad',
        admissionDate: '2023-06-01',
        tuitionFee: 5000,
      },
      {
        id: 'st6',
        name: 'Bilal Tariq',
        classId: 'c2',
        guardianName: 'Tariq Mehmood',
        guardianPhone: '0333-6667777',
        address: 'Street 12, Faisalabad',
        admissionDate: '2022-09-01',
        tuitionFee: 5500,
      },
      {
        id: 'st7',
        name: 'Hania Iqbal',
        classId: 'c2',
        guardianName: 'Iqbal Hussain',
        guardianPhone: '0333-7778888',
        address: 'Street 15, Faisalabad',
        admissionDate: '2022-09-01',
        tuitionFee: 5500,
      },
    ],
    slos: [
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Understand Whole Numbers' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Operations on Whole Numbers' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Fractions and Decimals' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Basic Algebra' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Ratio and Proportion' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Geometry Basics' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Data Handling' },
      { id: uid('slo'), classId: 'c1', subjectId: 's1', term: 'Term 1', text: 'Introduction to Statistics' },
      { id: uid('slo'), classId: 'c1', subjectId: 's4', term: 'Term 1', text: 'Basic of Scratch' },
      { id: uid('slo'), classId: 'c1', subjectId: 's4', term: 'Term 1', text: 'Introduction to Block Coding' },
      { id: uid('slo'), classId: 'c2', subjectId: 's2', term: 'Term 1', text: 'Essay Writing' },
      { id: uid('slo'), classId: 'c2', subjectId: 's2', term: 'Term 1', text: 'Reading Comprehension' },
      { id: uid('slo'), classId: 'c3', subjectId: 's3', term: 'Term 1', text: 'Force and Motion' },
      { id: uid('slo'), classId: 'c3', subjectId: 's3', term: 'Term 1', text: 'Energy and Work' },
    ],
    dailyLog: [], // {id, date, ts, classId, subjectId, type, sloIds:[], teacher}
    attendance: [], // {id, date, classId, studentId, status}
    tests: [], // {id, studentId, subject, date, score, max}

    // Fee payments received from students. One row per payment (a student
    // can have more than one row in the same month for partial payments).
    // Whether a student has "paid" for a given month is derived by summing
    // these — see AppContext's getStudentFeePaid() — not stored as a flag.
    feePayments: [
      { id: uid('fee'), studentId: 'st1', month, amount: 5000, date: today },
      { id: uid('fee'), studentId: 'st2', month, amount: 5000, date: today },
    ],

    // Salary payments made to teachers — same "derive status by summing" idea.
    salaryPayments: [{ id: uid('sal'), teacherId: 't1', month, amount: 45000, date: today }],
  };
}

// A completely blank dataset — same shape as seedData(), no demo content.
// Used by "Clear All Data" so a school can start from a truly empty slate
// and enter their own real classes/subjects/teachers/students/SLOs/finances.
export function emptyData() {
  return {
    teachers: [],
    classes: [],
    subjects: [],
    students: [],
    slos: [],
    dailyLog: [],
    attendance: [],
    tests: [],
    feePayments: [],
    salaryPayments: [],
  };
}
