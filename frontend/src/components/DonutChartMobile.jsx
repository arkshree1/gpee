import React from 'react';

/**
 * DonutChartMobile - Mobile-optimized donut chart with legend below
 * Desktop donut component remains untouched - this is mobile-only
 */
const DonutChartMobile = ({ data = [], totalStudents = 0 }) => {
    // Larger donut to fill container - mobile optimized
    const size = 180;
    const strokeWidth = 28;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

    // Build segments
    let accumulatedAngle = 0;
    const segments = data.map((item) => {
        const percentage = total > 0 ? (item.value / total) : 0;
        const segmentLength = percentage * circumference;
        const segmentAngle = percentage * 360;
        accumulatedAngle += segmentAngle;

        return {
            ...item,
            segmentLength,
            offset: (accumulatedAngle - segmentAngle) / 360 * circumference,
            percentage
        };
    });

    // Compact label names for mobile
    const getCompactLabel = (label) => {
        if (label.includes('Inside')) return 'Inside Campus';
        if (label.includes('Normal')) return 'Outside (Normal)';
        if (label.includes('Local')) return 'Local GP';
        if (label.includes('Outstation')) return 'Outstation GP';
        return label;
    };

    return (
        <div className="donut-mobile-wrapper">
            {/* Donut SVG - larger, visually dominant */}
            <div className="donut-mobile-chart">
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {/* Background ring */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="#e8e8e8"
                        strokeWidth={strokeWidth}
                    />

                    {/* Data segments */}
                    {segments.map((seg, i) => (
                        seg.value > 0 && (
                            <circle
                                key={i}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${seg.segmentLength} ${circumference - seg.segmentLength}`}
                                strokeDashoffset={-seg.offset}
                                transform={`rotate(-90 ${center} ${center})`}
                            />
                        )
                    ))}

                    {/* Center circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius - strokeWidth / 2 - 4}
                        fill="#f5f5f5"
                    />

                    {/* Center text - Total count (scaled up) */}
                    <text
                        x={center}
                        y={center - 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fill: '#1e1e2c'
                        }}
                    >
                        {totalStudents}
                    </text>
                    <text
                        x={center}
                        y={center + 14}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fill: '#666',
                            letterSpacing: '0.8px'
                        }}
                    >
                        TOTAL STUDENTS
                    </text>
                </svg>
            </div>

            {/* Legend - 2x2 grid below donut */}
            <div className="donut-mobile-legend">
                {segments.map((seg, i) => (
                    seg.value > 0 && (
                        <div key={i} className="donut-mobile-legend-item">
                            <span
                                className="donut-mobile-legend-dot"
                                style={{ backgroundColor: seg.color }}
                            />
                            <span className="donut-mobile-legend-label">
                                {getCompactLabel(seg.label)}
                            </span>
                            <span
                                className="donut-mobile-legend-value"
                                style={{ color: seg.color }}
                            >
                                {seg.value}
                            </span>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default DonutChartMobile;
