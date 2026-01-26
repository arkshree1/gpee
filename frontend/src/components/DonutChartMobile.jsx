import React from 'react';

/**
 * DonutChartMobile - Mobile/Tablet-optimized donut chart with clickable metrics below
 * Desktop donut component remains untouched - this is mobile/tablet-only
 */
const DonutChartMobile = ({ data = [], totalStudents = 0, overview = {}, onCardClick }) => {
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

    // Metrics data - matches desktop exactly
    const metrics = [
        {
            type: 'total',
            title: 'TOTAL STUDENTS',
            value: totalStudents,
            color: '#6366f1'
        },
        {
            type: 'inside',
            title: 'STUDENTS IN CAMPUS',
            value: overview?.studentsInside || 0,
            color: '#34B1AA'
        },
        {
            type: 'outside',
            title: 'STUDENTS OUTSIDE – NORMAL EXIT',
            value: overview?.normalExits || 0,
            color: '#F29F67'
        },
        {
            type: 'local',
            title: 'STUDENT OUT ON LOCAL GATEPASS',
            value: overview?.localGatepassExits || 0,
            color: '#3B8FF3'
        },
        {
            type: 'outstation',
            title: 'STUDENT OUT ON OUTSTATION GATEPASS',
            value: overview?.outstationGatepassExits || 0,
            color: '#1E1E2C'
        }
    ];

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

            {/* Legend - clickable items that show student lists */}
            <div className="donut-mobile-legend">
                {segments.map((seg, i) => {
                    // Map segment labels to click types
                    const getClickType = (label) => {
                        if (label.includes('Inside')) return 'inside';
                        if (label.includes('Normal')) return 'outside';
                        if (label.includes('Local')) return 'local';
                        if (label.includes('Outstation')) return 'outstation';
                        return null;
                    };
                    
                    const clickType = getClickType(seg.label);
                    
                    return seg.value > 0 && (
                        <div 
                            key={i} 
                            className="donut-mobile-legend-item clickable"
                            onClick={() => clickType && onCardClick && onCardClick(clickType)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view students"
                        >
                            <span
                                className="donut-mobile-legend-dot"
                                style={{ backgroundColor: seg.color }}
                            />
                            <span className="donut-mobile-legend-label">
                                {seg.label.includes('Inside') ? 'Inside Campus' :
                                 seg.label.includes('Normal') ? 'Outside (Normal)' :
                                 seg.label.includes('Local') ? 'Local GP' :
                                 seg.label.includes('Outstation') ? 'Outstation GP' : seg.label}
                            </span>
                            <span
                                className="donut-mobile-legend-value"
                                style={{ color: seg.color }}
                            >
                                {seg.value}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Clickable Metrics Panel - Same as Desktop */}
            <div className="donut-mobile-metrics">
                {metrics.map((metric, i) => (
                    <div 
                        key={i}
                        className="donut-mobile-metric-card"
                        style={{ borderLeft: `4px solid ${metric.color}` }}
                        onClick={() => onCardClick && onCardClick(metric.type)}
                    >
                        <div className="donut-mobile-metric-title">{metric.title}</div>
                        <div className="donut-mobile-metric-value" style={{ color: metric.color }}>
                            {metric.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DonutChartMobile;
