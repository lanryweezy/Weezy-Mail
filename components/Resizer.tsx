
import React from 'react';

interface ResizerProps {
  onMouseDown: (event: React.MouseEvent) => void;
}

const Resizer: React.FC<ResizerProps> = ({ onMouseDown }) => {
  return (
    <div
      className="w-2 cursor-col-resize flex-shrink-0 flex items-center justify-center"
      onMouseDown={onMouseDown}
    >
        <div className="w-0.5 h-12 bg-[var(--border-glow)] bg-opacity-50 group-hover:bg-opacity-100 group-hover:bg-[var(--accent-cyan)] rounded-full transition-all duration-200"></div>
    </div>
  );
};

export default Resizer;
