import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/api';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';
import Cropper from 'react-easy-crop';

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
};

const HOSTEL_OPTIONS = [
  { value: 'Sarojini', label: 'Sarojini (A)', prefix: 'A' },
  { value: 'Asima Chatterjee', label: 'Asima Chatterjee (Urja)', prefix: 'U' },
  { value: 'Visvesvaraya', label: 'Visvesvaraya (B)', prefix: 'B' },
  { value: 'CV Raman', label: 'CV Raman (C)', prefix: 'C' },
  { value: 'Ramanujan', label: 'Ramanujan (D)', prefix: 'D' },
  { value: 'Aryabhatta', label: 'Aryabhatta (E)', prefix: 'E' },
  { value: 'Vidyasagar', label: 'Vidyasagar (G)', prefix: 'G' },
  { value: 'Homi Bhabha', label: 'Homi Bhabha (H)', prefix: 'H' },
];

const HOSTEL_PREFIX_MAP = HOSTEL_OPTIONS.reduce((acc, option) => {
  if (option.prefix) {
    acc[option.value] = option.prefix;
  }
  return acc;
}, {});

const Signup = () => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    name: '',
    rollnumber: '',
    course: '',
    branch: '',
    department: '',
    hostelName: '',
    roomNumber: '',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cropping states
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Camera functions
  const openCamera = async () => {
    setCameraError('');
    setCameraReady(false);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setShowCamera(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror the image horizontally (since front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Stop camera
    stopCamera();

    // Open cropper with captured image
    setOriginalImage(imageDataUrl);
    setShowCropper(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormValues((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    if (name === 'hostelName') {
      const nextPrefix = HOSTEL_PREFIX_MAP[value] || '';
      setFormValues((prev) => {
        const prevPrefix = HOSTEL_PREFIX_MAP[prev.hostelName] || '';
        let roomNumber = prev.roomNumber || '';
        if (prevPrefix && roomNumber.startsWith(`${prevPrefix}-`)) {
          roomNumber = roomNumber.slice(prevPrefix.length + 1);
        }
        if (nextPrefix) {
          roomNumber = roomNumber ? `${nextPrefix}-${roomNumber}` : `${nextPrefix}-`;
        }
        return { ...prev, hostelName: value, roomNumber };
      });
      return;
    }
    // When course changes, handle branch/department logic
    if (name === 'course') {
      if (value === 'MBA') {
        // MBA: auto-set branch to Management Studies, no department needed
        setFormValues((prev) => ({ ...prev, course: value, branch: 'Management Studies', department: '' }));
        return;
      } else if (value === 'PhD') {
        // PhD: needs department selection, reset branch
        setFormValues((prev) => ({ ...prev, course: value, branch: '', department: '' }));
        return;
      } else {
        // For BTech, reset branch so user can select, clear department
        setFormValues((prev) => ({ ...prev, course: value, branch: '', department: '' }));
        return;
      }
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(originalImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      setImageFile(croppedFile);
      const croppedPreview = URL.createObjectURL(croppedBlob);
      setImagePreview(croppedPreview);
      setShowCropper(false);
      if (originalImage) {
        URL.revokeObjectURL(originalImage);
      }
    } catch (err) {
      setPopupMessage('Failed to crop image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (originalImage) {
      URL.revokeObjectURL(originalImage);
    }
    setOriginalImage(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validate = () => {
    const { name, rollnumber, course, branch, department, hostelName, roomNumber, contactNumber, email, password, confirmPassword } = formValues;

    // Branch is required only for BTech, Department is required only for PhD
    const branchRequired = course === 'BTech';
    const departmentRequired = course === 'PhD';
    if (!name || !rollnumber || !course || (branchRequired && !branch) || (departmentRequired && !department) || !hostelName || !roomNumber || !contactNumber || !email || !password || !confirmPassword || !imageFile) {
      setPopupMessage('All fields including image are required.');
      return false;
    }

    if (!/^[A-Za-z0-9]+$/.test(rollnumber)) {
      setPopupMessage('Roll number must be alphanumeric (e.g. 23CD3037).');
      return false;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      setPopupMessage('Contact number must be 10 digits.');
      return false;
    }

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setPopupMessage('Please enter a valid email.');
      return false;
    }

    // Restrict to RGIPT email domain only
    if (!email.toLowerCase().endsWith('@rgipt.ac.in')) {
      setPopupMessage('Email must be your RGIPT college email (@rgipt.ac.in)');
      return false;
    }

    if (password.length < 6) {
      setPopupMessage('Password must be at least 6 characters.');
      return false;
    }

    if (password !== confirmPassword) {
      setPopupMessage('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', formValues.name);
      formData.append('rollnumber', formValues.rollnumber);
      formData.append('course', formValues.course);
      formData.append('branch', formValues.branch);
      formData.append('department', formValues.department);
      formData.append('hostelName', formValues.hostelName);
      formData.append('roomNumber', formValues.roomNumber);
      formData.append('contactNumber', formValues.contactNumber);
      formData.append('email', formValues.email);
      formData.append('password', formValues.password);
      formData.append('confirmPassword', formValues.confirmPassword);
      formData.append('image', imageFile);

      const response = await signup(formData);
      setPopupMessage(response.data.message || 'Signup successful, please verify OTP.');

      if (response.data.email) {
        localStorage.setItem('pendingEmail', response.data.email);
      }

      navigate('/otp');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during signup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gothru-auth-page">
      {/* Institutional Banner */}
      <div className="gothru-institution-banner">
        <img
          src="/rgipt-banner.png"
          alt="RGIPT - An Institution of National Importance, Government of India"
        />
      </div>

      {/* Auth Content */}
      <div className="gothru-auth-content">
        <div className="gothru-auth-card gothru-auth-card--signup">
          {/* Brand */}
          <div className="gothru-brand">
            <span className="gothru-brand-name">GoThru</span>
            <span className="gothru-brand-tagline">by Watchr</span>
          </div>

          {/* Title */}
          <h1 className="gothru-form-title">Sign Up</h1>

          {/* Form */}
          <form className="gothru-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="name">Full Name</label>
              <div className="gothru-input-wrapper">
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="gothru-input"
                  placeholder="Enter your name"
                  value={formValues.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Roll Number */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="rollnumber">Roll Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="rollnumber"
                  type="text"
                  name="rollnumber"
                  className="gothru-input"
                  placeholder="e.g. 23CD3037"
                  value={formValues.rollnumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Course */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="course">Course</label>
              <div className="gothru-input-wrapper">
                <select
                  id="course"
                  name="course"
                  className="gothru-select"
                  value={formValues.course}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select course</option>
                  <option value="BTech">BTech</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>

            {/* Branch - Only shown for BTech */}
            {formValues.course === 'BTech' && (
              <div className="gothru-input-group">
                <label className="gothru-label" htmlFor="branch">Branch</label>
                <div className="gothru-input-wrapper">
                  <select
                    id="branch"
                    name="branch"
                    className="gothru-select"
                    value={formValues.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select branch</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Chemical Engineering (Major: Renewable Energy Engineering)">
                      Chemical Engineering (Renewable Energy)
                    </option>
                    <option value="Chemical Engineering (Major: Petrochemicals and Polymers Engineering)">
                      Chemical Engineering (Petrochemicals)
                    </option>
                    <option value="Computer Science and Design Engineering">
                      Computer Science and Design
                    </option>
                    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                    <option value="Electrical Engineering (Major: E Vehicle Technology)">
                      Electrical Engineering (EV Tech)
                    </option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mathematics and Computing">Mathematics and Computing</option>
                    <option value="Petroleum Engineering">Petroleum Engineering</option>
                    <option value="Petroleum Engineering (Major: Applied Petroleum Geoscience)">
                      Petroleum Engineering (Geoscience)
                    </option>
                    <option value="Energy and human sciences">Energy and human sciences</option>
                  </select>
                </div>
              </div>
            )}

            {/* Department - Only shown for PhD */}
            {formValues.course === 'PhD' && (
              <div className="gothru-input-group">
                <label className="gothru-label" htmlFor="department">Department</label>
                <div className="gothru-input-wrapper">
                  <select
                    id="department"
                    name="department"
                    className="gothru-select"
                    value={formValues.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select department</option>
                    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                    <option value="Chemical and Biochemical Engineering">Chemical and Biochemical Engineering</option>
                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Petroleum Engineering and Geoengineering">Petroleum Engineering and Geoengineering</option>
                    <option value="Mathematical Sciences">Mathematical Sciences</option>
                    <option value="Management Studies">Management Studies</option>
                    <option value="Energy and Human Sciences">Energy and Human Sciences</option>
                  </select>
                </div>
              </div>
            )}

            {/* Hostel */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="hostelName">Hostel</label>
              <div className="gothru-input-wrapper">
                <select
                  id="hostelName"
                  name="hostelName"
                  className="gothru-select"
                  value={formValues.hostelName}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select hostel</option>
                  {HOSTEL_OPTIONS.map((hostel) => (
                    <option key={hostel.value} value={hostel.value}>
                      {hostel.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Number */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="roomNumber">Room Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="roomNumber"
                  type="text"
                  name="roomNumber"
                  className="gothru-input"
                  placeholder="e.g. E-501"
                  value={formValues.roomNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="contactNumber">Contact Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="contactNumber"
                  type="tel"
                  name="contactNumber"
                  className="gothru-input"
                  placeholder="10-digit number"
                  value={formValues.contactNumber}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="email">College Email</label>
              <div className="gothru-input-wrapper">
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="gothru-input"
                  placeholder="Enter your college email"
                  value={formValues.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="password">Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="gothru-input gothru-input-password"
                  placeholder="Min 6 characters"
                  value={formValues.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="gothru-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '◡' : '◎'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="gothru-input gothru-input-password"
                  placeholder="Re-enter password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="gothru-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '◡' : '◎'}
                </button>
              </div>
            </div>

            {/* Photo Capture */}
            <div className="gothru-input-group">
              <label className="gothru-label">Profile Photo (Live Selfie)</label>
              <div className="gothru-camera-section">
                {imagePreview ? (
                  <div className="gothru-photo-captured">
                    <img src={imagePreview} alt="Captured selfie" className="gothru-captured-image" />
                    <button
                      type="button"
                      className="gothru-retake-btn"
                      onClick={openCamera}
                    >
                      📷 Retake Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="gothru-camera-btn"
                    onClick={openCamera}
                  >
                    📷 Take Selfie
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="gothru-btn">
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer */}
          <div className="gothru-footer">
            Already a member?{' '}
            <span
              className="gothru-footer-link"
              onClick={() => navigate('/login')}
            >
              Sign In
            </span>
          </div>
        </div>
      </div>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />

      {/* Image Cropper Modal */}
      {showCropper && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <h3 className="crop-modal-title">Crop Profile Photo</h3>
            <p className="crop-modal-subtitle">Adjust to fit a 1:1 square ratio</p>

            <div className="crop-container">
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>

            <div className="crop-zoom-control">
              <span className="crop-zoom-label">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="crop-zoom-slider"
              />
            </div>

            <div className="crop-modal-actions">
              <button className="crop-btn crop-btn-cancel" onClick={handleCropCancel}>
                Cancel
              </button>
              <button className="crop-btn crop-btn-confirm" onClick={handleCropConfirm}>
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="crop-modal-overlay">
          <div className="crop-modal camera-modal">
            <h3 className="crop-modal-title">Take a Selfie</h3>
            <p className="crop-modal-subtitle">Position your face in the frame</p>

            <div className="camera-container">
              {cameraError ? (
                <div className="camera-error">
                  <p>{cameraError}</p>
                  <button className="crop-btn crop-btn-cancel" onClick={stopCamera}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />
                  <div className="camera-overlay">
                    <div className="camera-frame"></div>
                  </div>
                </>
              )}
            </div>

            {!cameraError && (
              <div className="crop-modal-actions">
                <button className="crop-btn crop-btn-cancel" onClick={stopCamera}>
                  Cancel
                </button>
                <button
                  className="crop-btn crop-btn-confirm camera-capture-btn"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                >
                  {cameraReady ? (
                    '📸 Capture'
                  ) : (
                    <span className="loader loader--inline" role="status" aria-label="Loading"></span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
