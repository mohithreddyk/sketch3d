
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as THREE from 'three';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { Viewer } from './components/Viewer';
import type { PipelineStatus } from './types';
import { PipelineStage } from './types';

type GeneratedGeometry = {
  vertices: number[];
  faces: number[];
};

const App: React.FC = () => {
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    currentStage: null,
    completedStages: new Set(),
  });
  const [generatedGeometries, setGeneratedGeometries] = useState<GeneratedGeometry[]>([]);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [numberOfVariations, setNumberOfVariations] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const modelRef = useRef<THREE.Group>(null!);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSketchFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleReset();
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const handleGeneration = async () => {
    if (!sketchFile) {
      setError("Please upload a sketch first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    
    // Streamline the pipeline UI update for perceived speed
    const preGenerationStages = new Set<PipelineStage>([
        PipelineStage.SKETCH_PREP,
        PipelineStage.MESH_PREP,
        PipelineStage.PAIRING,
        PipelineStage.TRAINING,
    ]);
    setPipelineStatus({ currentStage: PipelineStage.OUTPUT, completedStages: preGenerationStages });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const schema = {
          type: Type.OBJECT,
          properties: {
              vertices: {
                  type: Type.ARRAY,
                  description: 'Flat array of vertex coordinates [x1, y1, z1, x2, y2, z2, ...].',
                  items: { type: Type.NUMBER }
              },
              faces: {
                  type: Type.ARRAY,
                  description: 'Flat array of vertex indices for triangular faces [f1_v1, f1_v2, f1_v3, f2_v1, f2_v2, f2_v3, ...].',
                  items: { type: Type.INTEGER }
              }
          },
          required: ['vertices', 'faces']
      };

      const imagePart = await fileToGenerativePart(sketchFile);
      
      const generationPromises = Array.from({ length: numberOfVariations }, () => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
              parts: [
                  imagePart,
                  // Optimized prompt for faster generation
                  { text: 'Convert the provided 2D sketch into a 3D mesh. Ensure the model is centered and fits within a 2x2x2 cube. Output the geometry as vertices and faces in the required JSON format.' }
              ]
          },
          config: {
              systemInstruction: 'You are an expert 3D modeling AI. Your task is to convert 2D sketches into high-quality 3D mesh data (vertices and faces). Prioritize accuracy and adherence to the visual details of the source sketch.',
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature: 0.2,
          }
        })
      );

      const responses = await Promise.all(generationPromises);
      const geometries = responses
        .map(response => {
            try {
                const text = response.text?.trim();
                if (text) {
                    return JSON.parse(text);
                }
                console.warn('Received empty response from model for one variation.');
                return null;
            } catch (e) {
                console.error('Failed to parse JSON for one variation:', response.text, e);
                return null;
            }
        })
        .filter((g): g is GeneratedGeometry => g !== null);

      if (geometries.length === 0) {
          throw new Error("The model failed to generate valid 3D data. Please try a different sketch or adjust your settings.");
      }
      
      setGeneratedGeometries(geometries);
      setSelectedGeometryIndex(0);

      const allStagesCompleted = new Set(preGenerationStages);
      allStagesCompleted.add(PipelineStage.OUTPUT);
      setPipelineStatus({ currentStage: null, completedStages: allStagesCompleted });

    } catch (e) {
      console.error(e);
      setError(`An error occurred during model generation: ${e instanceof Error ? e.message : String(e)}`);
      setPipelineStatus({ currentStage: null, completedStages: new Set() });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setIsGenerating(false);
    setPipelineStatus({ currentStage: null, completedStages: new Set() });
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setError(null);
  };

  const saveFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  };

  const handleExportGLB = () => {
    alert("Exporting to GLB is a complex binary format operation requiring the GLTFExporter library, which is not available in this environment. This message is a placeholder for the export logic.");
  };

  const handleExportOBJ = () => {
    if (!modelRef.current) {
      alert("Error: Model reference not found.");
      return;
    }

    let mesh: THREE.Mesh | null = null;
    modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            mesh = child;
        }
    });

    if (!mesh || !(mesh.geometry instanceof THREE.BufferGeometry)) {
        alert("Error: No exportable mesh found in the model.");
        return;
    }

    const geometry = mesh.geometry;
    const position = geometry.attributes.position;
    const index = geometry.index;
    
    let output = '# Generated by Sketch-to-3D Mesh AI\n';

    for (let i = 0; i < position.count; i++) {
        output += `v ${position.getX(i).toFixed(6)} ${position.getY(i).toFixed(6)} ${position.getZ(i).toFixed(6)}\n`;
    }

    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            output += `f ${index.getX(i) + 1} ${index.getY(i) + 1} ${index.getZ(i) + 1}\n`;
        }
    } else {
        for (let i = 0; i < position.count; i += 3) {
            output += `f ${i + 1} ${i + 2} ${i + 3}\n`;
        }
    }

    const blob = new Blob([output], { type: 'text/plain' });
    saveFile(blob, `model_variation_${(selectedGeometryIndex ?? 0) + 1}.obj`);
  };
  
  const selectedGeometry = selectedGeometryIndex !== null ? generatedGeometries[selectedGeometryIndex] : null;
  const vertexCount = selectedGeometry ? Math.floor(selectedGeometry.vertices.length / 3) : 0;
  const faceCount = selectedGeometry ? Math.floor(selectedGeometry.faces.length / 3) : 0;

  return (
    <div className="flex flex-col h-screen font-sans bg-base-100 text-content antialiased">
      <Header />
      <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <ControlPanel
          onFileChange={handleFileChange}
          onGenerate={handleGeneration}
          isGenerating={isGenerating}
          pipelineStatus={pipelineStatus}
          modelReady={generatedGeometries.length > 0}
          sketchPreview={sketchPreview}
          onExportGLB={handleExportGLB}
          onExportOBJ={handleExportOBJ}
          vertexCount={vertexCount}
          faceCount={faceCount}
          onClearModel={handleReset}
          numberOfVariations={numberOfVariations}
          onNumberOfVariationsChange={setNumberOfVariations}
          generatedVariationsCount={generatedGeometries.length}
          selectedVariationIndex={selectedGeometryIndex}
          onSelectVariation={setSelectedGeometryIndex}
        />
        <Viewer geometry={selectedGeometry} isGenerating={isGenerating} modelRef={modelRef} />
      </main>
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg animate-fade-in">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
