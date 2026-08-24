'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import seedData, { emptyData } from './seedData';
import { readJSON, writeJSON, removeKey, STORAGE_KEY, SESSION_KEY } from './storage';
import { uid, todayISO, fmtDate, timeAgo } from '@/utils/helpers';

const AppContext = createContext(null);

const EMPTY_SESSION = { role: null, name: null, studentId: null };

// Backfills fields/arrays that older saved data (from before finance
// tracking existed) won't have yet, so upgrading never crashes on load.
function normalizeData(d) {
  if (!d) return d;
  return {
    ...d,
    teachers: (d.teachers || []).map((t) => ({
      phone: '',
      email: '',
      qualification: '',
      joiningDate: '',
      salary: 0,
      ...t,
    })),
    students: (d.students || []).map((s) => ({
      guardianName: '',
      guardianPhone: '',
      address: '',
      admissionDate: '',
      tuitionFee: 0,
      ...s,
    })),
    feePayments: d.feePayments || [],
    salaryPayments: d.salaryPayments || [],
  };
}

export function AppProvider({ children }) {
  const [data, setData] = useState(null); // null until loaded
  const [session, setSession] = useState(EMPTY_SESSION);
  const [ready, setReady] = useState(false);
  const loadedOnce = useRef(false);

  // ---- load on mount (client only) ----
  useEffect(() => {
    const storedData = readJSON(STORAGE_KEY);
    const storedSession = readJSON(SESSION_KEY);
    setData(storedData ? normalizeData(storedData) : seedData());
    if (storedSession) setSession(storedSession);
    loadedOnce.current = true;
    setReady(true);
  }, []);

  // ---- persist on change ----
  useEffect(() => {
    if (!loadedOnce.current || !data) return;
    writeJSON(STORAGE_KEY, data);
  }, [data]);

  useEffect(() => {
    if (!loadedOnce.current) return;
    if (session.role) writeJSON(SESSION_KEY, session);
  }, [session]);

  // =========================================================
  // AUTH / SESSION
  // =========================================================
  const login = useCallback((role, name, studentId) => {
    setSession({ role, name, studentId: studentId || null });
  }, []);

  const logout = useCallback(() => {
    removeKey(SESSION_KEY);
    setSession(EMPTY_SESSION);
  }, []);

  const switchChild = useCallback((studentId) => {
    setSession((s) => ({ ...s, studentId }));
  }, []);

  // =========================================================
  // GENERIC LOOKUPS
  // =========================================================
  const nameExists = useCallback(
    (list, name, excludeId) => list.some((x) => x.name.toLowerCase() === name.trim().toLowerCase() && x.id !== excludeId),
    []
  );

  // =========================================================
  // CLASSES / SUBJECTS / STUDENTS / TEACHERS (Setup)
  // =========================================================
  const addClass = useCallback((name) => {
    setData((d) => ({ ...d, classes: [...d.classes, { id: uid('c'), name }] }));
  }, []);

  const addSubject = useCallback((name) => {
    setData((d) => ({ ...d, subjects: [...d.subjects, { id: uid('sub'), name }] }));
  }, []);

  const addStudent = useCallback((details) => {
    setData((d) => ({
      ...d,
      students: [
        ...d.students,
        {
          id: uid('st'),
          name: details.name,
          classId: details.classId,
          guardianName: details.guardianName || '',
          guardianPhone: details.guardianPhone || '',
          address: details.address || '',
          admissionDate: details.admissionDate || todayISO(),
          tuitionFee: Number(details.tuitionFee) || 0,
        },
      ],
    }));
  }, []);

  const addTeacher = useCallback((details) => {
    setData((d) => ({
      ...d,
      teachers: [
        ...d.teachers,
        {
          id: uid('t'),
          name: details.name,
          phone: details.phone || '',
          email: details.email || '',
          qualification: details.qualification || '',
          joiningDate: details.joiningDate || todayISO(),
          salary: Number(details.salary) || 0,
        },
      ],
    }));
  }, []);

  const editClass = useCallback((classId, name) => {
    setData((d) => ({ ...d, classes: d.classes.map((c) => (c.id === classId ? { ...c, name } : c)) }));
  }, []);

  const editSubject = useCallback((subjectId, name) => {
    setData((d) => ({ ...d, subjects: d.subjects.map((s) => (s.id === subjectId ? { ...s, name } : s)) }));
  }, []);

  const editTeacher = useCallback((teacherId, updates) => {
    setData((d) => {
      const old = d.teachers.find((t) => t.id === teacherId);
      const nextUpdates = 'salary' in updates ? { ...updates, salary: Number(updates.salary) || 0 } : updates;
      const renamedTeachers = d.teachers.map((t) => (t.id === teacherId ? { ...t, ...nextUpdates } : t));
      // Keep past activity-log attribution in sync if the teacher's name changed.
      const nameChanged = old && nextUpdates.name && old.name !== nextUpdates.name;
      const dailyLog = nameChanged ? d.dailyLog.map((l) => (l.teacher === old.name ? { ...l, teacher: nextUpdates.name } : l)) : d.dailyLog;
      return { ...d, teachers: renamedTeachers, dailyLog };
    });
  }, []);

  const editStudent = useCallback((studentId, updates) => {
    const nextUpdates = 'tuitionFee' in updates ? { ...updates, tuitionFee: Number(updates.tuitionFee) || 0 } : updates;
    setData((d) => ({ ...d, students: d.students.map((s) => (s.id === studentId ? { ...s, ...nextUpdates } : s)) }));
  }, []);

  const classDependentCounts = useCallback(
    (classId) => ({
      students: data.students.filter((s) => s.classId === classId).length,
      slos: data.slos.filter((s) => s.classId === classId).length,
      logs: data.dailyLog.filter((l) => l.classId === classId).length,
      attendance: data.attendance.filter((a) => a.classId === classId).length,
    }),
    [data]
  );

  const deleteClass = useCallback((classId) => {
    setData((d) => {
      const studentIds = d.students.filter((s) => s.classId === classId).map((s) => s.id);
      return {
        ...d,
        students: d.students.filter((s) => s.classId !== classId),
        slos: d.slos.filter((s) => s.classId !== classId),
        dailyLog: d.dailyLog.filter((l) => l.classId !== classId),
        attendance: d.attendance.filter((a) => a.classId !== classId),
        tests: d.tests.filter((t) => !studentIds.includes(t.studentId)),
        classes: d.classes.filter((c) => c.id !== classId),
      };
    });
  }, []);

  const subjectDependentCounts = useCallback(
    (subjectId) => ({
      slos: data.slos.filter((s) => s.subjectId === subjectId).length,
      logs: data.dailyLog.filter((l) => l.subjectId === subjectId).length,
    }),
    [data]
  );

  const deleteSubject = useCallback((subjectId) => {
    setData((d) => ({
      ...d,
      slos: d.slos.filter((s) => s.subjectId !== subjectId),
      dailyLog: d.dailyLog.filter((l) => l.subjectId !== subjectId),
      subjects: d.subjects.filter((s) => s.id !== subjectId),
    }));
  }, []);

  const studentDependentCounts = useCallback(
    (studentId) => ({
      attendance: data.attendance.filter((a) => a.studentId === studentId).length,
      tests: data.tests.filter((t) => t.studentId === studentId).length,
      feePayments: data.feePayments.filter((f) => f.studentId === studentId).length,
    }),
    [data]
  );

  const deleteStudent = useCallback((studentId) => {
    setData((d) => ({
      ...d,
      attendance: d.attendance.filter((a) => a.studentId !== studentId),
      tests: d.tests.filter((t) => t.studentId !== studentId),
      feePayments: d.feePayments.filter((f) => f.studentId !== studentId),
      students: d.students.filter((s) => s.id !== studentId),
    }));
  }, []);

  const deleteTeacher = useCallback((teacherId) => {
    setData((d) => ({
      ...d,
      teachers: d.teachers.filter((t) => t.id !== teacherId),
      salaryPayments: d.salaryPayments.filter((p) => p.teacherId !== teacherId),
    }));
  }, []);

  // =========================================================
  // SLOs
  // =========================================================
  const addSlosFromLines = useCallback((classId, subjectId, term, linesText) => {
    const lines = linesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return 0;
    setData((d) => ({
      ...d,
      slos: [...d.slos, ...lines.map((text) => ({ id: uid('slo'), classId, subjectId, term, text }))],
    }));
    return lines.length;
  }, []);

  const deleteSlo = useCallback((sloId) => {
    setData((d) => ({ ...d, slos: d.slos.filter((s) => s.id !== sloId) }));
  }, []);

  const editSlo = useCallback((sloId, text) => {
    setData((d) => ({ ...d, slos: d.slos.map((s) => (s.id === sloId ? { ...s, text } : s)) }));
  }, []);

  const slosCoveredSet = useCallback(() => {
    const set = new Set();
    data.dailyLog.forEach((l) => l.sloIds.forEach((id) => set.add(id)));
    return set;
  }, [data]);

  const addDailyLog = useCallback((classId, subjectId, date, type, sloIds, teacherName) => {
    setData((d) => ({
      ...d,
      dailyLog: [...d.dailyLog, { id: uid('log'), date, ts: Date.now(), classId, subjectId, type, sloIds, teacher: teacherName }],
    }));
  }, []);

  // =========================================================
  // ATTENDANCE
  // =========================================================
  const saveAttendanceBulk = useCallback((classId, date, records) => {
    setData((d) => {
      const attendance = [...d.attendance];
      records.forEach(({ studentId, status }) => {
        const idx = attendance.findIndex((a) => a.classId === classId && a.date === date && a.studentId === studentId);
        if (idx >= 0) attendance[idx] = { ...attendance[idx], status };
        else attendance.push({ id: uid('att'), classId, date, studentId, status });
      });
      return { ...d, attendance };
    });
  }, []);

  // =========================================================
  // TESTS
  // =========================================================
  const addTest = useCallback((studentId, subjectName, score, max, date) => {
    setData((d) => ({ ...d, tests: [...d.tests, { id: uid('test'), studentId, subject: subjectName, date, score, max }] }));
  }, []);

  // =========================================================
  // FINANCE — tuition fees & teacher salaries
  // =========================================================
  // Payments are stored as individual rows (one per payment made), never as
  // a paid/unpaid flag — this naturally supports partial payments and gives
  // a real payment history. "Status" for a given month is always derived by
  // summing the rows for that student/teacher + month.
  const recordFeePayment = useCallback((studentId, month, amount, date) => {
    setData((d) => ({
      ...d,
      feePayments: [...d.feePayments, { id: uid('fee'), studentId, month, amount: Number(amount) || 0, date: date || todayISO() }],
    }));
  }, []);

  const clearFeePaymentsForMonth = useCallback((studentId, month) => {
    setData((d) => ({ ...d, feePayments: d.feePayments.filter((f) => !(f.studentId === studentId && f.month === month)) }));
  }, []);

  const recordSalaryPayment = useCallback((teacherId, month, amount, date) => {
    setData((d) => ({
      ...d,
      salaryPayments: [...d.salaryPayments, { id: uid('sal'), teacherId, month, amount: Number(amount) || 0, date: date || todayISO() }],
    }));
  }, []);

  const clearSalaryPaymentsForMonth = useCallback((teacherId, month) => {
    setData((d) => ({ ...d, salaryPayments: d.salaryPayments.filter((p) => !(p.teacherId === teacherId && p.month === month)) }));
  }, []);

  const getStudentFeePaid = useCallback(
    (studentId, month) =>
      data.feePayments.filter((f) => f.studentId === studentId && f.month === month).reduce((sum, f) => sum + f.amount, 0),
    [data]
  );

  const getTeacherSalaryPaid = useCallback(
    (teacherId, month) =>
      data.salaryPayments.filter((p) => p.teacherId === teacherId && p.month === month).reduce((sum, p) => sum + p.amount, 0),
    [data]
  );

  // Per-student fee rows for a given month, with a derived status —
  // 'paid' | 'partial' | 'pending' | 'n/a' (no fee set for that student).
  const getFeeRows = useCallback(
    (month) =>
      data.students.map((s) => {
        const fee = s.tuitionFee || 0;
        const paid = getStudentFeePaid(s.id, month);
        let status = 'pending';
        if (fee === 0) status = 'n/a';
        else if (paid >= fee) status = 'paid';
        else if (paid > 0) status = 'partial';
        return { student: s, fee, paid, status };
      }),
    [data, getStudentFeePaid]
  );

  // Per-teacher salary rows for a given month, same status logic.
  const getSalaryRows = useCallback(
    (month) =>
      data.teachers.map((t) => {
        const salary = t.salary || 0;
        const paid = getTeacherSalaryPaid(t.id, month);
        let status = 'pending';
        if (salary === 0) status = 'n/a';
        else if (paid >= salary) status = 'paid';
        else if (paid > 0) status = 'partial';
        return { teacher: t, salary, paid, status };
      }),
    [data, getTeacherSalaryPaid]
  );

  const getFinanceSummary = useCallback(
    (month) => {
      const expectedIncome = data.students.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);
      const collectedIncome = data.students.reduce((sum, s) => sum + getStudentFeePaid(s.id, month), 0);
      const expectedPayroll = data.teachers.reduce((sum, t) => sum + (t.salary || 0), 0);
      const paidPayroll = data.teachers.reduce((sum, t) => sum + getTeacherSalaryPaid(t.id, month), 0);
      return {
        expectedIncome,
        collectedIncome,
        pendingIncome: Math.max(0, expectedIncome - collectedIncome),
        expectedPayroll,
        paidPayroll,
        pendingPayroll: Math.max(0, expectedPayroll - paidPayroll),
        netBalance: collectedIncome - paidPayroll,
      };
    },
    [data, getStudentFeePaid, getTeacherSalaryPaid]
  );

  const buildFinanceSummaryText = useCallback(
    (month) => {
      const s = getFinanceSummary(month);
      const label = new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      return (
        `SLO Tracker — Finance Summary\n${label}\n\n` +
        `Tuition income expected: Rs ${s.expectedIncome.toLocaleString()}\n` +
        `Tuition income collected: Rs ${s.collectedIncome.toLocaleString()}\n` +
        `Tuition income pending: Rs ${s.pendingIncome.toLocaleString()}\n\n` +
        `Payroll expected: Rs ${s.expectedPayroll.toLocaleString()}\n` +
        `Payroll paid: Rs ${s.paidPayroll.toLocaleString()}\n` +
        `Payroll pending (to pay teachers): Rs ${s.pendingPayroll.toLocaleString()}\n\n` +
        `Net balance (collected − paid payroll): Rs ${s.netBalance.toLocaleString()}`
      );
    },
    [getFinanceSummary]
  );

  // =========================================================
  // COMPUTED / ANALYTICS
  // =========================================================
  const last7DaysCounts = useCallback(
    (filterFn) => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
        const set = new Set();
        data.dailyLog
          .filter((l) => l.date === iso && filterFn(l))
          .forEach((l) => l.sloIds.forEach((id) => set.add(id)));
        days.push({ label, value: set.size });
      }
      return days;
    },
    [data]
  );

  const computeMissedSlos = useCallback(
    (studentId) => {
      const student = data.students.find((s) => s.id === studentId);
      if (!student) return [];
      const logs = data.dailyLog.filter((l) => l.classId === student.classId);
      const coveredWhilePresent = new Set();
      const candidates = new Map();
      logs.forEach((log) => {
        const att = data.attendance.find((a) => a.studentId === studentId && a.date === log.date && a.classId === student.classId);
        const absent = att && att.status === 'absent';
        log.sloIds.forEach((id) => {
          if (absent) {
            if (!candidates.has(id)) candidates.set(id, { date: log.date, type: log.type, subjectId: log.subjectId });
          } else coveredWhilePresent.add(id);
        });
      });
      const out = [];
      candidates.forEach((info, id) => {
        if (!coveredWhilePresent.has(id)) {
          const slo = data.slos.find((s) => s.id === id);
          if (slo) out.push({ slo, ...info });
        }
      });
      out.sort((a, b) => b.date.localeCompare(a.date));
      return out;
    },
    [data]
  );

  const getNotifications = useCallback(() => {
    if (!data || !session.role) return [];
    const items = [];
    const today = todayISO();
    if (session.role === 'teacher') {
      data.attendance
        .filter((a) => a.date === today && a.status === 'absent')
        .forEach((a) => {
          const st = data.students.find((s) => s.id === a.studentId);
          if (st) items.push({ icon: 'alert', title: `${st.name} marked absent today`, sub: fmtDate(today) });
        });
    } else if (session.role === 'parent') {
      computeMissedSlos(session.studentId)
        .slice(0, 5)
        .forEach((m) => {
          const subj = data.subjects.find((s) => s.id === m.subjectId);
          items.push({ icon: 'alert', title: `Missed: ${m.slo.text}`, sub: `${subj ? subj.name : ''} · ${fmtDate(m.date)}` });
        });
    } else if (session.role === 'admin') {
      [...data.dailyLog]
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 5)
        .forEach((l) => {
          const cls = data.classes.find((c) => c.id === l.classId);
          items.push({
            icon: 'book',
            title: `${l.teacher || 'A teacher'} logged ${l.type.toLowerCase()} activity`,
            sub: `${cls ? cls.name : ''} · ${timeAgo(l.ts || Date.now())}`,
          });
        });
    }
    return items;
  }, [data, session, computeMissedSlos]);

  // =========================================================
  // BACKUP / RESET
  // =========================================================
  const exportSnapshot = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const restoreSnapshot = useCallback((json) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.classes || !parsed.students || !parsed.slos) return false;
      setData(parsed);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const resetDemoData = useCallback(() => {
    setData(seedData());
  }, []);

  const clearAllData = useCallback(() => {
    setData(emptyData());
  }, []);

  const buildProgressReportText = useCallback(() => {
    const covered = slosCoveredSet();
    const lines = data.classes.map((c) => {
      const clsSlos = data.slos.filter((s) => s.classId === c.id);
      const done = clsSlos.filter((s) => covered.has(s.id)).length;
      const pct = clsSlos.length ? Math.round((done / clsSlos.length) * 100) : 0;
      const studentCount = data.students.filter((s) => s.classId === c.id).length;
      const att = data.attendance.filter((a) => a.classId === c.id);
      const present = att.filter((a) => a.status === 'present').length;
      const attPct = att.length ? Math.round((present / att.length) * 100) : 100;
      return `${c.name} — ${studentCount} students · SLOs ${done}/${clsSlos.length} (${pct}%) · Attendance ${attPct}%`;
    });
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    return `SLO Progress Report\nGenerated ${today} · ${session.name || ''} (${session.role || ''})\n\n${lines.join('\n') || 'No data yet.'}`;
  }, [data, session, slosCoveredSet]);

  const value = useMemo(
    () => ({
      ready,
      data,
      session,
      login,
      logout,
      switchChild,
      nameExists,
      addClass,
      addSubject,
      addStudent,
      addTeacher,
      editClass,
      editSubject,
      editTeacher,
      editStudent,
      classDependentCounts,
      deleteClass,
      subjectDependentCounts,
      deleteSubject,
      studentDependentCounts,
      deleteStudent,
      deleteTeacher,
      addSlosFromLines,
      deleteSlo,
      editSlo,
      slosCoveredSet,
      addDailyLog,
      saveAttendanceBulk,
      addTest,
      recordFeePayment,
      clearFeePaymentsForMonth,
      recordSalaryPayment,
      clearSalaryPaymentsForMonth,
      getStudentFeePaid,
      getTeacherSalaryPaid,
      getFeeRows,
      getSalaryRows,
      getFinanceSummary,
      buildFinanceSummaryText,
      last7DaysCounts,
      computeMissedSlos,
      getNotifications,
      exportSnapshot,
      restoreSnapshot,
      resetDemoData,
      clearAllData,
      buildProgressReportText,
    }),
    [
      ready,
      data,
      session,
      login,
      logout,
      switchChild,
      nameExists,
      addClass,
      addSubject,
      addStudent,
      addTeacher,
      editClass,
      editSubject,
      editTeacher,
      editStudent,
      classDependentCounts,
      deleteClass,
      subjectDependentCounts,
      deleteSubject,
      studentDependentCounts,
      deleteStudent,
      deleteTeacher,
      addSlosFromLines,
      deleteSlo,
      editSlo,
      slosCoveredSet,
      addDailyLog,
      saveAttendanceBulk,
      addTest,
      recordFeePayment,
      clearFeePaymentsForMonth,
      recordSalaryPayment,
      clearSalaryPaymentsForMonth,
      getStudentFeePaid,
      getTeacherSalaryPaid,
      getFeeRows,
      getSalaryRows,
      getFinanceSummary,
      buildFinanceSummaryText,
      last7DaysCounts,
      computeMissedSlos,
      getNotifications,
      exportSnapshot,
      restoreSnapshot,
      resetDemoData,
      clearAllData,
      buildProgressReportText,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
