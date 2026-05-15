import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function ExcelImport({ module, sessionType, existingStudents, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      // 1. Read the Excel file
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // 2. Convert it to JSON
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      setPreview(parsedData);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleSaveToDatabase = async () => {
    if (!window.confirm(`Are you sure you want to upload these grades to the ${sessionType === 'normal_note' ? 'Normal' : 'Rattrapage'} session? This will overwrite existing grades for these students.`)) return;
    
    setIsProcessing(true);

    // 3. Match the Apogée codes from Excel to the student IDs in our database
    const upsertData = [];
    
    preview.forEach((row) => {
      // The Excel column must be named "Apogee" or "Apogée" and "Note"
      const excelApogee = String(row['Apogee'] || row['Apogée']);
      const excelNote = parseFloat(row['Note']);

      const matchedStudent = existingStudents.find(s => s.apogee_code === excelApogee);
      
      if (matchedStudent && !isNaN(excelNote)) {
        upsertData.push({
          student_id: matchedStudent.id,
          module_id: module.id,
          [sessionType]: excelNote
        });
      }
    });

    if (upsertData.length === 0) {
      alert("Error: Could not match any Apogée codes from the file to the students in this class. Make sure your columns are named 'Apogee' and 'Note'.");
      setIsProcessing(false);
      return;
    }

    // 4. Save to Supabase
    const { error } = await supabase
      .from('grades')
      .upsert(upsertData, { onConflict: 'student_id, module_id' });

    setIsProcessing(false);

    if (error) {
      alert("Failed to save grades.");
      console.error(error);
    } else {
      alert(`Successfully imported ${upsertData.length} grades!`);
      setFile(null);
      setPreview([]);
      onImportSuccess(); // Refresh the table
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4 text-slate-800">
        <FileSpreadsheet className="text-green-600" />
        <h3 className="font-bold text-lg">Import from Excel</h3>
      </div>
      
      <div className="mb-4 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-2">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p>Your Excel file must have two columns exactly named: <strong>Apogee</strong> and <strong>Note</strong>.</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition shadow-sm font-medium text-slate-700">
          <Upload size={18} />
          <span>{file ? file.name : 'Choose Excel File'}</span>
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
        </label>

        {preview.length > 0 && (
          <button 
            onClick={handleSaveToDatabase}
            disabled={isProcessing}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm disabled:opacity-50"
          >
            {isProcessing ? 'Saving...' : 'Confirm & Save Grades'}
          </button>
        )}
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3 font-semibold">Apogée (Found in file)</th>
                <th className="p-3 font-semibold">Note (Found in file)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.slice(0, 5).map((row, idx) => (
                <tr key={idx}>
                  <td className="p-3">{row['Apogee'] || row['Apogée']}</td>
                  <td className="p-3 font-medium">{row['Note']}</td>
                </tr>
              ))}
              {preview.length > 5 && (
                <tr>
                  <td colSpan="2" className="p-3 text-center text-slate-500 italic">
                    ... and {preview.length - 5} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}