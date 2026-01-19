import React, { useEffect, useState } from 'react';
import { manualEntry, manualExit, searchGuardStudents } from '../api/api';

const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const GuardManualEntry = ({ onExitCompleted }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [suppressNextSearch, setSuppressNextSearch] = useState(false);
  const [place, setPlace] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('exit'); // 'exit' or 'entry', decided by presence
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAction, setLastAction] = useState('exit');

  useEffect(() => {
    // If the query change came from selecting a suggestion,
    // skip running a new search so suggestions don't reappear.
    if (suppressNextSearch) {
      setSuppressNextSearch(false);
      return;
    }

    if (!query.trim()) {
      setResults([]);
      setSelected(null);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchGuardStudents(query.trim());
        setResults(res.data.students || []);
        setError('');
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to search students');
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, suppressNextSearch]);

  const handleSelect = (student) => {
    setSelected(student);
    setQuery(student.rollnumber || '');
    setResults([]);
    setSuppressNextSearch(true);
    setMessage('');
    setError('');

    if (student.presence === 'outside') {
      // Student is currently outside -> manual ENTRY
      setMode('entry');
      setPlace(student.outPlace || '');
      setPurpose(student.outPurpose || '');
    } else {
      // Treat any non-outside as inside -> manual EXIT
      setMode('exit');
      setPlace('');
      setPurpose('');
    }
  };

  const resetForm = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setPlace('');
    setPurpose('');
    setMode('exit');
    setMessage('');
    setError('');
    setSuppressNextSearch(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setError('Select a student first');
      return;
    }

    if (mode === 'exit') {
      if (!place.trim() || !purpose.trim()) {
        setError('Place and purpose are required');
        return;
      }
    }

    try {
      setSubmitLoading(true);
      setError('');
      setMessage('');

      if (mode === 'exit') {
        await manualExit({
          studentId: selected._id,
          place: place.trim(),
          purpose: purpose.trim(),
        });
        setMessage('Exit recorded successfully');
        setLastAction('exit');
        setShowSuccessModal(true);
      } else {
        await manualEntry({
          studentId: selected._id,
        });
        setMessage('Entry recorded successfully');
        setLastAction('entry');
        setShowSuccessModal(true);
      }

      if (onExitCompleted) onExitCompleted();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record entry/exit');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="guard-manual-page">
      <div className="guard-manual-left">
        <div className="guard-manual-title">APPLY MANUALLY</div>

        <div className="guard-manual-search-wrap">
          <input
            type="text"
            className="guard-manual-search-input"
            placeholder="Search Student by Roll No."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Any manual typing should allow searches again
              setSuppressNextSearch(false);
            }}
          />
        </div>

        {!!results.length && (
          <div className="guard-manual-suggestions">
            {results.map((s) => (
              <button
                key={s._id}
                type="button"
                className="guard-manual-suggestion"
                onClick={() => handleSelect(s)}
              >
                <div className="guard-manual-suggestion-avatar">
                  {s.imageUrl && (
                    <img
                      src={normalizeImageUrl(s.imageUrl)}
                      alt={s.name || 'Student'}
                      className="guard-manual-suggestion-avatar-img"
                    />
                  )}
                </div>
                <div className="guard-manual-suggestion-text">
                  <div className="guard-manual-suggestion-name">{s.name}</div>
                  <div className="guard-manual-suggestion-roll">{s.rollnumber}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="guard-manual-card" onSubmit={handleSubmit}>
        <div className="guard-manual-avatar">
          {selected?.imageUrl && (
            <img
              src={normalizeImageUrl(selected.imageUrl)}
              alt={selected.name || 'Student'}
              className="guard-manual-form-avatar-img"
            />
          )}
        </div>

        <div className="guard-manual-row single">
          <label className="guard-manual-label">Student's Name</label>
          <input
            className="guard-manual-input"
            type="text"
            value={selected?.name || ''}
            readOnly
          />
        </div>

        <div className="guard-manual-row">
          <div className="guard-manual-field">
            <label className="guard-manual-label">Roll No.</label>
            <input
              className="guard-manual-input"
              type="text"
              value={selected?.rollnumber || ''}
              readOnly
            />
          </div>
          <div className="guard-manual-field">
            <label className="guard-manual-label">Department</label>
            <input
              className="guard-manual-input"
              type="text"
              value={selected?.branch || ''}
              readOnly
            />
          </div>
        </div>

        <div className="guard-manual-row">
          <div className="guard-manual-field">
            <label className="guard-manual-label">Room No.</label>
            <input
              className="guard-manual-input"
              type="text"
              value={selected?.roomNumber || ''}
              readOnly
            />
          </div>
          <div className="guard-manual-field">
            <label className="guard-manual-label">Contact</label>
            <input
              className="guard-manual-input"
              type="text"
              value={selected?.contactNumber || ''}
              readOnly
            />
          </div>
        </div>

        <div className="guard-manual-row">
          <div className="guard-manual-field">
            <label className="guard-manual-label">Place</label>
            <input
              className="guard-manual-input"
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div className="guard-manual-field">
            <label className="guard-manual-label">Purpose</label>
            <input
              className="guard-manual-input"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="guard-manual-error">{error}</div>}
        {message && <div className="guard-manual-message">{message}</div>}

        <button type="submit" className="guard-manual-submit" disabled={submitLoading}>
          {submitLoading
            ? 'PROCESSING...'
            : mode === 'entry'
              ? 'MAKE ENTRY'
              : 'MAKE EXIT'}
        </button>
      </form>

      {showSuccessModal && (
        <div className="guard-manual-modal-backdrop">
          <div className="guard-manual-modal">
            <div className="guard-manual-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="guard-manual-modal-title">
              {lastAction === 'entry' ? 'Entry done' : 'Exit done'}
            </div>
            <button
              type="button"
              className="guard-manual-modal-button"
              onClick={() => {
                setShowSuccessModal(false);
                resetForm();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardManualEntry;
