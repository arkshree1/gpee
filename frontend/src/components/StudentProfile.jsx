import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentStatus } from '../api/api';
import '../styles/student.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// RGIPT Logo - place logo at public/rgipt-logo.png
const RGIPT_LOGO = '/rgipt-logo.png';

const StudentProfile = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await getStudentStatus();
                setStatus(res.data);
            } catch (err) {
                console.error('Failed to fetch status:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    // Calculate batch from roll number (e.g., 23cd3037 → 2023-27)
    const calculateBatch = (rollNumber) => {
        if (!rollNumber || rollNumber.length < 2) return '--';
        const prefix = rollNumber.substring(0, 2);
        const startYear = parseInt(prefix, 10);
        if (isNaN(startYear)) return '--';
        const fullStartYear = 2000 + startYear;
        const endYear = startYear + 4;
        return `${fullStartYear}-${endYear}`;
    };

    // Extract branch from department or default
    const getBranch = (department) => {
        if (!department) return '--';
        // Common mappings
        const branchMap = {
            'computer science': 'CSE',
            'cse': 'CSE',
            'petroleum': 'PE',
            'chemical': 'CHE',
            'mechanical': 'ME',
            'electrical': 'EE',
        };
        const lowerDept = department.toLowerCase();
        for (const [key, value] of Object.entries(branchMap)) {
            if (lowerDept.includes(key)) return value;
        }
        return department.toUpperCase().substring(0, 4);
    };

    if (loading) {
        return (
            <div className="student-shell">
                <header className="student-header">
                    <button className="student-back" onClick={() => navigate('/student')}>← Back</button>
                    <div>
                        <div className="brand">GoThru</div>
                        <div className="sub">by Watchr</div>
                    </div>
                </header>
                <main className="student-main">
                    <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p>
                </main>
            </div>
        );
    }

    const studentName = status?.studentName || '--';
    const rollNumber = (status?.rollnumber || '--').toUpperCase();
    const branch = getBranch(status?.department || status?.branch);
    const batch = calculateBatch(status?.rollnumber);
    const roomNumber = status?.roomNumber || '--';
    const hostelName = status?.hostelName || '--';
    const contactNumber = status?.contactNumber || '--';
    const imageUrl = status?.imageUrl ? `${API_BASE_URL}${status.imageUrl}` : null;

    return (
        <div className="student-shell">
            <header className="student-header">
                <button className="student-back" onClick={() => navigate('/student')}>← Back</button>
                <div>
                    <div className="brand">GoThru</div>
                    <div className="sub">by Watchr</div>
                </div>
            </header>

            <main className="student-main" style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                {/* ID Card Container */}
                <div className="id-card">
                    {/* Header Section with College Name */}
                    <div className="id-card-header">
                        {/* Left Side - Logo */}
                        <div className="id-card-logo-section">
                            <img
                                src={RGIPT_LOGO}
                                alt="RGIPT Logo"
                                className="id-card-logo"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div className="id-card-logo-text">RGIPT X GoThru</div>
                        </div>

                        {/* Right Side - College Name */}
                        <div className="id-card-college-info">
                            <div className="id-card-college-name-en">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</div>
                            <div className="id-card-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</div>
                            <div className="id-card-college-name-hi">राजीव गाँधी पेट्रोलियम प्रौद्योगिकी संस्थान</div>
                            <div className="id-card-college-subtitle-hi">(संसद के अधिनियम द्वारा राष्ट्रीय महत्व का संस्थान)</div>
                            <div className="id-card-address">Mubarakpur Mukhetia More, Bahadurpur, Post: Harbanshganj, Jais, Amethi-229304, (U.P.) India</div>
                        </div>
                    </div>

                    {/* Tricolor Line */}
                    <div className="id-card-tricolor">
                        <div className="tricolor-saffron"></div>
                        <div className="tricolor-white"></div>
                        <div className="tricolor-green"></div>
                    </div>

                    {/* Card Title */}
                    <div className="id-card-title">Student GoThru Pass Card</div>

                    {/* Main Content */}
                    <div className="id-card-body">
                        {/* Photo Section */}
                        <div className="id-card-photo-section">
                            <div className="id-card-photo-frame">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Student" className="id-card-photo" />
                                ) : (
                                    <div className="id-card-photo-placeholder">
                                        <span>📷</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="id-card-details">
                            <div className="id-card-row">
                                <span className="id-card-label">Name</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{studentName}</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Room & Hostel</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{roomNumber}, {hostelName}</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Contact No.</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{contactNumber}</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Roll No.</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{rollNumber}</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Programme</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">B.Tech</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Branch</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{branch}</span>
                            </div>
                            <div className="id-card-row">
                                <span className="id-card-label">Batch</span>
                                <span className="id-card-colon">:</span>
                                <span className="id-card-value">{batch}</span>
                            </div>
                        </div>
                    </div>


                </div>
            </main>
        </div>
    );
};

export default StudentProfile;
