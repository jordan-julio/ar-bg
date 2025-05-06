// src/lib/utils/handPositioning.js
import { convertCoordinates } from './modelPositioning';

// MediaPipe hand landmarks index reference:
// https://developers.google.com/mediapipe/solutions/vision/hand_landmarker

// Find which finger to place the ring on (default is ring finger)
export const getRingPosition = (handLandmarks, videoWidth, videoHeight, fingerIndex = 3) => {
  if (!handLandmarks || !handLandmarks.keypoints) return null;
  
  // MediaPipe hand landmark indices:
  // Base of each finger: 1 (thumb), 5 (index), 9 (middle), 13 (ring), 17 (pinky)
  // Tip of each finger: 4 (thumb), 8 (index), 12 (middle), 16 (ring), 20 (pinky)
  
  // Mapping from finger index to base and tip landmarks
  const fingerIndices = {
    0: { base: 1, mid: 2, tip: 4 },    // Thumb
    1: { base: 5, mid: 6, tip: 8 },    // Index
    2: { base: 9, mid: 10, tip: 12 },  // Middle
    3: { base: 13, mid: 14, tip: 16 }, // Ring
    4: { base: 17, mid: 18, tip: 20 }  // Pinky
  };
  
  // Get landmark indices for the selected finger
  const { base, mid, tip } = fingerIndices[fingerIndex];
  
  // Find landmarks
  const baseLandmark = handLandmarks.keypoints.find(kp => kp.index === base);
  const midLandmark = handLandmarks.keypoints.find(kp => kp.index === mid);
  const tipLandmark = handLandmarks.keypoints.find(kp => kp.index === tip);
  
  if (!baseLandmark || !midLandmark || !tipLandmark) return null;
  
  // Convert to Three.js coordinates
  const basePos = convertCoordinates(baseLandmark.x, baseLandmark.y, baseLandmark.z, videoWidth, videoHeight);
  const midPos = convertCoordinates(midLandmark.x, midLandmark.y, midLandmark.z, videoWidth, videoHeight);
  const tipPos = convertCoordinates(tipLandmark.x, tipLandmark.y, tipLandmark.z, videoWidth, videoHeight);
  
  // Calculate ring position (around the middle of the finger)
  const posX = (midPos.x + basePos.x) / 2;
  const posY = (midPos.y + basePos.y) / 2;
  const posZ = (midPos.z + basePos.z) / 2;
  
  // Calculate finger direction for rotation
  const dirX = tipPos.x - basePos.x;
  const dirY = tipPos.y - basePos.y;
  const dirZ = tipPos.z - basePos.z;
  
  // Calculate finger thickness for scaling (distance between joints)
  const fingerThickness = Math.sqrt(
    Math.pow(midPos.x - basePos.x, 2) +
    Math.pow(midPos.y - basePos.y, 2) +
    Math.pow(midPos.z - basePos.z, 2)
  );
  
  // Calculate rotation angles
  // Assuming the ring model's default orientation is along the y-axis
  const rotX = Math.atan2(dirZ, Math.sqrt(dirX * dirX + dirY * dirY));
  const rotY = 0; // Adjust if needed based on model orientation
  const rotZ = Math.atan2(dirY, dirX);
  
  return {
    position: { x: posX, y: posY, z: posZ },
    rotation: { x: rotX, y: rotY, z: rotZ },
    scale: fingerThickness * 1.2, // Scale factor to fit finger (adjust based on model)
    fingerIndex
  };
};

// Get hand detection configuration for MediaPipe
export const getHandDetectionConfig = () => {
  return {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'full',
    maxHands: 2
  };
};

// Detect whether a landmark is from the left or right hand
export const determineHandedness = (handLandmarks) => {
  if (!handLandmarks) return null;
  
  // This is a simplified approach - in a real implementation, 
  // MediaPipe's handedness score would be used
  // For now, we'll assume the hand on the left side of the frame is the left hand
  const wristX = handLandmarks.keypoints.find(kp => kp.index === 0)?.x || 0;
  
  return wristX < 0.5 ? 'left' : 'right';
};

// Calculate the orientation of the hand (palm up, down, etc.)
export const getHandOrientation = (handLandmarks) => {
  if (!handLandmarks || !handLandmarks.keypoints) return null;
  
  // Get wrist and middle finger MCP (base) landmarks
  const wrist = handLandmarks.keypoints.find(kp => kp.index === 0);
  const middleBase = handLandmarks.keypoints.find(kp => kp.index === 9);
  const middleTip = handLandmarks.keypoints.find(kp => kp.index === 12);
  
  if (!wrist || !middleBase || !middleTip) return null;
  
  // Calculate vectors
  const palmVecX = middleBase.x - wrist.x;
  const palmVecY = middleBase.y - wrist.y;
  const palmVecZ = (middleBase.z || 0) - (wrist.z || 0);
  
  const fingerVecX = middleTip.x - middleBase.x;
  const fingerVecY = middleTip.y - middleBase.y;
  const fingerVecZ = (middleTip.z || 0) - (middleBase.z || 0);
  
  // Calculate normal vector to palm using cross product
  const normalX = palmVecY * fingerVecZ - palmVecZ * fingerVecY;
  const normalY = palmVecZ * fingerVecX - palmVecX * fingerVecZ;
  const normalZ = palmVecX * fingerVecY - palmVecY * fingerVecX;
  
  // Normalize the normal vector
  const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
  
  if (length === 0) return null;
  
  const normalizedX = normalX / length;
  const normalizedY = normalY / length;
  const normalizedZ = normalZ / length;
  
  // Determine orientation based on the normal vector
  // Simplified approach: check the z-component to determine palm up/down
  if (normalizedZ > 0.7) {
    return 'palm_down';
  } else if (normalizedZ < -0.7) {
    return 'palm_up';
  } else if (normalizedY > 0.7) {
    return 'palm_forward';
  } else if (normalizedY < -0.7) {
    return 'palm_backward';
  } else if (normalizedX > 0.7) {
    return 'palm_right';
  } else if (normalizedX < -0.7) {
    return 'palm_left';
  }
  
  return 'palm_angled';
};