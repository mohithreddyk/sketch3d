
import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, PresentationControls, Html, Grid, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import type { PipelineStatus } from '../types';

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[]; uvs?: number[] } | null;
  isGenerating: boolean;
  pipelineStatus: PipelineStatus;
  modelRef: React.RefObject<THREE.Group>;
}

interface GeneratedModelProps {
  geometryData: { vertices: number[]; faces: number[]; uvs?: number[] };
}
const GeneratedModel = forwardRef<THREE.Group, GeneratedModelProps>(({ geometryData }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [visibleGeometry, setVisibleGeometry] = useState(geometryData);

    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setVisibleGeometry(geometryData);
            setIsTransitioning(false);
        }, 300); // Corresponds to fade out duration
        return () => clearTimeout(timer);
    }, [geometryData]);

    const geometry = useMemo(() => {
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(visibleGeometry.vertices, 3));
            if (visibleGeometry.uvs) {
                geo.setAttribute('uv', new THREE.Float32BufferAttribute(visibleGeometry.uvs, 2));
            }
            geo.setIndex(visibleGeometry.faces);
            geo.computeVertexNormals();
            geo.center();
            return geo;
        } catch (e) {
            console.error("Failed to create geometry from provided data:", e);
            return null;
        }
    }, [visibleGeometry]);
    
    useFrame(() => {
      if (meshRef.current) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = THREE.MathUtils.lerp(material.opacity, isTransitioning ? 0 : 1, 0.1);
        material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, hovered ? 0.5 : 0, 0.1);
      }
    });

    return (
        <group ref={ref}>
            {geometry && (
                 <mesh 
                    ref={meshRef}
                    geometry={geometry}
                    castShadow
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                 >
                    <meshStandardMaterial 
                        color="#39FF14"
                        roughness={0.4} 
                        metalness={0.2}
                        emissive="#39FF14"
                        emissiveIntensity={0}
                        transparent
                        opacity={0}
                        polygonOffset
                        polygonOffsetFactor={1}
                        polygonOffsetUnits={1}
                    />
                </mesh>
            )}
        </group>
    );
});
GeneratedModel.displayName = 'GeneratedModel';


const Loader: React.FC<{ status: PipelineStatus }> = ({ status }) => {
    return (
        <Html center>
            <div className="text-center text-brand-primary bg-base-100/80 p-8 rounded-lg backdrop-blur-md w-64">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
                <p className="mt-4 text-lg font-bold animate-pulse">{status.currentStage || 'Initializing...'}</p>
                <p className="text-sm text-content-muted">AI is processing the sketch</p>
            </div>
        </Html>
    );
}

const Placeholder: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <Icosahedron ref={meshRef} args={[1, 0]} scale={0.8}>
            <meshStandardMaterial wireframe color="#1A1F44" roughness={0.5} />
        </Icosahedron>
    )
}

export const Viewer: React.FC<ViewerProps> = ({ geometry, isGenerating, pipelineStatus, modelRef }) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5] }}>
        <color attach="background" args={['#050816']} />
        <Suspense fallback={null}>
            <PresentationControls speed={1.5} global zoom={0.8} polar={[-Math.PI / 3, Math.PI / 3]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
                <Stage environment="city" intensity={0.5} shadows={false}>
                    {geometry && !isGenerating && <GeneratedModel geometryData={geometry} ref={modelRef} />}
                    {!geometry && !isGenerating && <Placeholder />}
                </Stage>
            </PresentationControls>
            <Grid
                position={[0, -1, 0]}
                args={[10, 10]}
                infiniteGrid
                fadeDistance={25}
                fadeStrength={4}
                cellSize={1}
                sectionSize={5}
                cellColor="#1A1F44"
                sectionColor="#39FF14"
                cellThickness={0.5}
                sectionThickness={1.5}
            />
            <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.5} />
        </Suspense>
        {isGenerating && <Loader status={pipelineStatus} />}
      </Canvas>
      {!geometry && !isGenerating && (
        <div className="absolute bottom-1/4 left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 max-w-sm animate-fade-in">
            <h2 className="text-2xl font-bold tracking-widest">3D VIEWPORT</h2>
            <p className="text-content-muted mt-2">Upload or draw a sketch to begin.</p>
          </div>
        </div>
      )}
    </div>
  );
};
