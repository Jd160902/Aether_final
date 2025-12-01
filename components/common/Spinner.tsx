
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-6 h-6 border-4 border-calm-blue-200 border-t-calm-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
