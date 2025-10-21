import React from 'react';
import { CubeIcon } from './icons/CubeIcon';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 flex items-center p-4 bg-base-100/50 backdrop-blur-sm z-20 border-b border-base-300/50">
      <CubeIcon className="w-7 h-7 text-brand-primary" />
      <h1 className="ml-3 text-xl font-bold tracking-wider text-content">
        Sketch-to-3D <span className="text-brand-primary font-bold">Mesh AI</span>
      </h1>
    </header>
  );
};