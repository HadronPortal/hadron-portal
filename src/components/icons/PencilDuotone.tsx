import React from 'react';

interface PencilDuotoneProps {
  size?: number;
  className?: string;
}

const PencilDuotone: React.FC<PencilDuotoneProps> = ({ size = 16, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    {/* path1 – body of the pencil (lighter, background layer) */}
    <path
      opacity="0.3"
      d="M21.4 8.18L19.8 9.78L14.22 4.2L15.82 2.6C16.21 2.21 16.73 2 17.27 2C17.81 2 18.33 2.21 18.72 2.6L21.4 5.28C21.79 5.67 22 6.19 22 6.73C22 7.27 21.79 7.79 21.4 8.18Z"
      fill="currentColor"
    />
    {/* path2 – writing tip & line (solid, foreground layer) */}
    <path
      d="M19.8 9.78L9.58 20H4V14.41L14.22 4.2L19.8 9.78ZM11.61 17.03L7.41 12.83L6 14.24V16H7.76V17.76H9.52L11.61 17.03Z"
      fill="currentColor"
    />
  </svg>
);

export default PencilDuotone;
