// src/components/tryon/RingModel.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getRingPosition, determineHandedness, getHandOrientation } from '../../lib/utils/handPositioning';

// Ring model component for hand try-on
export default function RingModel({ 
  modelPath, 
  handLandmarks, 
  videoWidth, 
  videoHeight,
  fingerIndex = 3, // Default to ring finger
  preferredHand = 'left' // Default to left hand
}) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  const { scene } = useGLTF(modelPath);
    console.log("Model loaded from:", modelPath, scene);
  
  // Set model as loaded when GLTF is available
  useEffect(() => {
    if (gltf) {
      setModelLoaded(true);
      console.log('Model loaded:', gltf);
    }

  }, [gltf]);
  
  // Apply ring positioning based on hand landmarks
  useEffect(() => {
    if (!modelRef.current || !handLandmarks || !modelLoaded) return;
    console.log("Attempting to position model on hand landmarks:", handLandmarks);
    // Determine which hand (left or right) is in frame
    const handedness = determineHandedness(handLandmarks);
    
    // Only position the ring on the preferred hand if available
    if (handedness !== preferredHand && handLandmarks.length > 1) {
      // If we have multiple hands detected, find the preferred one
      const preferredHandData = handLandmarks.find(
        hand => hand.handedness === preferredHand
      );
      
      if (preferredHandData) {
        applyRingPosition(preferredHandData);
      } else {
        // If preferred hand not found, use whatever is available
        applyRingPosition(handLandmarks[0]);
      }
    } else {
      // Only one hand detected, use it regardless of preference
      applyRingPosition(handLandmarks[0]);
    }
  }, [handLandmarks, modelLoaded, preferredHand, fingerIndex, videoWidth, videoHeight]);
  
  // Apply position, rotation, and scale to the ring model
  const applyRingPosition = (handData) => {
    if (!handData || !modelRef.current) return;
    
    // Get ring position data based on finger landmarks
    const ringPosition = getRingPosition(
      handData, 
      videoWidth, 
      videoHeight, 
      fingerIndex
    );
    
    if (!ringPosition) return;
    
    // Apply position to the ring model
    modelRef.current.position.set(
      ringPosition.position.x,
      ringPosition.position.y,
      ringPosition.position.z
    );
    
    // Apply rotation
    modelRef.current.rotation.set(
      ringPosition.rotation.x,
      ringPosition.rotation.y,
      ringPosition.rotation.z
    );
    
    // Apply scale - different rings may need different scaling factors
    const scaleFactor = typeof ringPosition.scale === 'number' 
      ? ringPosition.scale 
      : 0.5;
    
    modelRef.current.scale.set(
      scaleFactor,
      scaleFactor,
      scaleFactor
    );
    
    // Adjust additional properties based on hand orientation
    const orientation = getHandOrientation(handData);
    if (orientation) {
      // Make adjustments based on palm orientation
      switch (orientation) {
        case 'palm_up':
          // Rotate ring to face upward
          modelRef.current.rotation.x += Math.PI;
          break;
        case 'palm_down':
          // Default orientation usually works for palm down
          break;
        case 'palm_forward':
        case 'palm_backward':
          // Adjust for side views of the hand
          modelRef.current.rotation.z += Math.PI / 2;
          break;
        default:
          // No additional adjustments for other orientations
          break;
      }
    }
  };
  
  // Optional: Add subtle animation for more realism
  useFrame((state, delta) => {
    if (modelRef.current && !handLandmarks) {
      // If no hand landmarks are detected, apply a subtle floating animation
      // This makes the ring look more interesting when not on a finger
      modelRef.current.rotation.y += delta * 0.5;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <>
    {/* Test cube instead of the GLB model */}
    <mesh 
      ref={modelRef}
      position={[0, 0, 0]} // Start at center
      scale={[0.5, 0.5, 0.5]} // Make it visible
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
    
    {/* Add a debug light to make it visible */}
    <pointLight position={[0, 0, 2]} intensity={1} />
  </>
  );
}