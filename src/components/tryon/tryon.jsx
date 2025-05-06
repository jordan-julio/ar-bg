'use client';
// Virtual Try-On Main Component
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import HandTryOn from './HandTryOn';
import Model from './ModelRenderer';

// Product data structure
const PRODUCTS = {
  necklaces: [
    { id: 'necklace-1', name: 'Diamond Pendant', model: '/models/diamond-pendant.glb', thumbnail: '/thumbnails/diamond-pendant.jpg' },
    { id: 'necklace-2', name: 'Pearl Choker', model: '/models/pearl-choker.glb', thumbnail: '/thumbnails/pearl-choker.jpg' },
  ],
  earrings: [
    { id: 'earring-1', name: 'Gold Hoops', model: '/models/gold-hoops.glb', thumbnail: '/thumbnails/gold-hoops.jpg' },
    { id: 'earring-2', name: 'Diamond Studs', model: '/models/diamond-studs.glb', thumbnail: '/thumbnails/diamond-studs.jpg' },
  ],
  dresses: [
    { id: 'dress-1', name: 'Evening Gown', model: '/models/evening-gown.glb', thumbnail: '/thumbnails/evening-gown.jpg' },
    { id: 'dress-2', name: 'Cocktail Dress', model: '/models/cocktail-dress.glb', thumbnail: '/thumbnails/cocktail-dress.jpg' },
  ],
  rings: [
    { id: 'ring-1', name: 'Gold Ring', model: '/models/a.gltf', thumbnail: '/thumbnails/gold-ring.jpg' },
    { id: 'ring-2', name: 'Diamond Ring', model: '/models/diamond-ring.glb', thumbnail: '/thumbnails/diamond-ring.jpg' },
  ],
};

// Main Try-On component
export default function VirtualTryOn() {
  const [category, setCategory] = useState('rings');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [landmarks, setLandmarks] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [fingerIndex, setFingerIndex] = useState(3); // Default to ring finger
  const [preferredHand, setPreferredHand] = useState('left'); // Default to left hand
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseModelRef = useRef(null);
  const faceModelRef = useRef(null);
  
  // Determine if using hand detection (for rings) or body/face detection
  const isHandDetection = category === 'rings';
  
  // Load TF models on component mount
  useEffect(() => {
    if (isHandDetection) {
      // For rings, we use the specialized HandTryOn component
      // This skips the standard body/face model loading
      setIsModelLoading(false);
      return;
    }
    
    async function setupModels() {
      try {
        // Initialize TensorFlow.js
        await tf.setBackend('webgl'); // Or 'wasm' if webgl not available
        await tf.ready();             // Ensure backend is initialized
        
        console.log('TensorFlow.js initialized');
        
        // Load pose detection model
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };
        
        const poseDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, 
          detectorConfig
        );
        poseModelRef.current = poseDetector;
        console.log('Pose model loaded');
        
        // Load face landmarks model
        const faceDetector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          { 
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            maxFaces: 1 
          }
        );
        faceModelRef.current = faceDetector;
        console.log('Face model loaded');
        
        setIsModelLoading(false);
        
        // Start webcam
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 640, height: 480 } 
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
                // Start detection loop once video is ready
                detectFrame();
              };
            }
          } catch (error) {
            console.error("Error accessing webcam:", error);
          }
        }
      } catch (error) {
        console.error("Error setting up models:", error);
      }
    }
    
    // Frame-by-frame detection
    const detectFrame = async () => {
      if (videoRef.current && faceModelRef.current && poseModelRef.current) {
        try {
          // Get pose landmarks
          const poses = await poseModelRef.current.estimatePoses(videoRef.current);
          
          // Get face landmarks
          const faces = await faceModelRef.current.estimateFaces({
            input: videoRef.current
          });
          
          // Update landmarks state with combined data
          if (poses.length > 0 || faces.length > 0) {
            setLandmarks({
              pose: poses[0],
              face: faces[0]
            });
          }
        } catch (error) {
          console.error("Error in detection:", error);
        }
        
        // Continue loop for next frame
        requestAnimationFrame(detectFrame);
      }
    };
    
    // Start the setup
    setupModels();
    
    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isHandDetection]);
  
  // Select initial product when category changes
  useEffect(() => {
    if (PRODUCTS[category]?.length > 0) {
      setSelectedProduct(PRODUCTS[category][0]);
    } else {
      setSelectedProduct(null);
    }
  }, [category]);
  
  // Capture current view as image
  const captureImage = () => {
    if (isHandDetection) {
      // For rings, the capture functionality is handled by HandTryOn
      return;
    }
    
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedImage(dataUrl);
    }
  };
  
  // Handle capture from HandTryOn component
  const handleHandCapture = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
  };
  
  // Share captured image
  const shareImage = () => {
    if (capturedImage) {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `virtual-tryon-${new Date().getTime()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Additional sharing options would be implemented here
      // (email, social media, etc.)
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Virtual Try-On</h1>
        
        {/* Category selection */}
        <div className="flex space-x-4 mt-4">
          {Object.keys(PRODUCTS).map(cat => (
            <button
              key={cat}
              className={`px-4 py-2 rounded ${category === cat ? 'bg-blue-500' : 'bg-gray-600'}`}
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Product selection */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {PRODUCTS[category].map(product => (
            <div 
              key={product.id}
              className={`p-2 rounded cursor-pointer ${selectedProduct?.id === product.id ? 'border-2 border-blue-500' : 'border border-gray-600'}`}
              onClick={() => setSelectedProduct(product)}
            >
              <img src={product.thumbnail} alt={product.name} className="w-full h-24 object-cover" />
              <p className="text-sm mt-1">{product.name}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main try-on view */}
      <div className="flex-1 relative">
        {isHandDetection ? (
          /* Hand try-on for rings */
          <HandTryOn 
            product={selectedProduct}
            onCapture={handleHandCapture}
            isActive={isHandDetection}
            fingerIndex={fingerIndex}
            setFingerIndex={setFingerIndex}
            preferredHand={preferredHand}
            setPreferredHand={setPreferredHand}
          />
        ) : (
          /* Standard try-on for necklaces, earrings, dresses */
          <>
            {/* Loading indicator */}
            {isModelLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Loading models...</p>
                </div>
              </div>
            )}
            
            {/* Video feed (hidden, used for detection) */}
            <video 
              ref={videoRef}
              className="hidden"
              width="640"
              height="480"
              playsInline
              muted
            />
            
            {/* 3D canvas overlay */}
            <Canvas ref={canvasRef} className="absolute inset-0">
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
              <OrbitControls enableZoom={false} enablePan={false} />
              
              {selectedProduct && landmarks && (
                <Suspense fallback={null}>
                  <Model 
                    modelPath={selectedProduct.model}
                    landmarks={landmarks}
                    category={category}
                  />
                </Suspense>
              )}
            </Canvas>
            
            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button 
                className="bg-blue-500 text-white px-6 py-2 rounded-full"
                onClick={captureImage}
                disabled={isModelLoading}
              >
                Take Photo
              </button>
              
              {capturedImage && (
                <button 
                  className="bg-green-500 text-white px-6 py-2 rounded-full"
                  onClick={shareImage}
                >
                  Share
                </button>
              )}
            </div>
          </>
        )}
        
        {/* Preview captured image */}
        {capturedImage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white p-4 rounded max-w-lg">
              <h2 className="text-xl font-bold mb-2">Your Try-On</h2>
              <img src={capturedImage} alt="Captured try-on" className="w-full" />
              <div className="flex justify-between mt-4">
                <button 
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setCapturedImage(null)}
                >
                  Close
                </button>
                <button 
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={shareImage}
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Ring finger/hand controls - only show when rings category is selected */}
        {isHandDetection && (
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 p-3 rounded-lg">
            <h3 className="text-white text-sm font-semibold mb-2">Ring Settings</h3>
            
            <div className="space-y-3">
              {/* Finger selection */}
              <div>
                <label className="block text-white text-xs mb-1">Finger</label>
                <select 
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
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
              
              {/* Hand preference */}
              <div>
                <label className="block text-white text-xs mb-1">Hand</label>
                <div className="flex">
                  <button 
                    className={`flex-1 py-1 text-xs rounded-l ${preferredHand === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}
                    onClick={() => setPreferredHand('left')}
                  >
                    Left
                  </button>
                  <button 
                    className={`flex-1 py-1 text-xs rounded-r ${preferredHand === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}
                    onClick={() => setPreferredHand('right')}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}