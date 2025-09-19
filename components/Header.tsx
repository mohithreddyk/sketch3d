
import React from 'react';
import { CubeIcon } from './icons/CubeIcon';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center p-4 border-b border-base-300 bg-base-200/50 backdrop-blur-sm shadow-md z-10">
      <CubeIcon className="w-8 h-8 text-brand-primary" />
      <h1 className="ml-3 text-2xl font-bold tracking-wider text-content">
        Sketch-to-3D <span className="text-brand-primary">Mesh AI</span>
      </h1>
    </header>
  );
};
