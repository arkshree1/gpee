import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const GuardScanner = ({ onToken, onClose }) => {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    (async () => {
      try {
        // Request camera with back camera preference (environment = rear camera)
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });

        const cams = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!cams || cams.length === 0) {
          setError('No camera device found. Plug in or allow camera access.');
          setRequesting(false);
          return;
        }

        // Find back camera - look for keywords in label
        let backCamera = cams.find(cam => {
          const label = (cam.label || '').toLowerCase();
          return label.includes('back') ||
            label.includes('rear') ||
            label.includes('environment') ||
            label.includes('facing back');
        });

        // If no back camera found by label, try camera2 0 (usually back on Android)
        if (!backCamera) {
          backCamera = cams.find(cam => {
            const label = (cam.label || '').toLowerCase();
            return label.includes('camera2 0') || label.includes('camera 0');
          });
        }

        // Fallback to last camera in list (often back camera on mobile)
        const selectedDevice = backCamera || cams[cams.length - 1];
        const deviceId = selectedDevice.deviceId;

        setRequesting(false);

        // Start scanning with selected back camera
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

  return (
    <div className="guard-scanner-overlay">
      <div className="guard-scanner-modal">
        <div className="guard-scanner-header">
          <div className="guard-scanner-title">Scan QR</div>
          <button className="guard-btn ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

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

