"use client";

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CircularProgress({
  percent,
  size = 140,
  strokeWidth = 10,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-label={`${percent}% complete`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-gray-100"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-primary-600 transition-all duration-700 ease-out"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Center text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className={`font-bold fill-gray-900 ${size <= 100 ? "text-xl" : "text-2xl"}`}
      >
        {percent}%
      </text>
    </svg>
  );
}
