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
        let stream = null;

        // Try different camera configurations in order of preference
        const cameraConfigs = [
          // 1. Try back camera (mobile)
          {
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          // 2. Try ideal back camera (fallback)
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          // 3. Try any available camera (laptops, front cameras)
          {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          // 4. Most basic - just get any video
          {
            video: true,
            audio: false,
          },
        ];

        for (const config of cameraConfigs) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(config);
            break; // Success, stop trying
          } catch {
            // This config failed, try next
            continue;
          }
        }

        if (!stream) {
          throw new Error('Could not access any camera');
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
          msg = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (e?.name === 'NotFoundError') {
          msg = 'No camera found on this device.';
        } else if (e?.name === 'NotReadableError') {
          msg = 'Camera is in use by another application.';
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
      // Safely try to reset reader
      try {
        if (reader && typeof reader.reset === 'function') {
          reader.reset();
        }
      } catch {
        // ignore
      }
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
            Starting camera...
          </div>
        )}
        {error && <div className="guard-error">{error}</div>}
        <div className="guard-scanner-hint">
          Point the camera at a QR code. Hold steady until detected.
        </div>
      </div>
    </div>
  );
};

export default GuardScanner;
