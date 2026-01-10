import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const GuardScanner = ({ onToken, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stopped = false;
    const reader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        // Directly request back camera stream with constraints
        const constraints = {
          video: {
            facingMode: { exact: 'environment' }, // Force back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        let stream;
        try {
          // Try exact environment (back camera) first
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback: try ideal instead of exact (for devices that don't support exact)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        }

        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        // Attach stream directly to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStarting(false);

        // Start QR decoding from the video element
        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (stopped) return;
          if (result) {
            stopped = true;
            onToken(result.getText());
          }
          // Ignore NotFoundException - just means no QR in frame
        });

      } catch (e) {
        if (stopped) return;
        let msg = 'Unable to access camera';
        if (e?.name === 'NotAllowedError') {
          msg = 'Camera permission denied. Please allow camera access.';
        } else if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') {
          msg = 'Back camera not found. Please use a device with a rear camera.';
        } else if (e?.message) {
          msg = e.message;
        }
        setError(msg);
        setStarting(false);
      }
    };

    startScanner();

    return () => {
      stopped = true;
      reader.reset();
      // Stop all camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
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

        <video
          ref={videoRef}
          className="guard-video"
          muted
          playsInline
          autoPlay
          style={{ backgroundColor: '#000' }}
        />

        {starting && (
          <div className="guard-muted" style={{ textAlign: 'center', padding: '10px' }}>
            Starting back camera...
          </div>
        )}
        {error && <div className="guard-error">{error}</div>}
        <div className="guard-scanner-hint">
          Point the back camera at a QR code. If camera doesn't start, check permissions.
        </div>
      </div>
    </div>
  );
};

export default GuardScanner;


