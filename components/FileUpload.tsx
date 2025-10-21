
import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadButtonProps {
  onFileChange: (file: File | null) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadButtonProps> = ({ onFileChange, children, className, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={disabled}
      />
      <button onClick={handleClick} className={className} disabled={disabled}>
        {children}
      </button>
    </>
  );
};
