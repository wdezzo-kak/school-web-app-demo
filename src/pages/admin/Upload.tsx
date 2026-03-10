import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImportResult {
  success: boolean;
  message: string;
  count?: number;
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('students');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importTypes = [
    { value: 'students', label: 'Students', columns: 'name, national_id, class (or class_id)' },
    { value: 'teachers', label: 'Teachers', columns: 'name, email, national_id' },
    { value: 'classes', label: 'Classes', columns: 'name, grade' },
    { value: 'subjects', label: 'Subjects', columns: 'name' },
    { value: 'teacher_assignments', label: 'Teacher Assignments', columns: 'teacher_id, class_id, subject_id' },
  ];

  async function handleImport() {
    if (!selectedFile) return;
    
    setImporting(true);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const lines = text.trim().split('\n');
      const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Normalize headers (e.g., "National ID" -> "national_id")
      const headers = rawHeaders.map(h => h.replace(/\s+/g, '_'));
      
      const data: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        if (Object.values(row).some(v => v)) {
          data.push(row);
        }
      }

      let insertData: Record<string, unknown>[] = [];
      let tableName = '';

      switch (importType) {
        case 'students':
          tableName = 'students';
          // Handle both class_id (UUID) and class_name lookup
          if (data.length > 0 && !data[0].class_id && data[0].class) {
            // Need to lookup class by name
            const { data: classes } = await supabase.from('classes').select('id, name');
            const classMap = new Map(classes?.map(c => [c.name.toLowerCase(), c.id]));
            insertData = data.map(row => ({
              name: row.name,
              national_id: row.national_id || row.national_id || row['national id'] || '',
              class_id: row.class_id || classMap.get(row.class?.toLowerCase()) || null,
            }));
          } else {
            insertData = data.map(row => ({
              name: row.name,
              national_id: row.national_id || row['national id'] || '',
              class_id: row.class_id || null,
            }));
          }
          break;
        case 'teachers':
          tableName = 'teachers';
          insertData = data.map(row => ({
            name: row.name,
            email: row.email,
            national_id: row.national_id || row['national id'] || '',
          }));
          break;
        case 'classes':
          tableName = 'classes';
          insertData = data.map(row => ({
            name: row.name,
            grade: row.grade,
          }));
          break;
        case 'subjects':
          tableName = 'subjects';
          insertData = data.map(row => ({
            name: row.name,
          }));
          break;
        case 'teacher_assignments':
          tableName = 'teacher_assignments';
          insertData = data.map(row => ({
            teacher_id: row.teacher_id,
            class_id: row.class_id,
            subject_id: row.subject_id,
          }));
          break;
      }

      if (insertData.length > 0) {
        const { error } = await supabase.from(tableName).insert(insertData);
        
        if (error) {
          setResult({ success: false, message: error.message });
        } else {
          setResult({ success: true, message: `Successfully imported ${insertData.length} records.`, count: insertData.length });
        }
      } else {
        setResult({ success: false, message: 'No valid data found in file.' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Error reading file. Please check the format.' });
    }

    setImporting(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload CSV Data</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border rounded-lg"
          >
            {importTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="cursor-pointer">
              {selectedFile ? (
                <>
                  <FileText className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">Click to change file</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload CSV file</p>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">Expected Columns:</h3>
          <p className="text-sm text-gray-600 font-mono">
            {importTypes.find(t => t.value === importType)?.columns}
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={!selectedFile || importing}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : 'Import Data'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {result.message}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">CSV Templates</h2>
        <div className="space-y-4">
          {importTypes.map((type) => (
            <div key={type.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-sm text-gray-500">{type.columns}</p>
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
