// src/hooks/useHandDetection.js
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

export const useHandDetection = (videoRef) => {
    const [hands, setHands] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState(null);
    
    const detectorRef = useRef(null);
    const requestRef = useRef(null);
    
    // Initialize the hand detection model
    useEffect(() => {
      const initializeDetector = async () => {
        try {
          // Ensure TensorFlow.js is ready
          await tf.ready();
          console.log('TensorFlow backend:', tf.getBackend());
          
          // Use only TensorFlow.js runtime
          const detectorConfig = {
            runtime: 'tfjs',
            // Use HandLandmarker if available, otherwise fall back to MediaPipeHands
            solutionPath: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection',
            modelType: 'full',
            maxHands: 2
          };
          
          console.log('Creating detector with config:', detectorConfig);
          
          // Create detector using only tfjs runtime
          detectorRef.current = await handPoseDetection.createDetector(
            handPoseDetection.SupportedModels.MediaPipeHands,
            detectorConfig
          );
          
          console.log('Hand detector created successfully');
          setIsInitialized(true);
        } catch (err) {
          console.error('Hand detection initialization error details:', err);
          setError(`Hand detection failed to initialize: ${err.message}`);
        }
      };
      
      console.log('Starting hand detection initialization');
      initializeDetector();
      
      // Cleanup function
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }, []);
  
  // Start or stop detection
  const toggleDetection = (start = true) => {
    if (start && !isDetecting) {
      setIsDetecting(true);
      detectHands();
      return true;
    } else if (!start && isDetecting) {
      setIsDetecting(false);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return true;
    }
    return false;
  };
  
  // Detect hands in the video
  const detectHands = async () => {
    if (!isDetecting || !videoRef.current || !detectorRef.current) {
      return;
    }
    
    try {
      // Make sure video is playing and ready
      if (videoRef.current.readyState === 4) {
        const handPoses = await detectorRef.current.estimateHands(videoRef.current);
        
        if (handPoses && handPoses.length > 0) {
          // Process the hand poses to include additional information
          const processedHands = handPoses.map(hand => {
            const { keypoints, keypoints3D, handedness, score } = hand;
            
            // Calculate center point of hand
            const centerX = keypoints.reduce((sum, kp) => sum + kp.x, 0) / keypoints.length;
            const centerY = keypoints.reduce((sum, kp) => sum + kp.y, 0) / keypoints.length;
            
            return {
              keypoints,
              keypoints3D,
              handedness,
              score,
              center: { x: centerX, y: centerY },
              // Add the raw data as well for more detailed processing
              raw: hand
            };
          });
          
          setHands(processedHands);
        } else {
          setHands([]);
        }
      }
    } catch (err) {
      console.error('Hand detection error:', err);
    }
    
    // Continue the detection loop
    requestRef.current = requestAnimationFrame(detectHands);
  };
  
  // Start detection when initialized
  useEffect(() => {
    if (isInitialized && !isDetecting) {
      toggleDetection(true);
    }
  }, [isInitialized, isDetecting]);
  
  return {
    hands,
    isInitialized,
    isDetecting,
    error,
    toggleDetection
  };
};