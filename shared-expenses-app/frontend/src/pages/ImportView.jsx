import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const ImportView = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [animatingIds, setAnimatingIds] = useState(new Set());
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/import/1`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all data? This will let you test a fresh import.')) {
      try {
        await axios.delete(`${API_URL}/clear`);
        alert('Database cleared!');
        setResult(null);
        setFile(null);
        setAnimatingIds(new Set());
      } catch (err) {
        alert('Failed to clear database');
      }
    }
  };

  const handleApprove = async (anomalyId) => {
    setAnimatingIds(prev => new Set(prev).add(anomalyId));
    try {
      await axios.post(`${API_URL}/anomalies/${anomalyId}/approve`);
      // Remove it from the DOM after the 300ms animation finishes
      setTimeout(() => {
        setResult(prev => ({
          ...prev,
          anomalies: prev.anomalies.filter(a => a.id !== anomalyId)
        }));
      }, 300);
    } catch (err) {
      console.error('Failed to approve anomaly', err);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Import Data</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>General Requirement: "Clean up the database for better result afterwards ."</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-danger" onClick={handleClear}>Reset Database</button>
          {result && (
            <button className="btn btn-primary" onClick={handleDownloadReport} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Download Anomaly Report</button>
          )}
        </div>
      </div>

      {!result && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div
            className="file-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
            />
            <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            {file ? (
              <div>
                <h3>{file.name}</h3>
                <p className="item-subtitle">Ready to upload</p>
              </div>
            ) : (
              <div>
                <h3>Select CSV File</h3>
                <p className="item-subtitle">Click to browse for expenses_export.csv</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ width: '100%' }}
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle color="var(--secondary)" size={32} />
              <div>
                <h3 style={{ color: 'var(--secondary)' }}>{result.message}</h3>
                <p className="item-subtitle">The file was successfully parsed and data imported.</p>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="var(--warning)" size={24} />
            Detected Anomalies
          </h3>

          <div className="list-container">
            {result.anomalies.map((anomaly, idx) => (
              <div key={idx} className={`list-item ${animatingIds.has(anomaly.id) ? 'slide-out' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', transition: 'all 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="badge badge-warning">{anomaly.anomaly_type}</span>
                    <span style={{ fontWeight: '600' }}>Row {anomaly.row_number}</span>
                  </div>
                  {!anomaly.user_approved && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleApprove(anomaly.id)}
                    >
                      Approve Resolution
                    </button>
                  )}
                </div>

                <div style={{ width: '100%', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <p><strong>Issue:</strong> {anomaly.description}</p>
                  <p style={{ marginTop: '0.5rem', color: 'var(--secondary)' }}><strong>Resolution Applied:</strong> {anomaly.resolution_applied}</p>
                </div>
              </div>
            ))}

            {result.anomalies.length === 0 && (
              <div className="card text-center" style={{ color: 'var(--text-muted)' }}>
                No anomalies detected in the uploaded file.
              </div>
            )}
          </div>

          {result.report.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={24} />
                Detailed Processing Log
              </h3>
              <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.9rem', backgroundColor: '#000', color: '#0F0' }}>
                {result.report.map((log, idx) => (
                  <div key={idx}>{'>'} {log}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setResult(null)}>Upload Another File</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportView;
