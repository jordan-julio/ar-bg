// src/hooks/useHandDetection.js - Fixed version
import { useState, useEffect, useRef } from 'react';

// A simpler mock implementation that doesn't rely on TensorFlow
// This will at least let us test the UI and ring placement
export const useHandDetection = (videoRef) => {
  const [hands, setHands] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  
  const requestRef = useRef(null);
  const lastPos = useRef({ x: 0.5, y: 0.5 });
  
  // Use mouse position as a fallback for hand detection
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Skip if not detecting
      if (!isDetecting) return;
      
      // Calculate normalized position
      const rect = videoRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      lastPos.current = { x, y };
      
      // Create mock hand landmarks
      createMockHandLandmarks(x, y);
    };
    
    // Initialize
    setIsInitialized(true);
    setIsDetecting(true);
    
    // Add mouse move listener as backup
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Create mock hand landmarks based on mouse position
  const createMockHandLandmarks = (x, y) => {
    // Base positions for hand with fingers spread
    const baseKeypoints = [
      { name: "wrist", offsetX: 0, offsetY: 0.1 },         // 0
      { name: "thumb_cmc", offsetX: -0.08, offsetY: 0.05 }, // 1
      { name: "thumb_mcp", offsetX: -0.12, offsetY: 0 },    // 2
      { name: "thumb_ip", offsetX: -0.15, offsetY: -0.05 }, // 3
      { name: "thumb_tip", offsetX: -0.18, offsetY: -0.1 }, // 4
      
      { name: "index_finger_mcp", offsetX: -0.05, offsetY: -0.05 }, // 5
      { name: "index_finger_pip", offsetX: -0.07, offsetY: -0.15 }, // 6
      { name: "index_finger_dip", offsetX: -0.08, offsetY: -0.2 },  // 7
      { name: "index_finger_tip", offsetX: -0.09, offsetY: -0.25 }, // 8
      
      { name: "middle_finger_mcp", offsetX: 0, offsetY: -0.05 },  // 9
      { name: "middle_finger_pip", offsetX: 0, offsetY: -0.15 }, // 10
      { name: "middle_finger_dip", offsetX: 0, offsetY: -0.2 },  // 11
      { name: "middle_finger_tip", offsetX: 0, offsetY: -0.25 }, // 12
      
      { name: "ring_finger_mcp", offsetX: 0.05, offsetY: -0.05 }, // 13
      { name: "ring_finger_pip", offsetX: 0.07, offsetY: -0.15 }, // 14
      { name: "ring_finger_dip", offsetX: 0.08, offsetY: -0.2 },  // 15
      { name: "ring_finger_tip", offsetX: 0.09, offsetY: -0.25 }, // 16
      
      { name: "pinky_finger_mcp", offsetX: 0.1, offsetY: -0.03 }, // 17
      { name: "pinky_finger_pip", offsetX: 0.13, offsetY: -0.12 }, // 18
      { name: "pinky_finger_dip", offsetX: 0.14, offsetY: -0.18 }, // 19
      { name: "pinky_finger_tip", offsetX: 0.15, offsetY: -0.22 }  // 20
    ];
    
    // Create keypoints with actual positions
    const keypoints = baseKeypoints.map((point, index) => {
      // Add some slight random movement to make it look more natural
      const jitterX = (Math.random() - 0.5) * 0.01;
      const jitterY = (Math.random() - 0.5) * 0.01;
      
      return {
        x: Math.min(Math.max(x + point.offsetX + jitterX, 0), 1),
        y: Math.min(Math.max(y + point.offsetY + jitterY, 0), 1),
        z: 0,
        name: point.name,
        index: index
      };
    });
    
    // Calculate hand center
    const centerX = keypoints.reduce((sum, kp) => sum + kp.x, 0) / keypoints.length;
    const centerY = keypoints.reduce((sum, kp) => sum + kp.y, 0) / keypoints.length;
    
    // Set the hands state
    setHands([{
      keypoints: keypoints,
      handedness: "Right",
      score: 0.9,
      center: { x: centerX, y: centerY }
    }]);
  };
  
  return {
    hands,
    isInitialized,
    isDetecting,
    error,
    // Toggle detection
    toggleDetection: (start = true) => {
      setIsDetecting(start);
    }
  };
};