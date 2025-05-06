// src/components/tryon/HandTryOn.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useHandDetection } from '../../hooks/useHandDetection';
import RingModel from './RingModel';

export default function HandTryOn({ 
  product, 
  onCapture,
  isActive = true,
  fingerIndex = 3, // Default to ring finger
  setFingerIndex = () => {},
  preferredHand = 'left', // Default to left hand
  setPreferredHand = () => {},
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(product);

  
  // Use the hand detection hook
  const { hands, isInitialized, isDetecting, error } = useHandDetection(videoRef);
  
  // Initialize camera
  useEffect(() => {
    if (!isActive) return;
    
    const setupCamera = async () => {
      try {
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsVideoReady(true);
            setVideoSize({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    
    setupCamera();
    
    // Clean up on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);
  
  // Capture the current try-on view
  const captureImage = () => {
    // Only capture the video feed as fallback
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw the video
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Get data URL
      const dataUrl = canvas.toDataURL('image/png');
      console.log("Image captured successfully");
      
      // Set the captured image
      setCapturedImage(dataUrl);
      console.log("Captured image URL:", dataUrl);
      return dataUrl;
    }
    return null;
  };
  
  // Handle user control for capturing image
  const handleTakePhoto = () => {
    return captureImage();
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
      
      {/* Three.js Canvas for ring model */}
      <Canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ preserveDrawingBuffer: true, alpha: true }}
    >
      {/* Strong lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      
      {/* Visible axes for debugging */}
      <axesHelper args={[5]} />
        
        {/* Remove OrbitControls if you're using them */}
        
        {isInitialized && hands.length > 0 && selectedProduct && (
            <RingModel
            modelPath={selectedProduct.model}
            handLandmarks={hands[0]}
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            fingerIndex={fingerIndex}
            preferredHand={preferredHand}
            />
        )}
        
        {/* Debug sphere to check rendering */}
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 32, 32]} />
            <meshStandardMaterial color="red" />
        </mesh>
        </Canvas>
      
      {/* Hand detection status indicators */}
      <div className="absolute top-2 left-2 flex space-x-2">
        {isInitialized && isDetecting && (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Detection active
          </div>
        )}
        
        {hands.length > 0 && (
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Hand detected
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="absolute z-999 left-1/2 transform -translate-x-1/2 flex space-x-3">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center"
          onClick={handleTakePhoto}
          disabled={!isInitialized || !isDetecting}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Take Photo
        </button>
        
        {/* Finger selection dropdown */}
        <div className="relative inline-block">
          <select
            className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg appearance-none pr-8 focus:outline-none"
            onChange={(e) => setFingerIndex(parseInt(e.target.value))}
            value={fingerIndex}
          >
            <option value={0}>Thumb</option>
            <option value={1}>Index Finger</option>
            <option value={2}>Middle Finger</option>
            <option value={3}>Ring Finger</option>
            <option value={4}>Pinky Finger</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* Hand preference toggle */}
        <button
          className={`px-4 py-2 rounded-full shadow-lg ${
            preferredHand === 'left' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-white text-gray-800'
          }`}
          onClick={() => setPreferredHand(preferredHand === 'left' ? 'right' : 'left')}
        >
          {preferredHand === 'left' ? 'Left Hand' : 'Right Hand'}
        </button>
      </div>
      
      {/* Hand position guide */}
      {isInitialized && isDetecting && hands.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg text-center max-w-xs">
            <p className="text-lg font-medium mb-2">Show your hand</p>
            <p className="text-sm">Hold your hand up with palm facing the camera to try on the ring</p>
          </div>
        </div>
      )}
      {hands.length > 0 && hands[0].keypoints && (
        <group>
            {hands[0].keypoints.map((point, index) => (
            <mesh key={index} position={[point.x, point.y, point.z]}>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshBasicMaterial color="red" />
            </mesh>
            ))}
        </group>
        )}
        <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
      playsInline
      muted
    />
    
    {/* Add visual debugging for hand detection */}
    {hands.length > 0 && (
      <div className="absolute inset-0 pointer-events-none">
        {hands[0].keypoints.map((point, index) => (
          <div 
            key={index}
            className="absolute w-2 h-2 bg-red-500 rounded-full"
            style={{ 
              left: `${point.x * 100}%`, 
              top: `${point.y * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>
    )}
    </div>
  );
}