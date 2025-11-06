
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as THREE from 'three';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { Viewer } from './components/Viewer';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { Toast } from './components/Toast';
import { DrawingCanvas } from './components/DrawingCanvas';
import type { PipelineStatus } from './types';
import { PipelineStage } from './types';

type GeneratedGeometry = {
  vertices: number[];
  faces: number[];
  uvs?: number[];
  accuracyScore?: number;
  accuracyJustification?: string;
};

export type WorkflowStep = 'upload' | 'generating' | 'results';
type AuthScreen = 'login' | 'signup';
export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    currentStage: null,
    completedStages: new Set(),
  });
  const [generatedGeometries, setGeneratedGeometries] = useState<GeneratedGeometry[]>([]);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [numberOfVariations, setNumberOfVariations] = useState<number>(3);
  const [generateUVs, setGenerateUVs] = useState<boolean>(false);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-2.5-pro');
  const [creativityLevel, setCreativityLevel] = useState<number>(20); // 0-100, maps to temperature
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
      handleResetVariations();
      setWorkflowStep('generating');
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

  const fetchAndSetAccuracy = async (geometries: GeneratedGeometry[], sketch: File) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const accuracySchema = {
            type: Type.OBJECT,
            properties: {
                accuracyScore: { type: Type.INTEGER, description: 'A percentage score (0-100) of how well the 3D model matches the sketch.' },
                accuracyJustification: { type: Type.STRING, description: 'A brief, one-sentence justification for the score.' }
            },
            required: ['accuracyScore', 'accuracyJustification']
        };
        const imagePart = await fileToGenerativePart(sketch);

        const accuracyPromises = geometries.map(geo => {
            const modelDataString = JSON.stringify({ vertices: geo.vertices, faces: geo.faces });
            const prompt = `Given the user's original 2D sketch and the following generated 3D model data, evaluate the accuracy. How well does the 3D model represent the visual information in the sketch? Provide a percentage score and a brief justification.\n\n3D Model Data:\n${modelDataString}`;
            
            return ai.models.generateContent({
                model: 'gemini-2.5-flash', // Use flash for speed on this secondary task
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: accuracySchema,
                    temperature: 0.1 // Low temp for deterministic evaluation
                }
            });
        });

        const accuracyResponses = await Promise.all(accuracyPromises);

        const updatedGeometries = geometries.map((geo, index) => {
            try {
                const response = accuracyResponses[index];
                const accuracyData = JSON.parse(response.text.trim());
                return {
                    ...geo,
                    accuracyScore: accuracyData.accuracyScore,
                    accuracyJustification: accuracyData.accuracyJustification,
                };
            } catch (e) {
                console.error('Failed to parse accuracy data for variation', index, e);
                return geo; // Return original geometry if parsing fails
            }
        });

        setGeneratedGeometries(updatedGeometries);
    } catch (e) {
        console.error("Could not fetch accuracy scores:", e);
        // Fail gracefully, don't show an error to the user for this optional feature.
    }
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
    setWorkflowStep('generating');
    
    setPipelineStatus({ currentStage: PipelineStage.SKETCH_PREP, completedStages: new Set() });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const schema = {
          type: Type.OBJECT,
          properties: {
              vertices: { type: Type.ARRAY, description: 'Flat array of vertex coordinates [x1, y1, z1, ...].', items: { type: Type.NUMBER } },
              faces: { type: Type.ARRAY, description: 'Flat array of vertex indices for triangular faces [f1_v1, f1_v2, f1_v3, ...].', items: { type: Type.INTEGER } },
              uvs: { type: Type.ARRAY, description: 'Optional flat array of UV coordinates for texture mapping [u1, v1, u2, v2, ...].', items: { type: Type.NUMBER } }
          },
          required: ['vertices', 'faces']
      };

      const userDescription = textPrompt.trim()
        ? `The user is sketching the following concept: "${textPrompt.trim()}". `
        : '';

      let baseInstruction = 'Based on the user\'s sketch (and description, if provided), convert it into a detailed, high-quality 3D mesh. Provide the output in JSON format with vertex coordinates and triangular face indices.';

      if (generateUVs) {
        baseInstruction += ' Additionally, generate well-laid-out UV coordinates for texture mapping.';
      }
      
      const finalPrompt = userDescription + baseInstruction;
      const imagePart = await fileToGenerativePart(sketchFile);
      
      const updateStage = (stage: PipelineStage) => setPipelineStatus(prev => ({ ...prev, completedStages: new Set([...prev.completedStages, prev.currentStage!]), currentStage: stage }));
      
      updateStage(PipelineStage.PAIRING);

      // Map creativity slider (0-100) to temperature (0.1 - 1.0)
      // Lower creativity = lower temperature = more deterministic/accurate
      const temperature = 0.1 + (creativityLevel / 100) * 0.9;
      
      const generationPromises = Array.from({ length: numberOfVariations }, () => 
        ai.models.generateContent({
          model: selectedModel,
          contents: { parts: [ imagePart, { text: finalPrompt } ] },
          config: {
              systemInstruction: 'You are an expert 3D modeling AI. Your task is to interpret a 2D sketch and generate a high-fidelity, topologically sound, manifold 3D mesh. The output must be clean, with no intersecting faces or non-manifold geometry. Prioritize accuracy and detail to create a model suitable for 3D printing or use in a game engine. The coordinate system is right-handed Y-up.',
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature: temperature,
          }
        })
      );
      
      updateStage(PipelineStage.TRAINING);
      const responses = await Promise.all(generationPromises);

      updateStage(PipelineStage.OUTPUT);
      const geometries = responses.map(response => {
        try {
            const text = response.text?.trim();
            return text ? JSON.parse(text) : null;
        } catch (e) {
            console.error('Failed to parse JSON for one variation:', response.text, e);
            return null;
        }
      }).filter((g): g is GeneratedGeometry => g !== null);

      if (geometries.length === 0) throw new Error("The model failed to generate valid 3D data. Try a different sketch.");
      
      setGeneratedGeometries(geometries); // First update to show models immediately
      setSelectedGeometryIndex(0);
      setWorkflowStep('results');
      setPipelineStatus({ currentStage: null, completedStages: new Set(Object.values(PipelineStage)) });
      
      // Asynchronously fetch accuracy without blocking the UI
      fetchAndSetAccuracy(geometries, sketchFile);

    } catch (e) {
      console.error(e);
      setError(`Generation Error: ${e instanceof Error ? e.message : String(e)}`);
      setPipelineStatus({ currentStage: null, completedStages: new Set() });
      setWorkflowStep(sketchFile ? 'generating' : 'upload');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = useCallback(() => {
    setSketchFile(null);
    setSketchPreview(null);
    setWorkflowStep('upload');
    handleResetVariations();
  }, []);

  const handleResetVariations = useCallback(() => {
    setIsGenerating(false);
    setPipelineStatus({ currentStage: null, completedStages: new Set() });
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setError(null);
    setTextPrompt('');
    if (sketchFile) {
      setWorkflowStep('generating');
    }
  }, [sketchFile]);

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

  const handleExportOBJ = () => {
    if (!modelRef.current) return setError("Error: Model reference not found.");
    let mesh: THREE.Mesh | null = null;
    modelRef.current.traverse((child) => { if (child instanceof THREE.Mesh) mesh = child; });

    if (!mesh || !(mesh.geometry instanceof THREE.BufferGeometry)) return setError("Error: No exportable mesh found.");

    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const idx = geo.index;
    
    let output = '# Generated by Sketch-to-3D Mesh AI\n';
    
    for (let i = 0; i < pos.count; i++) {
        output += `v ${pos.getX(i).toFixed(6)} ${pos.getY(i).toFixed(6)} ${pos.getZ(i).toFixed(6)}\n`;
    }
    
    if (uv) {
        for (let i = 0; i < uv.count; i++) {
            output += `vt ${uv.getX(i).toFixed(6)} ${uv.getY(i).toFixed(6)}\n`;
        }
    }

    if (idx) {
        for (let i = 0; i < idx.count; i += 3) {
            const i1 = idx.getX(i) + 1;
            const i2 = idx.getY(i) + 1;
            const i3 = idx.getZ(i) + 1;
            if (uv) {
                output += `f ${i1}/${i1} ${i2}/${i2} ${i3}/${i3}\n`;
            } else {
                output += `f ${i1} ${i2} ${i3}\n`;
            }
        }
    } else {
        for (let i = 0; i < pos.count; i += 3) {
             const i1 = i + 1;
             const i2 = i + 2;
             const i3 = i + 3;
            if (uv) {
                output += `f ${i1}/${i1} ${i2}/${i2} ${i3}/${i3}\n`;
            } else {
                 output += `f ${i1} ${i2} ${i3}\n`;
            }
        }
    }

    saveFile(new Blob([output], { type: 'text/plain' }), `model_variation_${(selectedGeometryIndex ?? 0) + 1}.obj`);
  };

  const handleLogin = () => setIsAuthenticated(true);
  const navigateToSignUp = () => setAuthScreen('signup');
  const navigateToLogin = () => setAuthScreen('login');
  
  const handleToggleDrawing = () => setIsDrawing(prev => !prev);
  
  const handleDrawingComplete = (file: File) => {
    handleFileChange(file);
    setIsDrawing(false);
  };

  const selectedGeometry = selectedGeometryIndex !== null ? generatedGeometries[selectedGeometryIndex] : null;

  if (!isAuthenticated) {
    if (authScreen === 'login') return <LoginPage onLogin={handleLogin} onNavigateToSignUp={navigateToSignUp} />;
    return <SignUpPage onNavigateToLogin={navigateToLogin} onSignUpSuccess={handleLogin}/>;
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-base-100 text-content antialiased">
      <Header />
      {isDrawing && <DrawingCanvas onComplete={handleDrawingComplete} onCancel={handleToggleDrawing} />}
      <main className="flex-1 relative">
        <Viewer 
          geometry={selectedGeometry} 
          isGenerating={isGenerating}
          pipelineStatus={pipelineStatus}
          modelRef={modelRef} 
        />
        <ControlBar
          onFileChange={handleFileChange}
          onGenerate={handleGeneration}
          onToggleDrawing={handleToggleDrawing}
          isGenerating={isGenerating}
          pipelineStatus={pipelineStatus}
          sketchPreview={sketchPreview}
          onExportOBJ={handleExportOBJ}
          onResetVariations={handleResetVariations}
          onStartOver={handleStartOver}
          numberOfVariations={numberOfVariations}
          onNumberOfVariationsChange={setNumberOfVariations}
          generateUVs={generateUVs}
          onGenerateUVsChange={setGenerateUVs}
          textPrompt={textPrompt}
          onTextPromptChange={setTextPrompt}
          selectedModel={selectedModel}
          onSelectedModelChange={setSelectedModel}
          creativityLevel={creativityLevel}
          onCreativityLevelChange={setCreativityLevel}
          generatedGeometries={generatedGeometries}
          selectedVariationIndex={selectedGeometryIndex}
          onSelectVariation={setSelectedGeometryIndex}
          workflowStep={workflowStep}
        />
      </main>
      <Toast message={error} onDismiss={() => setError(null)} />
    </div>
  );
};

export default App;
