// src/components/tryon/ModelRenderer.jsx
import React, { useRef, useEffect, Suspense } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Loading indicator component
function LoadingIndicator() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

// Main model renderer component
export default function ModelRenderer({ product, category, position }) {
  // Load the 3D model
  const gltf = useLoader(GLTFLoader, product.model);
  const modelRef = useRef();
  
  // Update model position based on detected landmarks
  useEffect(() => {
    if (modelRef.current && position) {
      // Position logic varies based on category
      if (category === 'earrings' && position.left && position.right) {
        // For earrings, we might need to use instancedMesh or duplicate the model
        // This is simplified for demonstration
        modelRef.current.position.set(position.center.x, position.center.y, position.center.z);
      } else if (category === 'necklaces' && position.position) {
        // Position the necklace
        modelRef.current.position.set(
          position.position.x,
          position.position.y,
          position.position.z
        );
        
        // Apply rotation if available
        if (position.rotation) {
          modelRef.current.rotation.z = position.rotation.z;
        }
        
        // Apply scale if available
        if (typeof position.scale === 'number') {
          modelRef.current.scale.set(position.scale, position.scale, position.scale);
        }
      } else if (category === 'dresses' && position.position) {
        // Position the dress
        modelRef.current.position.set(
          position.position.x,
          position.position.y,
          position.position.z
        );
        
        // Apply rotation if available
        if (position.rotation) {
          modelRef.current.rotation.z = position.rotation.z;
        }
        
        // Apply scale if available (x, y, z might be different)
        if (position.scale) {
          if (typeof position.scale === 'number') {
            modelRef.current.scale.set(position.scale, position.scale, position.scale);
          } else {
            modelRef.current.scale.set(
              position.scale.x || 1,
              position.scale.y || 1,
              position.scale.z || 1
            );
          }
        }
      }
    }
  }, [position, category]);

  // Optional: Add subtle animation for more realism
  useFrame((state, delta) => {
    if (modelRef.current) {
      // Add subtle breathing or movement animation
      if (category === 'necklaces') {
        modelRef.current.rotation.y += delta * 0.1; // Subtle rotation
      } else if (category === 'earrings') {
        // Subtle earring sway
        modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
      }
    }
  });

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <primitive 
        object={gltf.scene}
        ref={modelRef}
        scale={0.5} // Default scale, will be overridden by position data
      />
    </Suspense>
  );
}