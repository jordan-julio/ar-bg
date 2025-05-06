// src/components/tryon/RingModel.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getRingPosition } from '../../lib/utils/handPositioning';

// Simplified Ring Model Component that doesn't depend on external 3D files
export default function RingModel({ 
  handLandmarks, 
  videoSize,
  fingerIndex = 3, 
  preferredHand = 'left' 
}) {
  const ringRef = useRef();
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(0.3);
  
  // Update ring position based on hand landmarks
  useEffect(() => {
    if (!handLandmarks || !handLandmarks.keypoints || handLandmarks.keypoints.length === 0) return;
    
    console.log("Received hand landmarks", handLandmarks);
    
    // Process hand landmarks to position ring
    const ringPosition = getRingPosition(
      handLandmarks,
      videoSize.width || 640,
      videoSize.height || 480,
      fingerIndex
    );
    
    if (ringPosition) {
      console.log("Ring positioned at:", ringPosition);
      setPosition(ringPosition.position);
      setRotation(ringPosition.rotation);
      setScale(ringPosition.scale * 0.1); // Scale factor to make ring appropriate size
    }
  }, [handLandmarks, videoSize, fingerIndex, preferredHand]);
  
  // Optional: Add subtle animation
  useFrame((state, delta) => {
    if (ringRef.current && !handLandmarks) {
      // Animation when no hand is detected
      ringRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* Debug sphere to verify proper rendering */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Actual ring using torus geometry */}
      <mesh 
        ref={ringRef}
        position={[position.x, position.y, position.z]}
        rotation={[rotation.x, rotation.y, rotation.z]}
        scale={[scale, scale, scale]}
      >
        <torusGeometry args={[1, 0.3, 16, 32]} />
        <meshStandardMaterial 
          color="gold" 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>
      
      {/* Position debug line */}
      {handLandmarks && (
        <line>
          <bufferGeometry attach="geometry">
            <bufferAttribute 
              attachObject={['attributes', 'position']}
              count={2}
              array={new Float32Array([0, 0, 0, position.x, position.y, position.z])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="blue" />
        </line>
      )}
    </group>
  );
}