import { useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
  const [file, setFile] = useState(null);
  const [rules, setRules] = useState(['', '', '']);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRuleChange = (index, value) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    const filteredRules = rules.filter(r => r.trim().length > 0);
    if (filteredRules.length === 0) {
      setError('Please enter at least one rule');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rules', JSON.stringify(filteredRules));

      const response = await fetch(`${API_URL}/api/documents/validate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to check document');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError('Unable to check document. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>PDF Rule Checker</h1>

      <form onSubmit={handleSubmit}>
        <div className="upload-section">
          <label className="file-label">
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <span className="file-button">Choose PDF File</span>
            <span className="file-name">{file ? file.name : 'No file selected'}</span>
          </label>
        </div>

        <div className="rules-section">
          <h2>Enter Rules</h2>
          <input
            type="text"
            placeholder="Rule 1: e.g., Document must have a purpose section"
            value={rules[0]}
            onChange={(e) => handleRuleChange(0, e.target.value)}
          />
          <input
            type="text"
            placeholder="Rule 2: e.g., Document must mention at least one date"
            value={rules[1]}
            onChange={(e) => handleRuleChange(1, e.target.value)}
          />
          <input
            type="text"
            placeholder="Rule 3: e.g., Document must define at least one term"
            value={rules[2]}
            onChange={(e) => handleRuleChange(2, e.target.value)}
          />
        </div>

        <button type="submit" className="check-button" disabled={loading}>
          {loading ? 'Checking...' : 'Check Document'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Checking document...</div>}

      {results && (
        <div className="results">
          <h2>Results</h2>
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Reasoning</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.rule}</td>
                  <td>
                    <span className={`status status-${result.status}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{result.evidence}</td>
                  <td>{result.reasoning}</td>
                  <td>{result.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
