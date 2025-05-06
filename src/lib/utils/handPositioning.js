// src/lib/utils/handPositioning.js

// Convert 2D coordinates to 3D space
export const convertCoordinates = (x, y, z = 0, videoWidth, videoHeight) => {
    // Convert from [0,1] normalized coordinates to Three.js coordinate system
    const aspectRatio = videoWidth / videoHeight;
    const threeX = (x * 2 - 1) * aspectRatio;  // Convert to [-aspectRatio, aspectRatio]
    const threeY = -(y * 2 - 1);               // Convert to [-1, 1] and flip Y
    const threeZ = z;                          // Use provided Z or default to 0
    
    return { x: threeX, y: threeY, z: threeZ };
  };
  
  // Get ring position based on finger landmarks
  export const getRingPosition = (handLandmarks, videoWidth, videoHeight, fingerIndex = 3) => {
    if (!handLandmarks || !handLandmarks.keypoints) {
      return null;
    }
    
    // Finger landmark indices mapping (MediaPipe hand landmark model)
    // Each finger has 4 points: base of finger, first knuckle, second knuckle, fingertip
    const fingerLandmarks = {
      0: [1, 2, 3, 4],      // Thumb: CMC, MCP, IP, TIP
      1: [5, 6, 7, 8],      // Index: MCP, PIP, DIP, TIP
      2: [9, 10, 11, 12],   // Middle: MCP, PIP, DIP, TIP
      3: [13, 14, 15, 16],  // Ring: MCP, PIP, DIP, TIP
      4: [17, 18, 19, 20]   // Pinky: MCP, PIP, DIP, TIP
    };
    
    // Get the landmarks for the selected finger
    const landmarks = fingerLandmarks[fingerIndex];
    if (!landmarks) return null;
    
    // Find PIP joint (middle joint of finger) - this is where we'll place the ring
    const pipIndex = landmarks[1];  // Second point is the PIP joint
    const mcpIndex = landmarks[0];  // First point is the MCP joint (base)
    const dipIndex = landmarks[2];  // Third point is the DIP joint
    
    // Get the landmark points
    const pipLandmark = handLandmarks.keypoints.find(kp => kp.index === pipIndex);
    const mcpLandmark = handLandmarks.keypoints.find(kp => kp.index === mcpIndex);
    const dipLandmark = handLandmarks.keypoints.find(kp => kp.index === dipIndex);
    
    if (!pipLandmark || !mcpLandmark || !dipLandmark) {
      console.error("Required finger landmarks not found");
      return null;
    }
    
    // Convert to Three.js coordinates
    const pipPos = convertCoordinates(pipLandmark.x, pipLandmark.y, pipLandmark.z || 0, videoWidth, videoHeight);
    const mcpPos = convertCoordinates(mcpLandmark.x, mcpLandmark.y, mcpLandmark.z || 0, videoWidth, videoHeight);
    const dipPos = convertCoordinates(dipLandmark.x, dipLandmark.y, dipLandmark.z || 0, videoWidth, videoHeight);
    
    // Calculate finger direction vectors
    const fingerDirectionX = dipPos.x - mcpPos.x;
    const fingerDirectionY = dipPos.y - mcpPos.y;
    const fingerDirectionZ = dipPos.z - mcpPos.z;
    
    // Calculate finger length for scale
    const fingerLength = Math.sqrt(
      Math.pow(dipPos.x - mcpPos.x, 2) +
      Math.pow(dipPos.y - mcpPos.y, 2) +
      Math.pow(dipPos.z - mcpPos.z, 2)
    );
    
    // Calculate rotation angles
    const rotZ = Math.atan2(fingerDirectionY, fingerDirectionX);
    const rotY = Math.atan2(fingerDirectionZ, Math.sqrt(fingerDirectionX * fingerDirectionX + fingerDirectionY * fingerDirectionY));
    
    // Ring should be perpendicular to finger direction
    const rotX = Math.PI / 2;
    
    // Get finger thickness for scaling
    const fingerThickness = fingerLength * 0.23; // Approximate finger thickness
    
    return {
      position: pipPos,
      rotation: { x: rotX, y: rotY, z: rotZ },
      scale: fingerThickness,
      fingerIndex
    };
  };
  
  // Determine if hand is left or right
  export const determineHandedness = (handLandmarks) => {
    if (!handLandmarks) return 'unknown';
    
    // If the model already determined handedness, use that
    if (handLandmarks.handedness) {
      return handLandmarks.handedness.toLowerCase();
    }
    
    // Otherwise, estimate based on thumb position relative to pinky
    // This is a simplified approach and not 100% accurate
    const wristLandmark = handLandmarks.keypoints.find(kp => kp.index === 0);
    const thumbLandmark = handLandmarks.keypoints.find(kp => kp.index === 4);
    const pinkyLandmark = handLandmarks.keypoints.find(kp => kp.index === 20);
    
    if (!wristLandmark || !thumbLandmark || !pinkyLandmark) {
      return 'unknown';
    }
    
    // Vector from wrist to pinky
    const wristToPinkyX = pinkyLandmark.x - wristLandmark.x;
    const wristToPinkyY = pinkyLandmark.y - wristLandmark.y;
    
    // Vector from wrist to thumb
    const wristToThumbX = thumbLandmark.x - wristLandmark.x;
    const wristToThumbY = thumbLandmark.y - wristLandmark.y;
    
    // Cross product to determine orientation
    const crossProduct = (wristToPinkyX * wristToThumbY) - (wristToPinkyY * wristToThumbX);
    
    // If positive, thumb is on the right of pinky (left hand)
    // If negative, thumb is on the left of pinky (right hand)
    return crossProduct > 0 ? 'left' : 'right';
  };
  
  // Get hand orientation
  export const getHandOrientation = (handLandmarks) => {
    if (!handLandmarks || !handLandmarks.keypoints) return null;
    
    // We need at least the wrist and some finger points
    const wrist = handLandmarks.keypoints.find(kp => kp.index === 0);
    const indexMCP = handLandmarks.keypoints.find(kp => kp.index === 5);
    const indexTip = handLandmarks.keypoints.find(kp => kp.index === 8);
    const pinkyMCP = handLandmarks.keypoints.find(kp => kp.index === 17);
    
    if (!wrist || !indexMCP || !indexTip || !pinkyMCP) return null;
    
    // Calculate palm normal vector using cross product
    // Vector from wrist to index MCP
    const wristToIndexX = indexMCP.x - wrist.x;
    const wristToIndexY = indexMCP.y - wrist.y;
    const wristToIndexZ = (indexMCP.z || 0) - (wrist.z || 0);
    
    // Vector from wrist to pinky MCP
    const wristToPinkyX = pinkyMCP.x - wrist.x;
    const wristToPinkyY = pinkyMCP.y - wrist.y;
    const wristToPinkyZ = (pinkyMCP.z || 0) - (wrist.z || 0);
    
    // Cross product to get normal vector
    const normalX = (wristToIndexY * wristToPinkyZ) - (wristToIndexZ * wristToPinkyY);
    const normalY = (wristToIndexZ * wristToPinkyX) - (wristToIndexX * wristToPinkyZ);
    const normalZ = (wristToIndexX * wristToPinkyY) - (wristToIndexY * wristToPinkyX);
    
    // Normalize vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
    if (length === 0) return null;
    
    const normX = normalX / length;
    const normY = normalY / length;
    const normZ = normalZ / length;
    
    // Determine orientation based on normal vector direction
    if (Math.abs(normZ) > 0.7) {
      return normZ > 0 ? 'palm_down' : 'palm_up';
    } else if (Math.abs(normY) > 0.7) {
      return normY > 0 ? 'palm_forward' : 'palm_backward';
    } else if (Math.abs(normX) > 0.7) {
      return normX > 0 ? 'palm_right' : 'palm_left';
    }
    
    return 'palm_angled';
};