import React from 'react';
import type { PipelineStatus } from '../types';
import { FileUpload } from './FileUpload';
import { PipelineStatusDisplay } from './PipelineStatusDisplay';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ControlPanelProps {
  onFileChange: (file: File | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  pipelineStatus: PipelineStatus;
  modelReady: boolean;
  sketchPreview: string | null;
  onExportGLB: () => void;
  onExportOBJ: () => void;
  vertexCount: number;
  faceCount: number;
  onClearModel: () => void;
  numberOfVariations: number;
  onNumberOfVariationsChange: (count: number) => void;
  generatedVariationsCount: number;
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileChange,
  onGenerate,
  isGenerating,
  pipelineStatus,
  modelReady,
  sketchPreview,
  onExportGLB,
  onExportOBJ,
  vertexCount,
  faceCount,
  onClearModel,
  numberOfVariations,
  onNumberOfVariationsChange,
  generatedVariationsCount,
  selectedVariationIndex,
  onSelectVariation,
}) => {
  return (
    <aside className="w-full lg:w-1/3 xl:w-1/4 p-6 bg-base-200 border-r border-base-300 overflow-y-auto flex flex-col gap-6">
      <div className="flex-grow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-brand-secondary">1. Upload Sketch</h2>
          <FileUpload onFileChange={onFileChange} sketchPreview={sketchPreview} />
        </div>
        
        <div className="mb-6 p-4 bg-base-100 rounded-lg border border-base-300">
            <label htmlFor="variations-input" className="block text-sm font-medium text-content mb-2">Number of Variations</label>
            <input
                id="variations-input"
                type="number"
                min="1"
                max="5"
                value={numberOfVariations}
                onChange={(e) => onNumberOfVariationsChange(Math.max(1, Math.min(5, parseInt(e.target.value, 10))))}
                disabled={isGenerating}
                className="w-full bg-base-300 text-content p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">How many different models to generate (1-5).</p>
        </div>

        <div className="mb-6">
          <button
            onClick={onGenerate}
            disabled={isGenerating || !sketchPreview}
            className="w-full bg-brand-primary hover:bg-brand-dark disabled:bg-base-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate 3D Model'}
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-brand-secondary">2. Generation Pipeline</h2>
          <PipelineStatusDisplay status={pipelineStatus} />
        </div>
      </div>
      
      {modelReady && (
        <div className="animate-fade-in flex-shrink-0">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4 text-brand-secondary">3. Results</h2>
            <div className="p-4 bg-base-100 rounded-lg border border-base-300">
                <h3 className="text-lg font-semibold mb-3 text-content">Select Variation</h3>
                <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: generatedVariationsCount }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectVariation(index)}
                            className={`p-2 rounded-md text-sm font-bold transition-colors duration-200 ${
                                selectedVariationIndex === index
                                ? 'bg-brand-primary text-white'
                                : 'bg-base-300 hover:bg-base-300/50 text-content'
                            }`}
                        >
                            Var {index + 1}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {selectedVariationIndex !== null && (
            <>
              <h2 className="text-xl font-semibold mb-4 text-brand-secondary">4. Export & View</h2>
              <div className="p-4 bg-base-100 rounded-lg border border-base-300 mb-4">
                <h3 className="text-lg font-semibold mb-3 text-content">Model Information</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between items-center">
                    <span className="text-gray-400">Vertices</span>
                    <span className="font-mono bg-base-300 px-2 py-1 rounded text-xs">{vertexCount.toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-gray-400">Faces (Triangles)</span>
                    <span className="font-mono bg-base-300 px-2 py-1 rounded text-xs">{faceCount.toLocaleString()}</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={onExportGLB}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export as GLB
                </button>
                <button
                  onClick={onExportOBJ}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export as OBJ
                </button>
                <button
                  onClick={onClearModel}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300"
                >
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Clear Variations
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
};