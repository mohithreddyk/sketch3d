import React, { useEffect, useState, useRef } from 'react';
import type { PipelineStatus } from '../types';
import { PipelineStage } from '../types';
import type { WorkflowStep, ModelId } from '../App';
import { FileUpload } from './FileUpload';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CpuIcon } from './icons/CpuIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { TargetIcon } from './icons/TargetIcon';


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
  generateUVs: boolean;
  onGenerateUVsChange: (value: boolean) => void;
  textPrompt: string;
  onTextPromptChange: (prompt: string) => void;
  selectedModel: ModelId;
  onSelectedModelChange: (model: ModelId) => void;
  creativityLevel: number;
  onCreativityLevelChange: (level: number) => void;
  generatedGeometries: { accuracyScore?: number; accuracyJustification?: string }[];
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
  workflowStep: WorkflowStep;
}

const STAGES_ORDER = [PipelineStage.SKETCH_PREP, PipelineStage.PAIRING, PipelineStage.TRAINING, PipelineStage.OUTPUT];

const AVAILABLE_MODELS: { id: ModelId, name: string }[] = [
  { id: 'gemini-2.5-pro', name: 'Pro Quality' },
  { id: 'gemini-2.5-flash', name: 'Flash Speed' },
];

const AnimatedScore: React.FC<{ score: number }> = ({ score }) => {
    const [currentScore, setCurrentScore] = useState(0);
    // FIX: Pass `undefined` as the initial value to satisfy the `useRef` hook's requirement for an argument.
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const start = performance.now();
        const duration = 750; // ms

        const animate = (time: number) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const animatedValue = Math.floor(progress * score);
            setCurrentScore(animatedValue);
            
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [score]);
    
    return <span className="font-bold text-lg text-white">{currentScore}%</span>;
};

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
            <div className="flex flex-col items-end gap-3 flex-grow max-w-4xl">
                <input
                    type="text"
                    value={props.textPrompt}
                    onChange={(e) => props.onTextPromptChange(e.target.value)}
                    placeholder="Optional: Describe your sketch (e.g., 'a detailed sci-fi helmet')"
                    className="w-full bg-base-300/70 text-content border border-base-300 rounded-full py-2 px-4 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all text-sm placeholder:text-content-muted"
                    aria-label="Describe what to generate"
                />
                <div className="flex items-center justify-end gap-4 w-full">
                    <div className="flex items-center gap-2 text-sm text-content-muted">
                        <CpuIcon className="w-5 h-5" />
                        <select
                            value={props.selectedModel}
                            onChange={(e) => props.onSelectedModelChange(e.target.value as ModelId)}
                            className="bg-base-300/70 border border-base-300 rounded-md py-1 pl-2 pr-8 focus:ring-2 focus:ring-brand-primary focus:outline-none appearance-none"
                            aria-label="Select AI model"
                        >
                            {AVAILABLE_MODELS.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label title="Lower value is more accurate to the sketch, higher value is more creative." htmlFor="creativity-input" className="text-sm font-medium text-content-muted whitespace-nowrap flex items-center gap-1 cursor-help"><BrainCircuitIcon className="w-5 h-5" />Creativity</label>
                        <input
                            id="creativity-input"
                            type="range"
                            min="0"
                            max="100"
                            value={props.creativityLevel}
                            onChange={(e) => props.onCreativityLevelChange(parseInt(e.target.value, 10))}
                            className="w-24 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                            style={{'accentColor': '#39FF14'}}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <label htmlFor="variations-input" className="text-sm font-medium text-content-muted whitespace-nowrap">Variations</label>
                        <input
                            id="variations-input"
                            type="range"
                            min="1"
                            max="5"
                            value={props.numberOfVariations}
                            onChange={(e) => props.onNumberOfVariationsChange(parseInt(e.target.value, 10))}
                            className="w-24 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                            style={{'accentColor': '#39FF14'}}
                        />
                        <span className="font-bold text-lg text-brand-primary">{props.numberOfVariations}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="uv-checkbox"
                            type="checkbox"
                            checked={props.generateUVs}
                            onChange={(e) => props.onGenerateUVsChange(e.target.checked)}
                            className="w-4 h-4 rounded bg-base-300/50 border-base-300/50 text-brand-primary focus:ring-2 focus:ring-offset-base-200 focus:ring-brand-primary cursor-pointer"
                        />
                        <label htmlFor="uv-checkbox" className="text-sm font-medium text-content-muted whitespace-nowrap cursor-pointer">Generate UVs</label>
                    </div>
                    <button
                        onClick={props.onGenerate}
                        className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
                    >
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Generate
                    </button>
                </div>
            </div>
        )}
    </div>
);

const ResultsStep: React.FC<Omit<ControlBarProps, 'workflowStep' | 'onFileChange' | 'onToggleDrawing'>> = (props) => {
    const selectedGeo = props.selectedVariationIndex !== null ? props.generatedGeometries[props.selectedVariationIndex] : null;

    return (
        <div className="w-full flex items-center justify-between animate-slide-in-up">
            <div className="flex-1 flex justify-start">
                <button onClick={props.onStartOver} className="text-sm text-content-muted hover:text-white flex items-center transition-colors">
                    <UndoIcon className="w-4 h-4 mr-2" />
                    Start Over
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
                {selectedGeo ? (
                    <div className="flex items-center gap-3 text-sm text-content-muted h-10" style={{minWidth: '250px'}}>
                        {selectedGeo.accuracyScore !== undefined && selectedGeo.accuracyJustification ? (
                            <div className="flex items-center gap-3 animate-fade-in text-center">
                                <TargetIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                <AnimatedScore score={selectedGeo.accuracyScore} />
                                <div className="w-px h-5 bg-base-300"></div>
                                <p className="italic text-xs">"{selectedGeo.accuracyJustification}"</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-brand-primary"></div>
                                <span>Calculating accuracy...</span>
                            </div>
                        )}
                    </div>
                ) : <div className="h-10" />}
                <div className="flex items-center bg-base-300/50 rounded-full p-1">
                    {Array.from({ length: props.generatedGeometries.length }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => props.onSelectVariation(index)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                                props.selectedVariationIndex === index
                                ? 'bg-brand-primary text-black shadow-md'
                                : 'text-content-muted hover:bg-base-300'
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
                <button
                    onClick={props.onResetVariations}
                    className="bg-red-600/50 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 text-sm"
                >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Regenerate
                </button>
                <button
                    onClick={props.onExportOBJ}
                    className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Export OBJ
                </button>
            </div>
        </div>
    );
};


export const ControlBar: React.FC<ControlBarProps> = (props) => {
  const renderContent = () => {
      switch(props.workflowStep) {
          case 'upload':
              return <UploadStep onFileChange={props.onFileChange} onToggleDrawing={props.onToggleDrawing} />;
          case 'generating':
              // Pass a version of props with generatedGeometries simplified to avoid type issues
              const generatingProps = { ...props, generatedGeometries: [] };
              return <GeneratingStep {...generatingProps} />;
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