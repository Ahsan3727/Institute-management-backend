// printUtils.js — Zero-dependency browser print helpers.
// All functions inject styled HTML into a hidden #print-root div,
// apply @media print CSS that hides the rest of the page, then call
// window.print(). After printing the dialog closes / user cancels,
// the injected content is cleaned up automatically.

const SCHOOL_NAME = 'SLO Tracker Institute';

function injectAndPrint(html) {
  const old = document.getElementById('print-root');
  if (old) old.remove();

  const styleId = 'print-root-style';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @media print {
        body > *:not(#print-root) { display: none !important; }
        #print-root { display: block !important; }
        @page { size: A5; margin: 12mm; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  const root = document.createElement('div');
  root.id = 'print-root';
  root.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#fff;';
  root.innerHTML = html;
  document.body.appendChild(root);

  requestAnimationFrame(() => {
    window.print();
    setTimeout(() => { root.remove(); }, 1000);
  });
}

function letterhead(schoolName, docTitle, docSubtitle) {
  return `
    <div style="text-align:center;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:14px;">
      <div style="font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">${schoolName}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px;">Excellence in Education</div>
      <div style="margin-top:8px;display:inline-block;background:#1e293b;color:#fff;padding:3px 14px;border-radius:20px;font-size:12px;font-weight:700;">${docTitle}</div>
      ${docSubtitle ? `<div style="font-size:10px;color:#64748b;margin-top:4px;">${docSubtitle}</div>` : ''}
    </div>
  `;
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="font-size:11px;color:#64748b;padding:4px 0;width:38%;">${label}</td>
      <td style="font-size:11px;font-weight:600;color:#1e293b;padding:4px 0;">${value || '—'}</td>
    </tr>
  `;
}

function statusBadge(status) {
  const map = {
    paid:    { color: '#16a34a', bg: '#dcfce7', label: 'PAID' },
    partial: { color: '#d97706', bg: '#fef9c3', label: 'PARTIAL' },
    pending: { color: '#dc2626', bg: '#fee2e2', label: 'PENDING' },
  };
  const s = map[status] || map.pending;
  return `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;">${s.label}</span>`;
}

function gradeColor(grade) {
  const map = { 'A+': '#7C3AED', A: '#2563eb', B: '#16a34a', C: '#d97706', D: '#ea580c', F: '#dc2626' };
  return map[grade] || '#64748b';
}

export function calcGrade(pct) {
  if (pct >= 90) return { grade: 'A+', remarks: 'Outstanding' };
  if (pct >= 80) return { grade: 'A',  remarks: 'Excellent' };
  if (pct >= 70) return { grade: 'B',  remarks: 'Good' };
  if (pct >= 60) return { grade: 'C',  remarks: 'Average' };
  if (pct >= 50) return { grade: 'D',  remarks: 'Below Average' };
  return          { grade: 'F',  remarks: 'Fail' };
}

export function printFeeVoucher({ student, classObj, month, fee, paid, status, schoolName = SCHOOL_NAME }) {
  const monthLabel = new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  const remaining  = Math.max(0, fee - paid);
  const issueDate  = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#fff;color:#1e293b;">
      ${letterhead(schoolName, 'Fee Payment Voucher', `For the month of ${monthLabel}`)}
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        ${infoRow('Student Name', student.name)}
        ${infoRow('Class', classObj ? classObj.name : '—')}
        ${infoRow('Guardian', student.guardianName)}
        ${infoRow('Contact', student.guardianPhone)}
        ${infoRow('Admission Date', student.admissionDate)}
        ${infoRow('Issue Date', issueDate)}
      </table>
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Payment Summary</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;color:#64748b;">Monthly Tuition Fee</span>
          <span style="font-size:13px;font-weight:700;">Rs ${fee.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;color:#64748b;">Amount Paid</span>
          <span style="font-size:13px;font-weight:700;color:#16a34a;">Rs ${paid.toLocaleString()}</span>
        </div>
        ${remaining > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:12px;color:#dc2626;">Remaining Balance</span><span style="font-size:13px;font-weight:700;color:#dc2626;">Rs ${remaining.toLocaleString()}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #e2e8f0;">
          <span style="font-size:12px;font-weight:700;">Status</span>
          ${statusBadge(status)}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:14px;border-top:1px dashed #cbd5e1;">
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:120px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Parent / Guardian Signature</div></div>
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:120px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Accounts Officer Signature</div></div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:9px;color:#94a3b8;">This is a computer-generated receipt. Please retain for your records.</div>
    </div>
  `;
  injectAndPrint(html);
}

export function printSalarySlip({ teacher, month, salary, paid, status, schoolName = SCHOOL_NAME }) {
  const monthLabel = new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  const remaining  = Math.max(0, salary - paid);
  const issueDate  = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#fff;color:#1e293b;">
      ${letterhead(schoolName, 'Teacher Salary Slip', `For the month of ${monthLabel}`)}
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        ${infoRow('Employee Name', teacher.name)}
        ${infoRow('Qualification', teacher.qualification)}
        ${infoRow('Phone', teacher.phone)}
        ${infoRow('Email', teacher.email)}
        ${infoRow('Joining Date', teacher.joiningDate)}
        ${infoRow('Issue Date', issueDate)}
      </table>
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Salary Breakdown</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#f1f5f9;"><th style="text-align:left;font-size:11px;padding:5px 8px;color:#64748b;">Earnings</th><th style="text-align:right;font-size:11px;padding:5px 8px;color:#64748b;">Amount</th></tr>
          <tr><td style="font-size:11px;padding:5px 8px;">Basic Salary</td><td style="text-align:right;font-size:11px;font-weight:600;padding:5px 8px;">Rs ${salary.toLocaleString()}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="font-size:12px;font-weight:700;padding:6px 8px;">Gross Total</td><td style="text-align:right;font-size:12px;font-weight:700;padding:6px 8px;">Rs ${salary.toLocaleString()}</td></tr>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;">
          <span style="font-size:12px;color:#64748b;">Amount Paid</span>
          <span style="font-size:13px;font-weight:700;color:#16a34a;">Rs ${paid.toLocaleString()}</span>
        </div>
        ${remaining > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;"><span style="font-size:12px;color:#dc2626;">Balance Due</span><span style="font-size:13px;font-weight:700;color:#dc2626;">Rs ${remaining.toLocaleString()}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;">
          <span style="font-size:12px;font-weight:700;">Status</span>
          ${statusBadge(status)}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:14px;border-top:1px dashed #cbd5e1;">
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:120px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Employee Signature</div></div>
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:120px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Principal / Admin Signature</div></div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:9px;color:#94a3b8;">This is a computer-generated salary slip. Please retain for your records.</div>
    </div>
  `;
  injectAndPrint(html);
}

export function printReportCard({ student, classObj, term, gradeRows, attPct, present, total, schoolName = SCHOOL_NAME }) {
  const issueDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const overallPct = gradeRows.length
    ? Math.round(gradeRows.reduce((s, r) => s + r.pct, 0) / gradeRows.length)
    : 0;
  const { grade: overallGrade, remarks: overallRemarks } = calcGrade(overallPct);

  const subjectRows = gradeRows.map((r) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="font-size:11px;padding:6px 8px;font-weight:600;">${r.subject}</td>
      <td style="text-align:center;font-size:11px;padding:6px 4px;">${r.quizAvg !== null ? r.quizAvg + '%' : '—'}</td>
      <td style="text-align:center;font-size:11px;padding:6px 4px;">${r.midtermScore !== null ? r.midtermScore + '%' : '—'}</td>
      <td style="text-align:center;font-size:11px;padding:6px 4px;">${r.finalScore !== null ? r.finalScore + '%' : '—'}</td>
      <td style="text-align:center;font-size:12px;font-weight:700;padding:6px 4px;">${r.pct}%</td>
      <td style="text-align:center;font-size:12px;font-weight:800;padding:6px 4px;color:${gradeColor(r.grade)};">${r.grade}</td>
      <td style="font-size:10px;padding:6px 4px;color:#64748b;">${r.remarks}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#fff;color:#1e293b;">
      ${letterhead(schoolName, 'Student Report Card', `${term} — Issued: ${issueDate}`)}
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        ${infoRow('Student Name', student.name)}
        ${infoRow('Class', classObj ? classObj.name : '—')}
        ${infoRow('Guardian', student.guardianName)}
        ${infoRow('Admission Date', student.admissionDate)}
        ${infoRow('Term', term)}
      </table>
      <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Academic Performance</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;border:1.5px solid #e2e8f0;">
        <thead>
          <tr style="background:#1e293b;color:#fff;">
            <th style="text-align:left;font-size:10px;padding:6px 8px;">Subject</th>
            <th style="text-align:center;font-size:10px;padding:6px 4px;">Quiz Avg</th>
            <th style="text-align:center;font-size:10px;padding:6px 4px;">Midterm</th>
            <th style="text-align:center;font-size:10px;padding:6px 4px;">Final</th>
            <th style="text-align:center;font-size:10px;padding:6px 4px;">Total %</th>
            <th style="text-align:center;font-size:10px;padding:6px 4px;">Grade</th>
            <th style="text-align:left;font-size:10px;padding:6px 4px;">Remarks</th>
          </tr>
        </thead>
        <tbody>${subjectRows || '<tr><td colspan="7" style="text-align:center;padding:12px;font-size:11px;color:#94a3b8;">No exam results recorded for this term.</td></tr>'}</tbody>
      </table>
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Overall %</div>
          <div style="font-size:22px;font-weight:800;color:#1e293b;margin-top:2px;">${overallPct}%</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Grade</div>
          <div style="font-size:22px;font-weight:800;margin-top:2px;color:${gradeColor(overallGrade)};">${overallGrade}</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Attendance</div>
          <div style="font-size:22px;font-weight:800;color:#1e293b;margin-top:2px;">${attPct}%</div>
          <div style="font-size:9px;color:#94a3b8;">${present}/${total} days</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Result</div>
          <div style="font-size:14px;font-weight:800;margin-top:6px;color:${overallGrade === 'F' ? '#dc2626' : '#16a34a'};">${overallGrade === 'F' ? 'FAIL' : 'PASS'}</div>
        </div>
      </div>
      <div style="background:#fefce8;border:1.5px solid #fde68a;border-radius:8px;padding:8px 12px;font-size:11px;color:#92400e;margin-bottom:16px;">
        <strong>Teacher Remarks:</strong> ${overallRemarks}.${attPct < 75 ? ' Attendance below 75% — improvement required.' : ''}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:14px;border-top:1px dashed #cbd5e1;">
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:110px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Class Teacher</div></div>
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:110px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Principal</div></div>
        <div style="text-align:center;"><div style="height:40px;border-bottom:1px solid #94a3b8;width:110px;margin-bottom:4px;"></div><div style="font-size:10px;color:#64748b;">Parent / Guardian</div></div>
      </div>
      <div style="text-align:center;margin-top:12px;font-size:9px;color:#94a3b8;">This is a computer-generated report card. Please retain for your records.</div>
    </div>
  `;
  injectAndPrint(html);
}
