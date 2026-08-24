import * as XLSX from 'xlsx';

function downloadWorkbook(workbook, fileName) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

// ── File Parser ─────────────────────────────────────────────────────────────
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// ── Sample Templates ────────────────────────────────────────────────────────
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'Student Name *': 'Zeeshan Tariq',
      'Class *': 'Class 6',
      'Username': 'zeeshan_tariq',
      'Password': 'password123',
      'Guardian Name': 'Tariq Mehmood',
      'Guardian Phone': '0300-1122334',
      'Address': 'House 12, Street 4, Faisalabad',
      'Admission Date': '2024-01-15',
      'Monthly Tuition Fee': 6000,
      'Assigned Teacher': 'Mr. Ali',
    },
    {
      'Student Name *': 'Amina Farooq',
      'Class *': 'Class 6',
      'Username': 'amina_farooq',
      'Password': 'password123',
      'Guardian Name': 'Farooq Azam',
      'Guardian Phone': '0300-5566778',
      'Address': 'Model Town, Faisalabad',
      'Admission Date': '2024-02-01',
      'Monthly Tuition Fee': 5500,
      'Assigned Teacher': 'Mr. Ali',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  // Column widths
  ws['!cols'] = [
    { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
    { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
  downloadWorkbook(wb, 'Student_Import_Template.xlsx');
}

export function downloadSloTemplate() {
  const sampleData = [
    { 'Class *': 'Class 6', 'Subject *': 'Math', 'Term *': 'Term 1', 'SLO Description *': 'Identify Prime and Composite Numbers' },
    { 'Class *': 'Class 6', 'Subject *': 'Math', 'Term *': 'Term 1', 'SLO Description *': 'Find HCF and LCM by Factorization' },
    { 'Class *': 'Class 6', 'Subject *': 'Science', 'Term *': 'Term 1', 'SLO Description *': 'Understand Cellular Organization in Plants and Animals' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Syllabus_Template');
  downloadWorkbook(wb, 'Syllabus_SLO_Template.xlsx');
}

// ── Export Generators ───────────────────────────────────────────────────────
export function exportStudentDirectory(students, classes, teachers) {
  const rows = students.map((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    const teacher = teachers.find((t) => t.id === s.assignedTeacherId);
    return {
      'Sr #': idx + 1,
      'Student Name': s.name,
      'Class': cls ? cls.name : '—',
      'Username': s.username || '',
      'Guardian Name': s.guardianName || '',
      'Guardian Contact': s.guardianPhone || '',
      'Address': s.address || '',
      'Admission Date': s.admissionDate || '',
      'Monthly Tuition Fee (Rs)': s.tuitionFee || 0,
      'Assigned Teacher': teacher ? teacher.name : 'Unassigned',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 26 }, { wch: 14 }, { wch: 22 }, { wch: 18 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student Directory');
  const today = new Date().toISOString().slice(0, 10);
  downloadWorkbook(wb, `Student_Directory_${today}.xlsx`);
}

export function exportFeeLedger(feeRows, classes, month) {
  const rows = feeRows.map((r, idx) => {
    const cls = classes.find((c) => c.id === r.student.classId);
    return {
      'Sr #': idx + 1,
      'Student Name': r.student.name,
      'Class': cls ? cls.name : '—',
      'Guardian Phone': r.student.guardianPhone || '',
      'Month': month,
      'Monthly Fee (Rs)': r.fee,
      'Amount Paid (Rs)': r.paid,
      'Balance (Rs)': Math.max(0, r.fee - r.paid),
      'Status': r.status.toUpperCase(),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Fees_${month}`);
  downloadWorkbook(wb, `Fee_Ledger_${month}.xlsx`);
}

export function exportAttendanceSheet(students, classes, attendanceRecords, month) {
  const year = parseInt(month.slice(0, 4), 10);
  const mIndex = parseInt(month.slice(5, 7), 10) - 1;
  const daysInMonth = new Date(year, mIndex + 1, 0).getDate();

  const rows = students.map((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    const studentAtt = attendanceRecords.filter((a) => a.studentId === s.id && a.date.startsWith(month));
    const presentCount = studentAtt.filter((a) => a.status === 'present').length;
    const absentCount = studentAtt.filter((a) => a.status === 'absent').length;
    const totalMarked = studentAtt.length;
    const pct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

    const rowObj = {
      'Sr #': idx + 1,
      'Student Name': s.name,
      'Class': cls ? cls.name : '—',
    };

    // Fill days 1 to 31
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const iso = `${month}-${dayStr}`;
      const record = studentAtt.find((a) => a.date === iso);
      rowObj[`D${day}`] = record ? (record.status === 'present' ? 'P' : 'A') : '—';
    }

    rowObj['Total Present'] = presentCount;
    rowObj['Total Absent'] = absentCount;
    rowObj['Attendance %'] = `${pct}%`;

    return rowObj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Att_${month}`);
  downloadWorkbook(wb, `Attendance_Register_${month}.xlsx`);
}

export function exportMarksSheet(tests, students, classes, subjects, term) {
  const rows = tests
    .filter((t) => !term || t.term === term)
    .map((t, idx) => {
      const st = students.find((s) => s.id === t.studentId);
      const cls = st ? classes.find((c) => c.id === st.classId) : null;
      const pct = t.max > 0 ? Math.round((t.score / t.max) * 100) : 0;
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
      return {
        'Sr #': idx + 1,
        'Student Name': st ? st.name : '—',
        'Class': cls ? cls.name : '—',
        'Subject': t.subject,
        'Exam Type': t.examType || 'Class Test',
        'Term': t.term || 'Term 1',
        'Exam Date': t.date,
        'Marks Obtained': t.score,
        'Total Marks': t.max,
        'Percentage': `${pct}%`,
        'Grade': grade,
      };
    });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Marks_${term || 'All'}`);
  downloadWorkbook(wb, `Exam_Marks_${term || 'All'}.xlsx`);
}
