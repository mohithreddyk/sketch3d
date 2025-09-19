import React, { useState, useRef } from 'react';
// Fix: Import Gemini API client and types
import { GoogleGenAI, Type } from "@google/genai";
import * as THREE from 'three';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { Viewer } from './components/Viewer';
import type { PipelineStatus } from './types';
import { PipelineStage } from './types';

// Fix: Define type for generated geometry data
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
  // Fix: Replaced key-based model state with state to hold actual geometry data
  const [generatedGeometry, setGeneratedGeometry] = useState<GeneratedGeometry | null>(null);
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
      // Reset on new file upload
      handleReset();
    }
  };

  // Fix: Helper function to convert a File object to a Gemini GenerativePart
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

  // Fix: Replaced simulated generation with a real call to the Gemini API
  const handleGeneration = async () => {
    if (!sketchFile) {
      setError("Please upload a sketch first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedGeometry(null); // Hide old model
    
    const stages = [
      PipelineStage.SKETCH_PREP,
      PipelineStage.MESH_PREP,
      PipelineStage.PAIRING,
      PipelineStage.TRAINING,
      PipelineStage.OUTPUT,
    ];

    const newCompletedStages = new Set<PipelineStage>();

    try {
      for (const stage of stages) {
        setPipelineStatus({ currentStage: stage, completedStages: new Set(newCompletedStages) });
        
        if (stage === PipelineStage.OUTPUT) {
          // Actual Gemini call to generate 3D model geometry
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
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: [
                      imagePart,
                      { text: 'Analyze this sketch and generate a simple 3D mesh representing it. The mesh should be centered at the origin and scaled to fit within a 2x2x2 cube. Provide vertices and faces according to the schema.' }
                  ]
              },
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: schema,
                  temperature: 0.2,
              }
          });
          
          const resultJson = JSON.parse(response.text.trim());
          setGeneratedGeometry(resultJson);

        } else {
          // Simulate work for other stages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        newCompletedStages.add(stage);
      }
      
      setPipelineStatus({ currentStage: null, completedStages: newCompletedStages });
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
    setGeneratedGeometry(null);
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
    // In a real application with the 'three' package installed, the code would be:
    // import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
    // const exporter = new GLTFExporter();
    // exporter.parse(modelRef.current, (result) => {
    //   if (result instanceof ArrayBuffer) {
    //     const blob = new Blob([result], { type: 'application/octet-stream' });
    //     saveFile(blob, 'model.glb');
    //   }
    // }, { binary: true });
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

    // vertices
    for (let i = 0; i < position.count; i++) {
        output += `v ${position.getX(i).toFixed(6)} ${position.getY(i).toFixed(6)} ${position.getZ(i).toFixed(6)}\n`;
    }

    // faces
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            // OBJ indices are 1-based
            output += `f ${index.getX(i) + 1} ${index.getY(i) + 1} ${index.getZ(i) + 1}\n`;
        }
    } else {
        // For non-indexed geometries
        for (let i = 0; i < position.count; i += 3) {
            output += `f ${i + 1} ${i + 2} ${i + 3}\n`;
        }
    }

    const blob = new Blob([output], { type: 'text/plain' });
    saveFile(blob, 'model.obj');
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-base-100 text-content antialiased">
      <Header />
      <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <ControlPanel
          onFileChange={handleFileChange}
          onGenerate={handleGeneration}
          isGenerating={isGenerating}
          pipelineStatus={pipelineStatus}
          modelReady={generatedGeometry !== null}
          sketchPreview={sketchPreview}
          onExportGLB={handleExportGLB}
          onExportOBJ={handleExportOBJ}
        />
        <Viewer geometry={generatedGeometry} isGenerating={isGenerating} modelRef={modelRef} />
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
