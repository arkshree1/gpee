import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const GuardScanner = ({ onToken, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  // Pre-warm ZXing reader - instantiate once, reuse across renders
  const reader = useMemo(() => new BrowserMultiFormatReader(), []);

  useEffect(() => {
    let stopped = false;
    // Capture ref value at start of effect for cleanup
    const video = videoRef.current;

    const startScanner = async () => {
      try {
        let stream = null;

        // Camera configs with reduced resolution for faster processing
        const cameraConfigs = [
          {
            video: {
              facingMode: { exact: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          },
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          },
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          },
          {
            video: true,
            audio: false,
          },
        ];

        for (const config of cameraConfigs) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(config);
            break;
          } catch {
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

        // Force low resolution and apply zoom
        try {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            // Try to enforce low resolution
            try {
              await videoTrack.applyConstraints({
                width: { ideal: 640 },
                height: { ideal: 480 },
              });
            } catch {
              // Continue with default resolution
            }

            // Apply hardware zoom if supported (Chrome on Android)
            try {
              const capabilities = videoTrack.getCapabilities();
              if (capabilities.zoom) {
                const maxZoom = capabilities.zoom.max || 1;
                const targetZoom = Math.min(2.0, maxZoom);
                await videoTrack.applyConstraints({
                  advanced: [{ zoom: targetZoom }]
                });
              }
            } catch {
              // Zoom not supported, continue
            }
          }
        } catch {
          // Continue with defaults
        }

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStarting(false);

        // Use ZXing's native continuous scanning (fastest method)
        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (stopped) return;
          if (result) {
            stopped = true;
            onToken(result.getText());
          }
          // NotFoundException is normal when no QR visible - ignore
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
      try {
        if (reader && typeof reader.reset === 'function') {
          reader.reset();
        }
      } catch {
        // ignore
      }
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


