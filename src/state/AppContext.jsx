'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import seedData, { emptyData } from './seedData';
import { readJSON, writeJSON, removeKey, STORAGE_KEY, SESSION_KEY } from './storage';
import { uid, todayISO, fmtDate, timeAgo } from '@/utils/helpers';

const AppContext = createContext(null);

const EMPTY_SESSION = { role: null, name: null, studentId: null, teacherId: null, username: null };

// Backfills fields/arrays that older saved data won't have yet,
// so upgrading never crashes on load.
function normalizeData(d) {
  if (!d) return d;
  const admin = d.admin || { username: 'admin', password: 'admin123', name: 'Principal Admin' };
  return {
    ...d,
    admin,
    teachers: (d.teachers || []).map((t) => ({
      username: t.username || t.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `teacher_${t.id}`,
      password: t.password || 'password123',
      phone: '',
      email: '',
      qualification: '',
      joiningDate: '',
      salary: 0,
      assignedStudentIds: t.assignedStudentIds || [],
      ...t,
    })),
    students: (d.students || []).map((s) => ({
      username: s.username || s.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || `student_${s.id}`,
      password: s.password || 'password123',
      assignedTeacherId: s.assignedTeacherId || null,
      guardianName: '',
      guardianPhone: '',
      address: '',
      admissionDate: '',
      tuitionFee: 0,
      ...s,
    })),
    tests: (d.tests || []).map((t) => ({
      examType: 'Class Test',
      term: 'Term 1',
      ...t,
    })),
    feePayments: d.feePayments || [],
    feeSubmissions: d.feeSubmissions || [],
    salaryPayments: d.salaryPayments || [],
  };
}

export function AppProvider({ children }) {
  const [data, setData] = useState(null); // null until loaded
  const [session, setSession] = useState(EMPTY_SESSION);
  const [ready, setReady] = useState(false);
  const [dbStatus, setDbStatus] = useState('syncing'); // 'connected' | 'syncing' | 'offline'
  const loadedOnce = useRef(false);
  const syncTimerRef = useRef(null);

  // ---- load on mount (client only) ----
  useEffect(() => {
    const storedData = readJSON(STORAGE_KEY);
    const storedSession = readJSON(SESSION_KEY);
    if (storedData) setData(normalizeData(storedData));
    if (storedSession) setSession(storedSession);
    loadedOnce.current = true;
    setReady(true);

    // Fetch live MongoDB state
    fetch('/api/data')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          const normalized = normalizeData(res.data);
          setData(normalized);
          writeJSON(STORAGE_KEY, normalized);
          setDbStatus('connected');
        } else {
          setDbStatus('offline');
        }
      })
      .catch((err) => {
        console.warn('MongoDB sync fallback to local storage:', err);
        setDbStatus('offline');
      });
  }, []);

  // ---- persist on change + background sync to MongoDB ----
  useEffect(() => {
    if (!loadedOnce.current || !data) return;
    writeJSON(STORAGE_KEY, data);

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
        .then((r) => r.json())
        .then((r) => {
          if (r.ok) setDbStatus('connected');
        })
        .catch(() => setDbStatus('offline'));
    }, 800);
  }, [data]);

  useEffect(() => {
    if (!loadedOnce.current) return;
    if (session.role) writeJSON(SESSION_KEY, session);
  }, [session]);

  // =========================================================
  // AUTH / SESSION
  // =========================================================
  const login = useCallback((role, name, studentId, teacherId, username) => {
    setSession({
      role,
      name,
      studentId: studentId || null,
      teacherId: teacherId || null,
      username: username || null,
    });
  }, []);

  const authenticateUser = useCallback((role, identifier, password) => {
    if (!data) return { success: false, error: 'App data not loaded yet.' };
    const idClean = identifier.trim().toLowerCase();
    const passClean = password.trim();

    if (role === 'admin') {
      const adminObj = data.admin || { username: 'admin', password: 'admin123', name: 'Principal Admin' };
      if (
        (adminObj.username.toLowerCase() === idClean || 'admin' === idClean) &&
        adminObj.password === passClean
      ) {
        login('admin', adminObj.name || 'Principal Admin', null, null, adminObj.username);
        return { success: true };
      }
      return { success: false, error: 'Invalid admin username or password.' };
    }

    if (role === 'teacher') {
      const teacher = data.teachers.find(
        (t) => (t.username && t.username.toLowerCase() === idClean) ||
               (t.name && t.name.toLowerCase() === idClean) ||
               (t.email && t.email.toLowerCase() === idClean)
      );
      if (!teacher) {
        return { success: false, error: 'No teacher found with this username or name.' };
      }
      if (teacher.password && teacher.password !== passClean) {
        return { success: false, error: 'Incorrect teacher password.' };
      }
      login('teacher', teacher.name, null, teacher.id, teacher.username);
      return { success: true };
    }

    if (role === 'parent') {
      const student = data.students.find(
        (s) => (s.username && s.username.toLowerCase() === idClean) ||
               (s.name && s.name.toLowerCase() === idClean) ||
               (s.guardianPhone && s.guardianPhone.replace(/\D/g, '') === idClean.replace(/\D/g, ''))
      );
      if (!student) {
        return { success: false, error: 'No student found with this username, name, or phone.' };
      }
      if (student.password && student.password !== passClean) {
        return { success: false, error: 'Incorrect student/parent password.' };
      }
      login('parent', student.name, student.id, null, student.username);
      return { success: true };
    }

    return { success: false, error: 'Invalid role selected.' };
  }, [data, login]);

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

  const usernameExists = useCallback(
    (username, excludeId) => {
      if (!username || !data) return false;
      const u = username.trim().toLowerCase();
      if (data.admin && data.admin.username && data.admin.username.toLowerCase() === u) return true;
      const inTeachers = data.teachers.some((t) => t.username && t.username.toLowerCase() === u && t.id !== excludeId);
      const inStudents = data.students.some((s) => s.username && s.username.toLowerCase() === u && s.id !== excludeId);
      return inTeachers || inStudents;
    },
    [data]
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
    const newStudentId = uid('st');
    const assignedTeacherId = details.assignedTeacherId || null;
    const defaultUsername = details.username?.trim() || details.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const defaultPassword = details.password?.trim() || 'password123';

    setData((d) => {
      const newStudent = {
        id: newStudentId,
        name: details.name,
        username: defaultUsername,
        password: defaultPassword,
        classId: details.classId,
        assignedTeacherId,
        guardianName: details.guardianName || '',
        guardianPhone: details.guardianPhone || '',
        address: details.address || '',
        admissionDate: details.admissionDate || todayISO(),
        tuitionFee: Number(details.tuitionFee) || 0,
      };

      const updatedTeachers = assignedTeacherId
        ? d.teachers.map((t) =>
            t.id === assignedTeacherId
              ? { ...t, assignedStudentIds: Array.from(new Set([...(t.assignedStudentIds || []), newStudentId])) }
              : t
          )
        : d.teachers;

      return {
        ...d,
        students: [...d.students, newStudent],
        teachers: updatedTeachers,
      };
    });
  }, []);

  const bulkAddStudents = useCallback((studentsList) => {
    setData((d) => {
      let updatedClasses = [...d.classes];
      let updatedTeachers = [...d.teachers];
      const newStudents = [];

      studentsList.forEach((st) => {
        let classId = st.classId;
        if (!classId && st.className) {
          let existingCls = updatedClasses.find((c) => c.name.toLowerCase() === st.className.toLowerCase());
          if (!existingCls) {
            existingCls = { id: uid('cls'), name: st.className };
            updatedClasses.push(existingCls);
          }
          classId = existingCls.id;
        }

        const studentId = uid('st');
        let teacherId = st.assignedTeacherId;
        if (st.teacherName && !teacherId) {
          const t = updatedTeachers.find((x) => x.name.toLowerCase() === st.teacherName.toLowerCase());
          if (t) teacherId = t.id;
        }

        if (teacherId) {
          updatedTeachers = updatedTeachers.map((t) =>
            t.id === teacherId
              ? { ...t, assignedStudentIds: Array.from(new Set([...(t.assignedStudentIds || []), studentId])) }
              : t
          );
        }

        newStudents.push({
          id: studentId,
          name: st.name,
          username: st.username || st.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          password: st.password || 'password123',
          classId: classId || (updatedClasses[0]?.id || 'c1'),
          assignedTeacherId: teacherId || null,
          guardianName: st.guardianName || '',
          guardianPhone: st.guardianPhone || '',
          address: st.address || '',
          admissionDate: st.admissionDate || todayISO(),
          tuitionFee: Number(st.tuitionFee) || 0,
        });
      });

      return {
        ...d,
        classes: updatedClasses,
        teachers: updatedTeachers,
        students: [...d.students, ...newStudents],
      };
    });
  }, []);

  const addTeacher = useCallback((details) => {
    const newTeacherId = uid('t');
    const assignedStudentIds = details.assignedStudentIds || [];
    const defaultUsername = details.username?.trim() || details.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultPassword = details.password?.trim() || 'password123';

    setData((d) => {
      const newTeacher = {
        id: newTeacherId,
        name: details.name,
        username: defaultUsername,
        password: defaultPassword,
        phone: details.phone || '',
        email: details.email || '',
        qualification: details.qualification || '',
        joiningDate: details.joiningDate || todayISO(),
        salary: Number(details.salary) || 0,
        assignedStudentIds,
      };

      const updatedStudents = assignedStudentIds.length
        ? d.students.map((s) => (assignedStudentIds.includes(s.id) ? { ...s, assignedTeacherId: newTeacherId } : s))
        : d.students;

      return {
        ...d,
        teachers: [...d.teachers, newTeacher],
        students: updatedStudents,
      };
    });
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
      const nameChanged = old && nextUpdates.name && old.name !== nextUpdates.name;
      const dailyLog = nameChanged ? d.dailyLog.map((l) => (l.teacher === old.name ? { ...l, teacher: nextUpdates.name } : l)) : d.dailyLog;

      let students = d.students;
      if (nextUpdates.assignedStudentIds) {
        const assignedSet = new Set(nextUpdates.assignedStudentIds);
        students = students.map((s) => {
          if (assignedSet.has(s.id)) return { ...s, assignedTeacherId: teacherId };
          if (s.assignedTeacherId === teacherId) return { ...s, assignedTeacherId: null };
          return s;
        });
      }

      return { ...d, teachers: renamedTeachers, dailyLog, students };
    });
  }, []);

  const editStudent = useCallback((studentId, updates) => {
    const nextUpdates = 'tuitionFee' in updates ? { ...updates, tuitionFee: Number(updates.tuitionFee) || 0 } : updates;

    setData((d) => {
      const oldStudent = d.students.find((s) => s.id === studentId);
      const newAssignedTeacherId = 'assignedTeacherId' in nextUpdates ? nextUpdates.assignedTeacherId : oldStudent?.assignedTeacherId;

      let teachers = d.teachers;
      if (oldStudent && oldStudent.assignedTeacherId !== newAssignedTeacherId) {
        teachers = teachers.map((t) => {
          if (t.id === oldStudent.assignedTeacherId) {
            return { ...t, assignedStudentIds: (t.assignedStudentIds || []).filter((id) => id !== studentId) };
          }
          if (t.id === newAssignedTeacherId) {
            return { ...t, assignedStudentIds: Array.from(new Set([...(t.assignedStudentIds || []), studentId])) };
          }
          return t;
        });
      }

      return {
        ...d,
        students: d.students.map((s) => (s.id === studentId ? { ...s, ...nextUpdates } : s)),
        teachers,
      };
    });
  }, []);

  const assignStudentsToTeacher = useCallback((teacherId, studentIds) => {
    setData((d) => {
      const assignedSet = new Set(studentIds);
      const updatedTeachers = d.teachers.map((t) =>
        t.id === teacherId ? { ...t, assignedStudentIds: studentIds } : t
      );
      const updatedStudents = d.students.map((s) => {
        if (assignedSet.has(s.id)) {
          return { ...s, assignedTeacherId: teacherId };
        }
        if (s.assignedTeacherId === teacherId && !assignedSet.has(s.id)) {
          return { ...s, assignedTeacherId: null };
        }
        return s;
      });
      return {
        ...d,
        teachers: updatedTeachers,
        students: updatedStudents,
      };
    });
  }, []);

  const getTeacherAssignedStudents = useCallback((teacherIdOrName) => {
    if (!data) return [];
    const teacher = data.teachers.find((t) => t.id === teacherIdOrName || t.name === teacherIdOrName);
    if (!teacher || !teacher.assignedStudentIds || teacher.assignedStudentIds.length === 0) {
      return data.students; // Default to all if not set
    }
    return data.students.filter((s) => teacher.assignedStudentIds.includes(s.id));
  }, [data]);

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
        teachers: d.teachers.map((t) => ({
          ...t,
          assignedStudentIds: (t.assignedStudentIds || []).filter((id) => !studentIds.includes(id)),
        })),
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
      teachers: d.teachers.map((t) => ({
        ...t,
        assignedStudentIds: (t.assignedStudentIds || []).filter((id) => id !== studentId),
      })),
    }));
  }, []);

  const deleteTeacher = useCallback((teacherId) => {
    setData((d) => ({
      ...d,
      teachers: d.teachers.filter((t) => t.id !== teacherId),
      salaryPayments: d.salaryPayments.filter((p) => p.teacherId !== teacherId),
      students: d.students.map((s) => (s.assignedTeacherId === teacherId ? { ...s, assignedTeacherId: null } : s)),
    }));
  }, []);

  // =========================================================
  // SLOs
  // =========================================================
  const addSlosFromLines = useCallback((classId, subjectId, term, lines) => {
    const clean = lines.map((l) => l.trim()).filter(Boolean);
    if (!clean.length) return 0;
    const newItems = clean.map((text) => ({ id: uid('slo'), classId, subjectId, term, text }));
    setData((d) => ({ ...d, slos: [...d.slos, ...newItems] }));
    return newItems.length;
  }, []);

  const bulkAddSlos = useCallback((slosList) => {
    setData((d) => {
      let updatedClasses = [...d.classes];
      let updatedSubjects = [...d.subjects];
      const newSlos = [];

      slosList.forEach((item) => {
        let classId = item.classId;
        if (!classId && item.className) {
          let cls = updatedClasses.find((c) => c.name.toLowerCase() === item.className.toLowerCase());
          if (!cls) {
            cls = { id: uid('cls'), name: item.className };
            updatedClasses.push(cls);
          }
          classId = cls.id;
        }

        let subjectId = item.subjectId;
        if (!subjectId && item.subjectName) {
          let subj = updatedSubjects.find((s) => s.name.toLowerCase() === item.subjectName.toLowerCase());
          if (!subj) {
            subj = { id: uid('subj'), name: item.subjectName };
            updatedSubjects.push(subj);
          }
          subjectId = subj.id;
        }

        newSlos.push({
          id: uid('slo'),
          classId: classId || updatedClasses[0]?.id || 'c1',
          subjectId: subjectId || updatedSubjects[0]?.id || 's1',
          term: item.term || 'Term 1',
          text: item.text,
        });
      });

      return {
        ...d,
        classes: updatedClasses,
        subjects: updatedSubjects,
        slos: [...d.slos, ...newSlos],
      };
    });
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
  // TESTS / EXAMS
  // =========================================================
  const addTest = useCallback((studentId, subjectName, score, max, date, examType = 'Class Test', term = 'Term 1') => {
    setData((d) => ({ ...d, tests: [...d.tests, { id: uid('test'), studentId, subject: subjectName, date, score, max, examType, term }] }));
  }, []);

  const editExamResult = useCallback((testId, updates) => {
    setData((d) => ({ ...d, tests: d.tests.map((t) => (t.id === testId ? { ...t, ...updates } : t)) }));
  }, []);

  const deleteExamResult = useCallback((testId) => {
    setData((d) => ({ ...d, tests: d.tests.filter((t) => t.id !== testId) }));
  }, []);

  // Returns per-subject grade breakdown for a student for a given term.
  // Shape: [{ subject, quizAvg, midtermScore, finalScore, pct, grade, remarks }]
  const getStudentGradeCard = useCallback(
    (studentId, term) => {
      const termTests = data.tests.filter((t) => t.studentId === studentId && (!term || t.term === term));
      const subjectMap = {};
      termTests.forEach((t) => {
        if (!subjectMap[t.subject]) subjectMap[t.subject] = { quizzes: [], midterms: [], finals: [], classTests: [] };
        const pct = t.max > 0 ? Math.round((t.score / t.max) * 100) : 0;
        if (t.examType === 'Quiz') subjectMap[t.subject].quizzes.push(pct);
        else if (t.examType === 'Midterm') subjectMap[t.subject].midterms.push(pct);
        else if (t.examType === 'Final') subjectMap[t.subject].finals.push(pct);
        else subjectMap[t.subject].classTests.push(pct);
      });
      return Object.entries(subjectMap).map(([subject, s]) => {
        const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
        const quizAvg = avg(s.quizzes);
        const midtermScore = avg(s.midterms);
        const finalScore = avg(s.finals);
        const classTestAvg = avg(s.classTests);
        // Weighted total: Quiz 20%, Midterm 30%, Final 40%, Class Tests 10%
        const parts = [
          quizAvg !== null ? quizAvg * 0.2 : null,
          midtermScore !== null ? midtermScore * 0.3 : null,
          finalScore !== null ? finalScore * 0.4 : null,
          classTestAvg !== null ? classTestAvg * 0.1 : null,
        ].filter((x) => x !== null);
        const weights = [
          quizAvg !== null ? 0.2 : 0,
          midtermScore !== null ? 0.3 : 0,
          finalScore !== null ? 0.4 : 0,
          classTestAvg !== null ? 0.1 : 0,
        ];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const pct = parts.length && totalWeight > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / totalWeight) : 0;
        const { grade, remarks } = pct >= 90 ? { grade: 'A+', remarks: 'Outstanding' }
          : pct >= 80 ? { grade: 'A', remarks: 'Excellent' }
          : pct >= 70 ? { grade: 'B', remarks: 'Good' }
          : pct >= 60 ? { grade: 'C', remarks: 'Average' }
          : pct >= 50 ? { grade: 'D', remarks: 'Below Average' }
          : { grade: 'F', remarks: 'Fail' };
        return { subject, quizAvg, midtermScore, finalScore, classTestAvg, pct, grade, remarks };
      });
    },
    [data]
  );

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

  // =========================================================
  // ONLINE FEE SUBMISSIONS (Parent upload / Admin approval)
  // =========================================================
  const submitFeePaymentProof = useCallback(
    ({ studentId, month, amount, paymentMethod, referenceId, date, note }) => {
      const newSubmission = {
        id: uid('subm'),
        studentId,
        month,
        amount: Number(amount) || 0,
        paymentMethod: paymentMethod || 'Bank Transfer',
        referenceId: referenceId || '',
        date: date || todayISO(),
        note: note || '',
        status: 'pending',
        submittedAt: Date.now(),
      };
      setData((d) => ({
        ...d,
        feeSubmissions: [newSubmission, ...(d.feeSubmissions || [])],
      }));
      return newSubmission;
    },
    []
  );

  const approveFeeSubmission = useCallback((submissionId) => {
    setData((d) => {
      const sub = (d.feeSubmissions || []).find((s) => s.id === submissionId);
      if (!sub) return d;
      const updatedSubmissions = d.feeSubmissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'approved', reviewedAt: Date.now() } : s
      );
      const newFeePayment = {
        id: uid('fee'),
        studentId: sub.studentId,
        month: sub.month,
        amount: sub.amount,
        date: sub.date,
      };
      return {
        ...d,
        feeSubmissions: updatedSubmissions,
        feePayments: [...d.feePayments, newFeePayment],
      };
    });
  }, []);

  const rejectFeeSubmission = useCallback((submissionId, reason = '') => {
    setData((d) => ({
      ...d,
      feeSubmissions: (d.feeSubmissions || []).map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected', rejectionReason: reason, reviewedAt: Date.now() } : s
      ),
    }));
  }, []);

  const getStudentFeeHistory = useCallback(
    (studentId, numMonths = 6) => {
      const student = data.students.find((s) => s.id === studentId);
      if (!student) return [];
      const fee = student.tuitionFee || 0;
      const history = [];
      const now = new Date();
      for (let i = 0; i < numMonths; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.toISOString().slice(0, 7);
        const paid = getStudentFeePaid(studentId, m);
        let status = 'pending';
        if (fee === 0) status = 'n/a';
        else if (paid >= fee) status = 'paid';
        else if (paid > 0) status = 'partial';
        const submissions = (data.feeSubmissions || []).filter((s) => s.studentId === studentId && s.month === m);
        history.push({
          month: m,
          monthLabel: d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
          fee,
          paid,
          remaining: Math.max(0, fee - paid),
          status,
          submissions,
        });
      }
      return history;
    },
    [data, getStudentFeePaid]
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
      dbStatus,
      data,
      session,
      login,
      logout,
      switchChild,
      nameExists,
      usernameExists,
      authenticateUser,
      assignStudentsToTeacher,
      getTeacherAssignedStudents,
      addClass,
      addSubject,
      addStudent,
      bulkAddStudents,
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
      bulkAddSlos,
      deleteSlo,
      editSlo,
      slosCoveredSet,
      addDailyLog,
      saveAttendanceBulk,
      addTest,
      editExamResult,
      deleteExamResult,
      getStudentGradeCard,
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
      submitFeePaymentProof,
      approveFeeSubmission,
      rejectFeeSubmission,
      getStudentFeeHistory,
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
      dbStatus,
      data,
      session,
      login,
      logout,
      switchChild,
      nameExists,
      usernameExists,
      authenticateUser,
      assignStudentsToTeacher,
      getTeacherAssignedStudents,
      addClass,
      addSubject,
      addStudent,
      bulkAddStudents,
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
      bulkAddSlos,
      deleteSlo,
      editSlo,
      slosCoveredSet,
      addDailyLog,
      saveAttendanceBulk,
      addTest,
      editExamResult,
      deleteExamResult,
      getStudentGradeCard,
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
      submitFeePaymentProof,
      approveFeeSubmission,
      rejectFeeSubmission,
      getStudentFeeHistory,
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
