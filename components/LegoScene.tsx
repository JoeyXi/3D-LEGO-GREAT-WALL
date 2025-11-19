import React, { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { generateLegoWorld } from '../utils/terrain';
import { SceneTime, BrickData } from '../types';

// Reusable Geometry
const brickGeometry = new THREE.BoxGeometry(1, 1.2, 1);
const studGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
studGeometry.translate(0, 0.725, 0); 

const legoMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.2,
  metalness: 0.0,
  envMapIntensity: 1.0,
});

interface LegoSceneProps {
  timeOfDay: SceneTime;
  onBrickSelect: (brick: BrickData | null) => void;
}

const InstancedBricks = ({ onBrickSelect }: { onBrickSelect: (b: BrickData | null) => void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const studRef = useRef<THREE.InstancedMesh>(null);
  
  // Interaction State
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const bricks = useMemo(() => generateLegoWorld(), []);

  // Initialize Meshes
  useLayoutEffect(() => {
    if (!meshRef.current || !studRef.current) return;

    const tempObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

    bricks.forEach((brick, i) => {
      tempObj.position.copy(brick.position);
      tempObj.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
      studRef.current!.setMatrixAt(i, tempObj.matrix);

      tempColor.set(brick.color);
      meshRef.current!.setColorAt(i, tempColor);
      studRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    studRef.current.instanceMatrix.needsUpdate = true;
    if (studRef.current.instanceColor) studRef.current.instanceColor.needsUpdate = true;
  }, [bricks]);

  // Handle Interaction Highlighting
  useLayoutEffect(() => {
    if (!meshRef.current || !studRef.current) return;
    
    // Reset all colors first (simplified approach: we could just reset previous hovered)
    // For performance in a large scene, ideally we only track the one that changed.
    // But here we just need to highlight the hovered one.
    
    if (hoveredId !== null) {
        const color = new THREE.Color();
        const highlightColor = new THREE.Color('#ffdd00'); // Golden highlight
        
        // Get original color
        meshRef.current.getColorAt(hoveredId, color);
        
        // Emissive effect simulation by just brightening
        // Note: InstancedMesh doesn't support per-instance emissive easily without custom shaders.
        // We will simply change the albedo to a bright yellow.
        
        meshRef.current.setColorAt(hoveredId, highlightColor);
        studRef.current.setColorAt(hoveredId, highlightColor);
        
        meshRef.current.instanceColor!.needsUpdate = true;
        studRef.current.instanceColor!.needsUpdate = true;

        return () => {
           // Cleanup: Restore color
           if (meshRef.current && hoveredId !== null && bricks[hoveredId]) {
               const original = new THREE.Color(bricks[hoveredId].color);
               meshRef.current.setColorAt(hoveredId, original);
               studRef.current?.setColorAt(hoveredId, original);
               if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
               if (studRef.current?.instanceColor) studRef.current.instanceColor.needsUpdate = true;
           }
        };
    }
  }, [hoveredId, bricks]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
        const brick = bricks[e.instanceId];
        onBrickSelect(brick);
    }
  }, [bricks, onBrickSelect]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
        setHoveredId(e.instanceId);
        // Change cursor
        document.body.style.cursor = 'pointer';
    }
  }, []);

  const handlePointerOut = useCallback(() => {
    setHoveredId(null);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group position={[0, -15, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[brickGeometry, legoMaterial, bricks.length]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      />
      <instancedMesh
        ref={studRef}
        args={[studGeometry, legoMaterial, bricks.length]}
        receiveShadow
        // Studs don't need separate interaction events, they follow the brick
      />
    </group>
  );
};

const Lighting = ({ timeOfDay }: { timeOfDay: SceneTime }) => {
  const isNight = timeOfDay === SceneTime.NIGHT;
  const isSunset = timeOfDay === SceneTime.SUNSET;

  const sunColor = isSunset ? '#ffaa00' : isNight ? '#8899ff' : '#fff5e0';
  const sunIntensity = isSunset ? 2.0 : isNight ? 0.5 : 2.5;
  
  const sunPos: [number, number, number] = isSunset 
    ? [-80, 30, -20] 
    : isNight 
      ? [50, 80, 50] 
      : [80, 60, 50];

  return (
    <>
      <Environment 
        preset={isNight ? 'city' : isSunset ? 'sunset' : 'park'} 
        background={false}
        blur={0.5}
      />
      <ambientLight intensity={isNight ? 0.1 : 0.3} color={isNight ? "#111133" : "#ccccff"} />
      <directionalLight 
        position={sunPos} 
        intensity={sunIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        color={sunColor}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} far={300} />
      </directionalLight>
      <spotLight 
        position={[-100, 80, -100]} 
        intensity={isSunset ? 1.5 : 0.5} 
        color={isSunset ? "#ff6600" : "#ffffff"}
        angle={0.5}
        penumbra={1}
      />
    </>
  );
};

export const LegoScene: React.FC<LegoSceneProps> = ({ timeOfDay, onBrickSelect }) => {
  const bgColor = timeOfDay === SceneTime.NIGHT ? '#050510' : 
                  timeOfDay === SceneTime.SUNSET ? '#5D2E1F' : '#87CEEB';

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]} 
      camera={{ position: [-40, 40, 60], fov: 40 }} 
      gl={{ 
        antialias: true, 
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0
      }}
      onPointerMissed={() => onBrickSelect(null)} // Deselect on click BG
    >
      <color attach="background" args={[bgColor]} />
      <Lighting timeOfDay={timeOfDay} />
      <SoftShadows size={10} samples={8} focus={0} />
      
      <InstancedBricks onBrickSelect={onBrickSelect} />
      
      <fog attach="fog" args={[bgColor, 50, 200]} />
      <OrbitControls 
        minDistance={20} 
        maxDistance={150} 
        maxPolarAngle={Math.PI / 2 - 0.1} 
        enableDamping={true}
        target={[0, 5, 0]}
      />
    </Canvas>
  );
};
