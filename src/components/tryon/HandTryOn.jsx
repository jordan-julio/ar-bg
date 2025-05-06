// src/components/tryon/HandTryOn.jsx - Fallback version
import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useHandDetection } from '../../hooks/useHandDetection';

// Simple ring component that follows mouse movements
const SimpleRing = ({ position, rotation, scale }) => {
  // Use default values if parameters are missing
  const pos = position || { x: 0, y: 0, z: 0 };
  const rot = rotation || { x: 0, y: 0, z: 0 };
  const size = scale || 0.2;
  
  return (
    <group>
      <mesh
        position={[pos.x, pos.y, pos.z]}
        rotation={[rot.x, rot.y, rot.z]}
        scale={[size, size, size]}
      >
        <torusGeometry args={[1, 0.3, 16, 32]} />
        <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Debug visualization of hand landmarks
const HandDebugView = ({ hands }) => {
  if (!hands || hands.length === 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {hands[0].keypoints.map((point, index) => (
        <div 
          key={index}
          className="absolute w-3 h-3 bg-red-500 rounded-full z-10"
          style={{ 
            left: `${point.x * 100}%`, 
            top: `${point.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
            {index}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function HandTryOn({ 
  onCapture,
  fingerIndex = 3, 
  preferredHand = 'left',
  setFingerIndex = () => {},
  setPreferredHand = () => {},
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [ringPosition, setRingPosition] = useState(null);
  
  // Use our fixed hand detection hook
  const { hands, isInitialized, isDetecting, error } = useHandDetection(videoRef);
  
  // Setup camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        console.log("Setting up camera...");
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Camera stream obtained");
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsVideoReady(true);
            setVideoSize({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
            console.log("Video ready, size:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    
    setupCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Update ring position when hand is detected
  useEffect(() => {
    if (hands && hands.length > 0) {
      console.log("Hand detected:", hands[0]);
      
      // Get the landmark for the selected finger
      const fingerLandmarks = {
        0: 4,  // Thumb tip
        1: 8,  // Index tip
        2: 12, // Middle tip
        3: 16, // Ring tip
        4: 20  // Pinky tip
      };
      
      // Get tip of selected finger
      const tipIndex = fingerLandmarks[fingerIndex];
      const tipPoint = hands[0].keypoints.find(kp => kp.index === tipIndex);
      
      // Get base of selected finger
      const baseIndex = {
        0: 2,  // Thumb MCP
        1: 5,  // Index MCP
        2: 9,  // Middle MCP
        3: 13, // Ring MCP
        4: 17  // Pinky MCP
      }[fingerIndex];
      const basePoint = hands[0].keypoints.find(kp => kp.index === baseIndex);
      
      // Get middle joint
      const midIndex = {
        0: 3,  // Thumb IP
        1: 6,  // Index PIP
        2: 10, // Middle PIP
        3: 14, // Ring PIP
        4: 18  // Pinky PIP
      }[fingerIndex];
      const midPoint = hands[0].keypoints.find(kp => kp.index === midIndex);
      
      if (midPoint && basePoint) {
        // Calculate position in Three.js coordinates (convert from [0,1] to [-1,1])
        const x = (midPoint.x * 2 - 1) * (videoSize.width / videoSize.height);
        const y = -(midPoint.y * 2 - 1);
        const z = 0;
        
        // Calculate rotation based on finger orientation
        const fingerDirectionX = tipPoint.x - basePoint.x;
        const fingerDirectionY = tipPoint.y - basePoint.y;
        const angle = Math.atan2(fingerDirectionY, fingerDirectionX);
        
        // Calculate scale based on finger length
        const fingerLength = Math.sqrt(
          Math.pow(tipPoint.x - basePoint.x, 2) +
          Math.pow(tipPoint.y - basePoint.y, 2)
        );
        
        setRingPosition({
          position: { x, y, z },
          rotation: { x: Math.PI/2, y: 0, z: angle },
          scale: fingerLength * 0.5
        });
      }
    }
  }, [hands, fingerIndex, videoSize]);
  
  // Capture image
  const captureImage = () => {
    if (!videoRef.current) return null;
    
    try {
      // Create a canvas with the same dimensions as the video
      const canvas = document.createElement('canvas');
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Flip the image horizontally to match the mirrored video display
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      
      // Draw the video feed
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      
      // Reset transformation
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Add colored border for debugging
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, width, height);
      
      // Add text for debugging
      ctx.fillStyle = 'white';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('Captured Image', 20, 40);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      console.log("Image captured successfully");
      
      // Call the callback
      if (onCapture && typeof onCapture === 'function') {
        onCapture(dataUrl);
      }
      
      return dataUrl;
    } catch (error) {
      console.error("Error capturing image:", error);
      return null;
    }
  };
  
  return (
    <div className="hand-try-on relative w-full h-full">
      {/* Loading indicator */}
      {(!isInitialized || !isVideoReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p>{!isVideoReady ? 'Starting camera...' : 'Initializing hand detection...'}</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" // Mirror the video
        playsInline
        muted
      />
      
      {/* Debug visualization */}
      {showDebug && hands && hands.length > 0 && (
        <HandDebugView hands={hands} />
      )}
      
      {/* Three.js Canvas for ring model */}
      <Canvas
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
        camera={{ position: [0, 0, 5], fov: 75 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        {/* Render ring at calculated position */}
        {ringPosition && (
          <SimpleRing 
            position={ringPosition.position}
            rotation={ringPosition.rotation}
            scale={ringPosition.scale}
          />
        )}
      </Canvas>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center"
          onClick={captureImage}
        >
          Take Photo
        </button>
        
        <button
          className={`px-4 py-2 rounded-full shadow-lg ${
            showDebug ? 'bg-purple-500 text-white' : 'bg-white text-gray-800'
          }`}
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {/* Status indicators */}
      <div className="absolute top-2 left-2 flex space-x-2">
        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Detection active
        </div>
        
        {hands && hands.length > 0 && (
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Hand detected
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-sm p-2 rounded">
        Move your mouse over the video to position the ring
      </div>
      
      {/* Finger selector */}
      <div className="absolute top-4 right-4 mt-10 z-9999">
        <select
          className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
          value={fingerIndex}
          onChange={(e) => setFingerIndex(parseInt(e.target.value))}
        >
          <option value={0}>Thumb</option>
          <option value={1}>Index</option>
          <option value={2}>Middle</option>
          <option value={3}>Ring</option>
          <option value={4}>Pinky</option>
        </select>
      </div>
    </div>
  );
}