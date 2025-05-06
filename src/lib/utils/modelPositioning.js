// lib/utils/modelPositioning.js

// Convert MediaPipe 3D coordinates to Three.js coordinates
export const convertCoordinates = (x, y, z, videoWidth, videoHeight) => {
    // Convert from [0,1] range to [-1,1] range (Three.js coordinate system)
    const threeX = (x * 2 - 1) * (videoWidth / videoHeight);
    const threeY = -(y * 2 - 1); // Flip Y axis
    const threeZ = z || 0; // Z might not be available in all detection models
    
    return { x: threeX, y: threeY, z: threeZ };
  };
  
  // Position functions for different product categories
  export const getNecklacePosition = (poseLandmarks, videoWidth, videoHeight) => {
    if (!poseLandmarks || !poseLandmarks.keypoints) return null;
    
    // Find neck landmark
    const nose = poseLandmarks.keypoints.find(kp => kp.name === 'nose');
    const leftShoulder = poseLandmarks.keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = poseLandmarks.keypoints.find(kp => kp.name === 'right_shoulder');
    
    if (!nose || !leftShoulder || !rightShoulder) return null;
    
    // Calculate neck position
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const shoulderMidZ = ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2;
    
    // Position between shoulders and nose
    const neckRatio = 0.3;
    const neckX = shoulderMidX + (nose.x - shoulderMidX) * neckRatio;
    const neckY = shoulderMidY + (nose.y - shoulderMidY) * neckRatio;
    const neckZ = shoulderMidZ + ((nose.z || 0) - shoulderMidZ) * neckRatio;
    
    return {
      position: convertCoordinates(neckX, neckY, neckZ, videoWidth, videoHeight),
      scale: {
        // Scale based on shoulder width
        x: Math.abs(rightShoulder.x - leftShoulder.x) * 1.2,
        y: Math.abs(rightShoulder.x - leftShoulder.x) * 1.2,
        z: Math.abs(rightShoulder.x - leftShoulder.x) * 1.2
      }
    };
  };
  
  // Add more positioning functions for earrings and dresses