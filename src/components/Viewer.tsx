import React, { Suspense, useRef, forwardRef, useMemo } from 'react';
// Fix: Added extend to imports to manually register three.js components
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stage, PresentationControls, Html } from '@react-three/drei';
// Fix: Changed Mesh type import to a namespace import to avoid conflicts
import * as THREE from 'three';

// Fix: Manually extend react-three-fiber with necessary three.js components
// This resolves the 'Property does not exist on type JSX.IntrinsicElements' errors.
// Removed IcosahedronGeometry as it's no longer used.
extend({
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  Color: THREE.Color,
})

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[] } | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
}

// Fix: Created a new component to render the dynamically generated model
interface GeneratedModelProps {
  geometryData: { vertices: number[]; faces: number[] };
}
const GeneratedModel = forwardRef<THREE.Group, GeneratedModelProps>(({ geometryData }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    
    const geometry = useMemo(() => {
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.vertices, 3));
            geo.setIndex(geometryData.faces);
            geo.computeVertexNormals();
            geo.center(); // Center the geometry for better viewing
            return geo;
        } catch (e) {
            console.error("Failed to create geometry from provided data:", e);
            return null; // Return null if geometry creation fails
        }
    }, [geometryData]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    if (!geometry) {
        return null; // Don't render if geometry is invalid
    }

    return (
        <group ref={ref}>
            <mesh ref={meshRef} geometry={geometry} castShadow>
                <meshStandardMaterial color="#00A9FF" roughness={0.3} metalness={0.1} />
            </mesh>
        </group>
    );
});
GeneratedModel.displayName = 'GeneratedModel';


const Loader: React.FC = () => {
    return (
        <Html center>
            <div className="text-content text-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
                <p className="mt-4 text-lg">Generating 3D model...</p>
                <p className="text-sm text-gray-400">The AI is hard at work</p>
            </div>
        </Html>
    );
}


export const Viewer: React.FC<ViewerProps> = ({ geometry, isGenerating, modelRef }) => {
  return (
    <div className="flex-1 bg-black relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
        <color attach="background" args={['#1E293B']} />
        <Suspense fallback={<Loader />}>
            <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                {/* Fix: Replaced invalid `contactShadow` prop with `shadows` to control contact shadows. */}
                <Stage environment="city" intensity={0.6} shadows={false}>
                    {geometry && !isGenerating && <GeneratedModel geometryData={geometry} ref={modelRef} />}
                </Stage>
            </PresentationControls>
        </Suspense>
        <OrbitControls />
      </Canvas>
      {!geometry && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-base-200/50 rounded-lg backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Your 3D Model Will Appear Here</h2>
            <p className="text-gray-400 mt-2">Upload a sketch and click "Generate" to begin.</p>
          </div>
        </div>
      )}
      {isGenerating && <Loader />}
    </div>
  );
};