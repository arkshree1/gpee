import React from 'react';

/**
 * DonutChart - Enterprise admin dashboard donut chart with geometrically centered labels
 */
const DonutChart = ({ data = [], size = 220, strokeWidth = 32, totalStudents = 0 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Label positioning: distance from center to place labels outside the donut
    const labelRadius = radius + strokeWidth / 2 + 55;

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

    // Build segments with geometric midpoint angles
    let accumulatedAngle = 0;
    const segments = data.map((item) => {
        const percentage = total > 0 ? (item.value / total) : 0;
        const segmentLength = percentage * circumference;
        const segmentAngle = percentage * 360;

        // Start from top (-90°), go clockwise
        const startAngle = accumulatedAngle - 90;
        const midAngle = startAngle + (segmentAngle / 2);

        accumulatedAngle += segmentAngle;

        return {
            ...item,
            segmentLength,
            offset: (accumulatedAngle - segmentAngle) / 360 * circumference,
            midAngle,
            percentage
        };
    });

    // Convert angle to x,y coordinates
    const getPosition = (angleDeg, r) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: center + r * Math.cos(rad),
            y: center + r * Math.sin(rad)
        };
    };

    // Professional label names
    const getLabel = (label) => {
        if (label.includes('Inside')) return 'INSIDE CAMPUS';
        if (label.includes('Normal')) return 'OUTSIDE – REGULAR';
        if (label.includes('Local')) return 'OUTSIDE – LOCAL GP';
        if (label.includes('Outstation')) return 'OUTSIDE – OS GP';
        return label.toUpperCase();
    };

    // Container with space for labels
    const padding = 90;
    const containerSize = size + padding * 2;

    return (
        <div
            className="donut-chart-container"
            style={{
                width: containerSize,
                height: containerSize,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <svg
                width={containerSize}
                height={containerSize}
                viewBox={`0 0 ${containerSize} ${containerSize}`}
                style={{ overflow: 'visible' }}
            >
                <g transform={`translate(${padding}, ${padding})`}>
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

                    {/* Center text */}
                    <text
                        x={center}
                        y={center - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: '36px',
                            fontWeight: 700,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fill: '#1e1e2c'
                        }}
                    >
                        {totalStudents}
                    </text>
                    <text
                        x={center}
                        y={center + 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fill: '#666',
                            letterSpacing: '1px'
                        }}
                    >
                        TOTAL STUDENTS
                    </text>

                    {/* Segment labels - geometrically centered */}
                    {segments.map((seg, i) => {
                        if (seg.value <= 0) return null;

                        const pos = getPosition(seg.midAngle, labelRadius);
                        const labelText = getLabel(seg.label);

                        return (
                            <g key={`lbl-${i}`}>
                                {/* Status name */}
                                <text
                                    x={pos.x}
                                    y={pos.y - 8}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        fill: seg.color,
                                        letterSpacing: '0.8px',
                                        opacity: 0.9
                                    }}
                                >
                                    {labelText}
                                </text>
                                {/* Number */}
                                <text
                                    x={pos.x}
                                    y={pos.y + 10}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        fill: seg.color,
                                        opacity: 0.95
                                    }}
                                >
                                    {seg.value}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default DonutChart;
