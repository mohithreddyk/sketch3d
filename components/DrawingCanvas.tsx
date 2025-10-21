

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface DrawingCanvasProps {
  onComplete: (file: File) => void;
  onCancel: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust for high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.strokeStyle = '#39FF14'; // Neon Lime
    context.lineWidth = 4;
    context.fillStyle = '#050816'; // Deep Navy Black
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;
  }, []);

  const getEventCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
        return {
            offsetX: event.touches[0].clientX - rect.left,
            offsetY: event.touches[0].clientY - rect.top,
        };
    }
    return { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  }

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getEventCoordinates(event);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    event.preventDefault();
  }, []);

  const stopDrawing = useCallback(() => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  }, []);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getEventCoordinates(event);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
    event.preventDefault();
  }, [isDrawing]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.fillStyle = '#050816';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleComplete = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sketch.png', { type: 'image/png' });
        onComplete(file);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-base-100/80 backdrop-blur-md z-40 flex flex-col items-center justify-center animate-fade-in">
        <canvas
            ref={canvasRef}
            className="w-[80vw] h-[70vh] max-w-[1000px] max-h-[600px] rounded-lg shadow-2xl border-2 border-base-300 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
        />
        <div className="flex items-center gap-4 mt-6">
            <button
                onClick={handleClear}
                className="bg-red-600/50 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors duration-300 text-lg"
            >
                <TrashIcon className="w-6 h-6 mr-2" />
                Clear
            </button>
            <button
                onClick={onCancel}
                className="bg-base-300 hover:bg-base-300/80 text-content font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors duration-300 text-lg"
            >
                Cancel
            </button>
            <button
                onClick={handleComplete}
                className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
            >
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                Done
            </button>
        </div>
    </div>
  );
};
