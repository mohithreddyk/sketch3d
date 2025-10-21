
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { EraserIcon } from './icons/EraserIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';

interface DrawingCanvasProps {
  onComplete: (file: File) => void;
  onCancel: () => void;
}

type Tool = 'draw' | 'erase';

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('draw');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.fillStyle = '#050816';
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    // Save initial state
    const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialImageData]);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, imageData]);
    setRedoHistory([]); // Clear redo history on a new action
  };

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
    const context = contextRef.current;
    if (!context) return;
    
    if (tool === 'draw') {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = '#39FF14';
        context.lineWidth = 4;
    } else {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = 20;
    }

    const { offsetX, offsetY } = getEventCoordinates(event);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    event.preventDefault();
  }, [tool]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      saveState();
    }
    setIsDrawing(false);
  }, [isDrawing]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getEventCoordinates(event);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
    event.preventDefault();
  }, [isDrawing]);
  
  const handleUndo = () => {
      if (history.length <= 1) return; // Can't undo initial state
      
      const lastState = history[history.length - 1];
      setRedoHistory(prev => [lastState, ...prev]);

      const newHistory = history.slice(0, -1);
      setHistory(newHistory);

      const prevState = newHistory[newHistory.length - 1];
      contextRef.current?.putImageData(prevState, 0, 0);
  };
  
  const handleRedo = () => {
      if (redoHistory.length === 0) return;

      const nextState = redoHistory[0];
      setHistory(prev => [...prev, nextState]);
      
      const newRedoHistory = redoHistory.slice(1);
      setRedoHistory(newRedoHistory);
      
      contextRef.current?.putImageData(nextState, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.fillStyle = '#050816';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const clearedImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([clearedImageData]);
      setRedoHistory([]);
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
    <div className="fixed inset-0 bg-base-100/80 backdrop-blur-md z-40 flex flex-col items-center justify-center animate-fade-in p-4">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-full p-2 flex items-center gap-2">
            <button
                onClick={() => setTool('draw')}
                className={`p-3 rounded-full transition-colors duration-200 ${
                    tool === 'draw' ? 'bg-brand-primary text-black' : 'text-content-muted hover:bg-base-300'
                }`}
                aria-label="Draw tool"
            >
                <PencilIcon className="w-6 h-6" />
            </button>
            <button
                onClick={() => setTool('erase')}
                className={`p-3 rounded-full transition-colors duration-200 ${
                    tool === 'erase' ? 'bg-brand-primary text-black' : 'text-content-muted hover:bg-base-300'
                }`}
                aria-label="Erase tool"
            >
                <EraserIcon className="w-6 h-6" />
            </button>
            <div className="w-px h-6 bg-base-300/50 mx-1"></div>
            <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-3 rounded-full text-content-muted hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Undo"
            >
                <UndoIcon className="w-6 h-6" />
            </button>
            <button
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
                className="p-3 rounded-full text-content-muted hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Redo"
            >
                <RedoIcon className="w-6 h-6" />
            </button>
        </div>
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
