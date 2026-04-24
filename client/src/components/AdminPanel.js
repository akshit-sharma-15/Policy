import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    policyName: '',
    insurer: ''
  });

  const authHeader = () => {
    const token = btoa(`${credentials.username}:${credentials.password}`);
    return { Authorization: `Basic ${token}` };
  };

  const handleLogin = () => {
    if (credentials.username && credentials.password) {
      setIsAuthenticated(true);
      loadDocuments();
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await axios.get('/api/admin/documents', {
        headers: authHeader()
      });
      setDocuments(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid credentials');
        setIsAuthenticated(false);
      } else {
        setError('Failed to load documents');
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!uploadForm.file || !uploadForm.policyName || !uploadForm.insurer) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('document', uploadForm.file);
    formData.append('policyName', uploadForm.policyName);
    formData.append('insurer', uploadForm.insurer);

    try {
      await axios.post('/api/admin/upload', formData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Document uploaded successfully!');
      setUploadForm({ file: null, policyName: '', insurer: '' });
      document.getElementById('fileInput').value = '';
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/documents/${documentId}`, {
        headers: authHeader()
      });
      setSuccess('Document deleted successfully');
      loadDocuments();
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="card">
        <h2>Admin Login</h2>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            placeholder="Enter username"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            placeholder="Enter password"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button onClick={handleLogin} className="btn-primary">
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Upload Policy Document</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Policy Document (PDF/TXT/JSON)</label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.txt,.json"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
            />
          </div>

          <div className="form-group">
            <label>Policy Name</label>
            <input
              type="text"
              value={uploadForm.policyName}
              onChange={(e) => setUploadForm({ ...uploadForm, policyName: e.target.value })}
              placeholder="e.g., Health Shield Plus"
            />
          </div>

          <div className="form-group">
            <label>Insurer</label>
            <input
              type="text"
              value={uploadForm.insurer}
              onChange={(e) => setUploadForm({ ...uploadForm, insurer: e.target.value })}
              placeholder="e.g., ABC Insurance Co."
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Uploaded Documents</h2>
        {documents.length === 0 ? (
          <p style={{ color: '#999' }}>No documents uploaded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Insurer</th>
                <th>Filename</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.documentId}>
                  <td>{doc.policyName}</td>
                  <td>{doc.insurer}</td>
                  <td>{doc.filename}</td>
                  <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(doc.documentId)}
                      className="btn-secondary"
                      style={{ background: '#fee', color: '#c33' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
