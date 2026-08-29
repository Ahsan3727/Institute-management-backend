import { uid } from '@/utils/helpers';

// A completely blank dataset — same shape, no demo content.
export function emptyData() {
  return {
    admin: {
      username: 'admin',
      password: 'admin123',
      name: 'Principal',
    },
    teachers: [],
    classes: [],
    subjects: [],
    students: [],
    slos: [],
    dailyLog: [],
    attendance: [],
    tests: [],
    feePayments: [],
    feeSubmissions: [],
    salaryPayments: [],
  };
}

// seedData is identical to emptyData — no demo content
export default function seedData() {
  return emptyData();
}

