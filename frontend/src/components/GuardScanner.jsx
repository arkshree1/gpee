import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const GuardScanner = ({ onToken, onClose }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    (async () => {
      try {
        // Prompt for permission up front to avoid silent failures
        await navigator.mediaDevices.getUserMedia({ video: true });

        const cams = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(cams);
        const deviceId = cams?.[0]?.deviceId;
        if (!deviceId) {
          setError('No camera device found. Plug in or allow camera access.');
          setRequesting(false);
          return;
        }
        setSelectedId(deviceId);
        setRequesting(false);

        await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (stopped) return;
          if (result) {
            stopped = true;
            const text = result.getText();
            onToken(text);
          }
          // ignore decode errors (usually just no QR in frame)
          if (err && err.name && err.name !== 'NotFoundException') {
            // keep quiet for most
          }
        });
      } catch (e) {
        const msg = e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : e?.message || 'Unable to access camera';
        setError(msg);
        setRequesting(false);
      }
    })();

    return () => {
      stopped = true;
      try {
        reader.reset();
      } catch {
        // ignore
      }
    };
  }, [onToken]);

  useEffect(() => {
    // Switch device when dropdown changes
    if (!selectedId || !readerRef.current) return;
    let stopped = false;
    readerRef.current.decodeFromVideoDevice(selectedId, videoRef.current, (result, err) => {
      if (stopped) return;
      if (result) {
        stopped = true;
        onToken(result.getText());
      }
      if (err && err.name && err.name !== 'NotFoundException') {
        // ignore most decode errors
      }
    });
    return () => {
      stopped = true;
    };
  }, [selectedId, onToken]);

  return (
    <div className="guard-scanner-overlay">
      <div className="guard-scanner-modal">
        <div className="guard-scanner-header">
          <div className="guard-scanner-title">Scan QR</div>
          <button className="guard-btn ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {devices.length > 1 && (
          <div style={{ marginBottom: 8 }}>
            <label className="guard-muted" style={{ marginRight: 8 }}>
              Camera
            </label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>
        )}

        <video ref={videoRef} className="guard-video" muted playsInline />

        {requesting && <div className="guard-muted">Requesting camera permission...</div>}
        {error && <div className="guard-error">{error}</div>}
        <div className="guard-scanner-hint">
          If you see "No camera device found", allow camera access or switch to a device with a webcam. On desktop, a USB camera works. QR contains only a random token.
        </div>
      </div>
    </div>
  );
};

export default GuardScanner;
