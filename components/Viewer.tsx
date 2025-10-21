import React, { Suspense, forwardRef, useMemo } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, Stage, PresentationControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { GridIcon } from './icons/GridIcon';

extend({
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  Color: THREE.Color,
});

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[] } | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
}

interface GeneratedModelProps {
  geometryData: { vertices: number[]; faces: number[] };
}
const GeneratedModel = forwardRef<THREE.Group, GeneratedModelProps>(({ geometryData }, ref) => {
    const geometry = useMemo(() => {
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.vertices, 3));
            geo.setIndex(geometryData.faces);
            geo.computeVertexNormals();
            geo.center();
            return geo;
        } catch (e) {
            console.error("Failed to create geometry from provided data:", e);
            return null;
        }
    }, [geometryData]);

    return (
        <group ref={ref}>
            {geometry && (
                 <mesh geometry={geometry} castShadow>
                    <meshStandardMaterial color="#39FF14" roughness={0.4} metalness={0.2} emissive="#000000" />
                </mesh>
            )}
        </group>
    );
});
GeneratedModel.displayName = 'GeneratedModel';


const Loader: React.FC = () => {
    return (
        <Html center>
            <div className="text-center text-brand-primary bg-base-100/80 p-8 rounded-lg backdrop-blur-md">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
                <p className="mt-4 text-lg font-bold">GENERATING MODEL...</p>
                <p className="text-sm text-content-muted">AI is processing the sketch</p>
            </div>
        </Html>
    );
}

export const Viewer: React.FC<ViewerProps> = ({ geometry, isGenerating, modelRef }) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5] }}>
        <color attach="background" args={['#050816']} />
        <Suspense fallback={null}>
            <PresentationControls speed={1.5} global zoom={0.8} polar={[-Math.PI / 3, Math.PI / 3]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
                <Stage environment="city" intensity={0.5} shadows={false}>
                    {geometry && !isGenerating && <GeneratedModel geometryData={geometry} ref={modelRef} />}
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
        {isGenerating && <Loader />}
      </Canvas>
      {!geometry && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 max-w-sm animate-fade-in">
            <GridIcon className="w-24 h-24 text-base-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold tracking-widest">3D VIEWPORT</h2>
            <p className="text-content-muted mt-2">Upload a sketch to begin AI model generation.</p>
          </div>
        </div>
      )}
    </div>
  );
};