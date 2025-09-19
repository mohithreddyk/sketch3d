
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { ImageFileIcon } from './icons/ImageFileIcon';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  sketchPreview: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, sketchPreview }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      onFileChange(file);
    } else {
      setFileName(null);
      onFileChange(null);
      // You might want to show an error to the user here.
    }
  }, [onFileChange]);

  // Fix: Changed event type from React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement>
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Fix: Changed event type from React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement>
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Fix: Changed event type from React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement>
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Fix: Changed event type from React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement>
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-base-300 border-dashed rounded-lg cursor-pointer bg-base-100 hover:bg-base-300/50 transition-colors duration-300 ${isDragging ? 'border-brand-primary' : ''}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500">PNG, JPG, or other image formats</p>
        </div>
        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleInputChange} />
      </label>
      {sketchPreview && (
        <div className="mt-4 p-4 border border-base-300 rounded-lg bg-base-100">
            <p className="text-sm font-medium text-content mb-2 truncate flex items-center"><ImageFileIcon className="w-4 h-4 mr-2 flex-shrink-0" />{fileName}</p>
            <img src={sketchPreview} alt="Sketch preview" className="max-h-32 w-full object-contain rounded-md" />
        </div>
      )}
    </div>
  );
};
