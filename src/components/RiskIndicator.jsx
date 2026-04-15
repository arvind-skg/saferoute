import React from 'react';

export default function RiskIndicator({ score, level, size = 48 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    level === 'low' ? 'var(--risk-low)' :
    level === 'medium' ? 'var(--risk-medium)' : 'var(--risk-high)';

  return (
    <div className="risk-indicator">
      <div className="risk-gauge" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            className="risk-gauge-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="risk-gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="risk-gauge-text" style={{ color }}>
          {score}
        </div>
      </div>
      <span className={`risk-badge ${level}`}>
        {level === 'low' ? 'Low Risk' : level === 'medium' ? 'Medium' : 'High Risk'}
      </span>
    </div>
  );
}
