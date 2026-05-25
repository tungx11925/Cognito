import React from 'react';

export const Modal = ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded">
        {children}
      </div>
    </div>
  );
};
