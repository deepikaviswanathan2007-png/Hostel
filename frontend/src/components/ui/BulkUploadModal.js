import React, { useState } from 'react';
import { UploadCloud, X, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const BulkUploadModal = ({ isOpen, onClose, title, columns, sampleData, uploadEndpoint, onSuccess }) => {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'idle', 'uploading', 'success', 'error'
  const [rawText, setRawText] = useState('');
  
  if (!isOpen) return null;

  const downloadSample = () => {
    // Generate both CSV and Excel options? Or just stick to CSV for sample.
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = (file) => {
    if (!file) return;
    
    // Support Excel formats (.xlsx, .xls)
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // By using defval: "" it ensures all headers are present even if cell is empty
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setData(jsonData);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Default to CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleTextChange = (e) => {
    setRawText(e.target.value);
    Papa.parse(e.target.value, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      }
    });
  };

  const handleCellEdit = (rowIndex, field, value) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setData(newData);
  };

  const appendEmptyRow = () => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col.key] = '';
    });
    setData([...data, newRow]);
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    setUploadStatus('uploading');
    
    try {
      // Create a blob from the edited data to send as a file 
      // fulfilling the multer + csv-parser backend requirement
      const csvContent = Papa.unparse(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'upload.csv');

      const response = await api.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus('success');
      setErrors(response.data.errors || []);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setUploadStatus('error');
      setErrors(err.response?.data?.errors || [{ reason: err.message || 'Upload failed' }]);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrors = () => {
    if (!errors.length) return;
    const csv = Papa.unparse(errors.map(e => ({ row: e.row, error: e.reason })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors_${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#7D53F6]">{title} - Bulk Upload</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {data.length === 0 ? (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-[#7D53F6]/30 rounded-xl p-10 text-center bg-[#EEF1F9]/30 hover:bg-[#EEF1F9] transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  className="hidden" 
                  onChange={(e) => processFile(e.target.files[0])}
                />
                <UploadCloud className="w-12 h-12 text-[#7D53F6] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">Drag & Drop CSV / Excel File</h3>
                <p className="text-sm text-gray-500 mb-4">or click to browse from your computer (.csv, .xlsx, .xls)</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                  Select File
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex-1 h-px bg-gray-200"></div>
                OR PASTE RAW CSV
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <textarea 
                className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#7D53F6] focus:border-transparent outline-none font-mono text-sm"
                placeholder="id,name,email..."
                value={rawText}
                onChange={handleTextChange}
              />
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex-1 h-px bg-gray-200"></div>
                OR CREATE MANUALLY
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={appendEmptyRow}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#7D53F6] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  + Add Empty Row
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#EEF1F9] p-3 rounded-lg border border-[#7D53F6]/20">
                <div>
                  <span className="font-semibold text-[#7D53F6]">{data.length}</span> rows loaded
                </div>
                <button 
                  onClick={() => setData([])}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Clear Data
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-500 w-12 text-center">#</th>
                        {columns.map(col => (
                          <th key={col.key} className="px-4 py-3 font-medium text-gray-500">{col.label} *</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.slice(0, 100).map((row, i) => {
                        const hasError = columns.some(col => !row[col.key]);
                        return (
                          <tr key={i} className={hasError ? 'bg-red-50/50' : 'hover:bg-gray-50 transition-colors'}>
                            <td className="px-4 py-3 text-gray-400 text-center">{i + 1}</td>
                            {columns.map(col => (
                              <td key={col.key} className="px-2 py-1">
                                <input 
                                  type="text"
                                  className={`w-full px-2 py-1.5 text-sm bg-transparent border-b ${!row[col.key] ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-[#7D53F6]'} focus:bg-white outline-none rounded-sm transition-colors`}
                                  value={row[col.key] || ''}
                                  onChange={(e) => handleCellEdit(i, col.key, e.target.value)}
                                  placeholder={`Enter ${col.label}`}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {data.length > 100 && (
                     <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-100">
                       Showing first 100 rows preview
                     </div>
                  )}
                  <div className="p-2 border-t border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={appendEmptyRow}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-md text-sm font-medium text-gray-500 hover:text-[#7D53F6] hover:border-[#7D53F6]/40 hover:bg-[#7D53F6]/5 transition-all"
                    >
                      + Add Another Row
                    </button>
                  </div>
                </div>
              </div>
              
              {uploadStatus === 'error' && errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-sm text-red-600">
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    Upload Summary: {errors.length} failed
                  </div>
                  <button onClick={downloadErrors} className="underline font-medium hover:text-red-800">
                    Download Error Report
                  </button>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Successfully processed bulk upload!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
          <button 
            onClick={downloadSample}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Sample
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button 
              disabled={data.length === 0 || isUploading}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-medium text-white bg-[#7D53F6] hover:bg-[#6842c8] rounded-lg shadow-sm shadow-[#7D53F6]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : `Upload ${data.length > 0 ? `${data.length} Records` : ''}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkUploadModal;