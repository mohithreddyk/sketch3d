
import React from 'react';
import type { PipelineStatus } from '../types';
import { PipelineStage } from '../types';
import type { WorkflowStep } from '../App';
import { FileUpload } from './FileUpload';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PencilIcon } from './icons/PencilIcon';

interface ControlBarProps {
  onFileChange: (file: File | null) => void;
  onGenerate: () => void;
  onToggleDrawing: () => void;
  isGenerating: boolean;
  pipelineStatus: PipelineStatus;
  sketchPreview: string | null;
  onExportOBJ: () => void;
  onResetVariations: () => void;
  onStartOver: () => void;
  numberOfVariations: number;
  onNumberOfVariationsChange: (count: number) => void;
  generatedVariationsCount: number;
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
  workflowStep: WorkflowStep;
}

const STAGES_ORDER = [PipelineStage.SKETCH_PREP, PipelineStage.PAIRING, PipelineStage.TRAINING, PipelineStage.OUTPUT];

const GenerationProgress: React.FC<{ status: PipelineStatus }> = ({ status }) => {
    const { currentStage } = status;
    const currentStageIndex = currentStage ? STAGES_ORDER.indexOf(currentStage) : -1;
    const progressPercentage = currentStage ? ((currentStageIndex + 1) / STAGES_ORDER.length) * 100 : 0;

    return (
        <div className="w-full flex items-center justify-center text-center">
            <div className="w-full max-w-xs">
                <p className="text-brand-primary font-bold text-lg animate-pulse">{currentStage || "Initializing..."}</p>
                <div className="w-full bg-base-300/50 rounded-full h-1.5 mt-2">
                    <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>
            </div>
        </div>
    );
};

const UploadStep: React.FC<{ onFileChange: (file: File | null) => void; onToggleDrawing: () => void; }> = ({ onFileChange, onToggleDrawing }) => (
    <div className="flex items-center justify-center gap-4 animate-slide-in-up">
        <FileUpload
            onFileChange={onFileChange}
            className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
        >
            <UploadIcon className="w-6 h-6 mr-2" />
            Upload Sketch
        </FileUpload>
        <button
            onClick={onToggleDrawing}
            className="bg-base-300/80 hover:bg-base-300 text-content font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
        >
            <PencilIcon className="w-6 h-6 mr-2" />
            Draw Sketch
        </button>
    </div>
);

const GeneratingStep: React.FC<Omit<ControlBarProps, 'workflowStep' | 'onFileChange' | 'onToggleDrawing'>> = (props) => (
    <div className="w-full flex items-center justify-between gap-6 animate-slide-in-up">
        <div className="flex items-center gap-4">
            {props.sketchPreview && (
                 <div className="flex-shrink-0">
                    <img src={props.sketchPreview} alt="Sketch preview" className="h-14 w-14 object-cover rounded-md border-2 border-base-300" />
                </div>
            )}
            <div>
                 <button onClick={props.onStartOver} className="text-sm text-content-muted hover:text-white flex items-center transition-colors">
                    <UndoIcon className="w-4 h-4 mr-2" />
                    Start Over
                </button>
            </div>
        </div>
        
        {props.isGenerating ? <GenerationProgress status={props.pipelineStatus} /> : (
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <label htmlFor="variations-input" className="text-sm font-medium text-content-muted whitespace-nowrap">Variations</label>
                    <input
                        id="variations-input"
                        type="range"
                        min="1"
                        max="5"
                        value={props.numberOfVariations}
                        onChange={(e) => props.onNumberOfVariationsChange(parseInt(e.target.value, 10))}
                        className="w-32 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                        style={{'accentColor': '#39FF14'}}
                    />
                    <span className="font-bold text-lg text-brand-primary">{props.numberOfVariations}</span>
                </div>
                <button
                    onClick={props.onGenerate}
                    className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
                >
                    <SparklesIcon className="w-6 h-6 mr-2" />
                    Generate
                </button>
            </div>
        )}
    </div>
);

const ResultsStep: React.FC<Omit<ControlBarProps, 'workflowStep' | 'onFileChange' | 'onToggleDrawing'>> = (props) => (
    <div className="w-full flex items-center justify-between animate-slide-in-up">
         <button onClick={props.onStartOver} className="text-sm text-content-muted hover:text-white flex items-center transition-colors">
            <UndoIcon className="w-4 h-4 mr-2" />
            Start Over
        </button>
        <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-content-muted">Variations:</span>
            <div className="flex items-center bg-base-300/50 rounded-full p-1">
                {Array.from({ length: props.generatedVariationsCount }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => props.onSelectVariation(index)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                            props.selectedVariationIndex === index
                            ? 'bg-brand-primary text-black'
                            : 'text-content-muted hover:bg-base-300'
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button
              onClick={props.onResetVariations}
              className="bg-red-600/50 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-colors duration-300 text-sm"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Regenerate
            </button>
            <button
              onClick={props.onExportOBJ}
              className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors duration-300 text-lg"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Export OBJ
            </button>
        </div>
    </div>
);


export const ControlBar: React.FC<ControlBarProps> = (props) => {
  const renderContent = () => {
      switch(props.workflowStep) {
          case 'upload':
              return <UploadStep onFileChange={props.onFileChange} onToggleDrawing={props.onToggleDrawing} />;
          case 'generating':
              return <GeneratingStep {...props} />;
          case 'results':
              return <ResultsStep {...props} />;
          default:
              return null;
      }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl p-4 min-h-[90px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};
