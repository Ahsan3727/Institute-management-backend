'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Trash2, X } from 'lucide-react';
import { parseExcelFile, downloadStudentTemplate, downloadSloTemplate } from '@/utils/excelUtils';
import { useToast } from '@/context/ToastContext';

export default function BulkImportModal({ open, mode = 'students', classes = [], subjects = [], teachers = [], onCancel, onImport }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isStudents = mode === 'students';

  function resetState() {
    setFileName('');
    setParsedRows([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      toast('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.', 'error');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    try {
      const rawRows = await parseExcelFile(file);
      if (!rawRows || rawRows.length === 0) {
        toast('The uploaded spreadsheet contains no data rows.', 'error');
        setLoading(false);
        return;
      }

      const validationErrors = [];
      const validData = [];

      if (isStudents) {
        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const name = (row['Student Name *'] || row['Student Name'] || row['Name'] || '').toString().trim();
          const className = (row['Class *'] || row['Class'] || '').toString().trim();
          const username = (row['Username'] || '').toString().trim();
          const password = (row['Password'] || '').toString().trim() || 'password123';
          const guardianName = (row['Guardian Name'] || '').toString().trim();
          const guardianPhone = (row['Guardian Phone'] || '').toString().trim();
          const address = (row['Address'] || '').toString().trim();
          const admissionDate = (row['Admission Date'] || '').toString().trim();
          const fee = parseFloat(row['Monthly Tuition Fee'] || row['Tuition Fee'] || 0) || 0;
          const teacherName = (row['Assigned Teacher'] || row['Teacher'] || '').toString().trim();

          if (!name) {
            validationErrors.push(`Row ${rowNum}: Student Name is required.`);
            return;
          }
          if (!className) {
            validationErrors.push(`Row ${rowNum}: Class is required.`);
            return;
          }

          // Match class
          const matchedClass = classes.find((c) => c.name.toLowerCase() === className.toLowerCase());
          // Match teacher
          const matchedTeacher = teacherName ? teachers.find((t) => t.name.toLowerCase() === teacherName.toLowerCase()) : null;

          validData.push({
            name,
            className,
            classId: matchedClass ? matchedClass.id : null,
            username: username || name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            password,
            guardianName,
            guardianPhone,
            address,
            admissionDate,
            tuitionFee: fee,
            assignedTeacherId: matchedTeacher ? matchedTeacher.id : null,
            teacherName: matchedTeacher ? matchedTeacher.name : (teacherName || 'None'),
          });
        });
      } else {
        // Syllabus SLOs
        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const className = (row['Class *'] || row['Class'] || '').toString().trim();
          const subjectName = (row['Subject *'] || row['Subject'] || '').toString().trim();
          const term = (row['Term *'] || row['Term'] || 'Term 1').toString().trim();
          const text = (row['SLO Description *'] || row['SLO Description'] || row['Description'] || row['SLO'] || '').toString().trim();

          if (!className || !subjectName || !text) {
            validationErrors.push(`Row ${rowNum}: Class, Subject, and SLO Description are required.`);
            return;
          }

          const matchedClass = classes.find((c) => c.name.toLowerCase() === className.toLowerCase());
          const matchedSubject = subjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());

          validData.push({
            className,
            classId: matchedClass ? matchedClass.id : null,
            subjectName,
            subjectId: matchedSubject ? matchedSubject.id : null,
            term,
            text,
          });
        });
      }

      setParsedRows(validData);
      setErrors(validationErrors);
      toast(`Parsed ${validData.length} valid rows from ${file.name}.`, 'success');
    } catch (err) {
      console.error('File parsing error:', err);
      toast('Failed to parse Excel file. Please check format.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (parsedRows.length === 0) {
      toast('No valid items to import.', 'error');
      return;
    }
    onImport(parsedRows);
    resetState();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 sm:p-6" onClick={onCancel}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[24px] bg-[var(--paper)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--role-bg)] text-[var(--role-dark)]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                {isStudents ? 'Bulk Import Students' : 'Bulk Import Syllabus SLOs'}
              </h3>
              <p className="text-[11.5px] text-[var(--sub)]">Import from Excel (.xlsx) or CSV file</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sub)] hover:bg-[var(--bg)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step 1: Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <div>
              <p className="text-[13px] font-bold text-[var(--ink)]">Step 1: Download Sample Template</p>
              <p className="text-[11.5px] text-[var(--sub)]">
                Use the pre-formatted Excel template with correct columns and example rows.
              </p>
            </div>
            <button
              type="button"
              onClick={isStudents ? downloadStudentTemplate : downloadSloTemplate}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-[12px] font-bold text-[var(--ink)] shadow-sm hover:bg-[var(--bg)]"
            >
              <Download size={14} /> Download Template
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <p className="mb-2 text-[13px] font-bold text-[var(--ink)]">Step 2: Upload Completed File</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[var(--role)] bg-[var(--role-bg)]'
                  : 'border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--bg)]'
              }`}
            >
              <UploadCloud size={32} className="text-[var(--role)] mb-2" />
              <p className="text-[13.5px] font-bold text-[var(--ink)]">
                {fileName ? fileName : 'Click to select or drag & drop file here'}
              </p>
              <p className="mt-1 text-[11px] text-[var(--sub)]">Supports .xlsx, .xls, and .csv files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Validation Errors Notice */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-[var(--red)] bg-[var(--red-bg)] p-3">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--red)] mb-1">
                <AlertTriangle size={14} /> {errors.length} rows skipped due to missing required fields:
              </div>
              <ul className="max-h-24 overflow-y-auto text-[11px] text-[var(--red)] space-y-0.5 pl-4 list-disc">
                {errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 3: Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold text-[var(--ink)]">
                  Preview ({parsedRows.length} items ready to import)
                </p>
                <button
                  type="button"
                  onClick={resetState}
                  className="flex items-center gap-1 text-[11px] font-bold text-[var(--red)] hover:underline"
                >
                  <Trash2 size={12} /> Clear File
                </button>
              </div>

              <div className="max-h-48 overflow-auto rounded-xl border border-[var(--line)] bg-[var(--paper)]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg)] border-b border-[var(--line)]">
                    {isStudents ? (
                      <tr>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Name</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Class</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Username</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Fee (Rs)</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Guardian</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Class</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Subject</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">Term</th>
                        <th className="p-2 text-[10.5px] font-bold text-[var(--sub)]">SLO Description</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] text-[11.5px] text-[var(--ink)]">
                    {parsedRows.slice(0, 50).map((r, i) =>
                      isStudents ? (
                        <tr key={i}>
                          <td className="p-2 font-semibold">{r.name}</td>
                          <td className="p-2">{r.className}</td>
                          <td className="p-2 font-mono text-[10.5px] text-[var(--sub)]">{r.username}</td>
                          <td className="p-2">{r.tuitionFee ? `Rs ${r.tuitionFee.toLocaleString()}` : '—'}</td>
                          <td className="p-2 text-[var(--sub)]">{r.guardianName || '—'}</td>
                        </tr>
                      ) : (
                        <tr key={i}>
                          <td className="p-2 font-semibold">{r.className}</td>
                          <td className="p-2">{r.subjectName}</td>
                          <td className="p-2">{r.term}</td>
                          <td className="p-2 truncate max-w-[200px]">{r.text}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[var(--line)] px-5 py-3.5 bg-[var(--bg)]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-[13px] font-bold text-[var(--sub)] hover:text-[var(--ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || loading}
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--role)] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm disabled:opacity-50 hover:opacity-95"
          >
            <CheckCircle size={15} /> Confirm & Import ({parsedRows.length})
          </button>
        </div>
      </div>
    </div>
  );
}
