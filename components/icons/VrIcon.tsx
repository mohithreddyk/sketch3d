
import React from 'react';

export const VrIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="1" y="7" width="22" height="10" rx="2" ry="2" />
    <path d="M8 12h.01" />
    <path d="M16 12h.01" />
    <path d="M4.5 17L3 21" />
    <path d="M19.5 17l1.5 4" />
  </svg>
);
