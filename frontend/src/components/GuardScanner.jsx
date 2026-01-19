import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const GuardScanner = ({ onToken, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  // 5️⃣ Pre-warm ZXing reader - instantiate once, reuse across renders
  const reader = useMemo(() => new BrowserMultiFormatReader(), []);

  useEffect(() => {
    let stopped = false;
    let decodeTimeoutId = null;
    // Capture ref values at start of effect for cleanup
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });

    const startScanner = async () => {
      try {
        let stream = null;

        // 1️⃣ Reduced camera resolution: 640x480 for faster decoding
        const cameraConfigs = [
          // 1. Try back camera (mobile) - reduced resolution
          {
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          },
          // 2. Try ideal back camera (fallback) - reduced resolution
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          },
          // 3. Try any available camera (laptops, front cameras) - reduced resolution
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
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

        // 3️⃣ & 4️⃣ Throttled manual decode loop with center crop (ROI)
        const decodeLoop = () => {
          if (stopped) return;

          const videoEl = videoRef.current;
          if (!videoEl || !ctx || videoEl.readyState !== 4) {
            // Video not ready, retry after delay
            decodeTimeoutId = setTimeout(decodeLoop, 100);
            return;
          }

          try {
            const vw = videoEl.videoWidth;
            const vh = videoEl.videoHeight;

            if (vw > 0 && vh > 0) {
              // 4️⃣ Center crop: take center 60% of the frame
              const cropRatio = 0.6;
              const cropSize = Math.min(vw, vh) * cropRatio;
              const sx = (vw - cropSize) / 2;
              const sy = (vh - cropSize) / 2;

              // Draw cropped region to 400x400 canvas for faster decode
              const targetSize = 400;
              canvas.width = targetSize;
              canvas.height = targetSize;
              ctx.drawImage(videoEl, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

              // Decode from the cropped canvas
              const result = reader.decodeFromCanvas(canvas);
              if (result && !stopped) {
                stopped = true;
                onToken(result.getText());
                return; // Success - stop loop
              }
            }
          } catch (e) {
            // NotFoundException is expected when no QR in frame - ignore
            // Other errors are also non-fatal, just continue scanning
          }

          // Continue scanning at ~10 fps (100ms interval)
          if (!stopped) {
            decodeTimeoutId = setTimeout(decodeLoop, 100);
          }
        };

        // Start the manual decode loop
        decodeLoop();

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
      // Clear decode timeout
      if (decodeTimeoutId) {
        clearTimeout(decodeTimeoutId);
      }
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
      if (video) {
        video.srcObject = null;
      }
    };
  }, [onToken, reader]);

  return (
    <div className="guard-scanner-overlay">
      <div className="guard-scanner-modal">
        <div className="guard-scanner-header">
          <div className="guard-scanner-title">Scan QR</div>
          <button className="guard-scanner-close-btn" type="button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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

        {/* Hidden canvas for center-crop decoding */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
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

