'use client';
// src/components/tryon/tryon.jsx
import React, { useState, useEffect } from 'react';
import HandTryOn from './HandTryOn';

// Product data structure with placeholder models
const PRODUCTS = {
  rings: [
    { 
      id: 'ring-1', 
      name: 'Gold Band', 
      model: '/models/a.gltf', 
      thumbnail: '/vercel.svg' 
    },
    { 
      id: 'ring-2', 
      name: 'Diamond Ring', 
      model: '/models/diamond-ring.glb', 
      thumbnail: '/vercel.svg' 
    },
    { 
      id: 'ring-3', 
      name: 'Platinum Band', 
      model: '/models/platinum-band.glb', 
      thumbnail: '/vercel.svg' 
    },
  ],
  earrings: [
    { 
      id: 'earring-1', 
      name: 'Gold Hoops', 
      model: '/models/gold-hoops.glb', 
      thumbnail: '/vercel.svg' 
    },
    { 
      id: 'earring-2', 
      name: 'Diamond Studs', 
      model: '/models/diamond-studs.glb', 
      thumbnail: '/vercel.svg' 
    },
  ],
  necklaces: [
    { 
      id: 'necklace-1', 
      name: 'Diamond Pendant', 
      model: '/models/diamond-pendant.glb', 
      thumbnail: '/vercel.svg' 
    },
    { 
      id: 'necklace-2', 
      name: 'Pearl Choker', 
      model: '/models/pearl-choker.glb', 
      thumbnail: '/vercel.svg' 
    },
  ],
};

// Main Virtual Try-On Component
export default function VirtualTryOn() {
  // State hooks
  const [category, setCategory] = useState('rings');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fingerIndex, setFingerIndex] = useState(3); // Default to ring finger
  const [preferredHand, setPreferredHand] = useState('left'); // Default to left hand
  
  // Select initial product when category changes
  useEffect(() => {
    if (PRODUCTS[category]?.length > 0) {
      setSelectedProduct(PRODUCTS[category][0]);
    } else {
      setSelectedProduct(null);
    }
  }, [category]);
  
  // Handle image capture from HandTryOn component
  const handleCapture = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
  };
  
  // Share captured image
  const shareImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `virtual-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-white">
      {/* Header section */}
      <header className="bg-white shadow-md py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800">Virtual Jewelry Try-On</h1>
        
        {/* Category selection */}
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {Object.keys(PRODUCTS).map(cat => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                category === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-4">
        {/* Left sidebar - Product selection */}
        <div className="md:w-1/4 bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-3">Select Product</h2>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {PRODUCTS[category]?.map(product => (
              <div 
                key={product.id}
                className={`p-2 rounded-lg cursor-pointer transition-all ${
                  selectedProduct?.id === product.id 
                    ? 'border-2 border-blue-500 bg-blue-50' 
                    : 'border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-2">
                  <img 
                    src={product.thumbnail || '/file.svg'} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/file.svg';
                    }}
                  />
                </div>
                <p className="text-sm font-medium">{product.name}</p>
              </div>
            ))}
          </div>
          
          {/* Ring settings (only for rings category) */}
          {category === 'rings' && (
            <div className="mt-6 border-t pt-4">
              <h2 className="font-semibold text-lg mb-3">Ring Settings</h2>
              
              {/* Finger selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Finger</label>
                <select 
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={fingerIndex}
                  onChange={(e) => setFingerIndex(parseInt(e.target.value))}
                >
                  <option value={0}>Thumb</option>
                  <option value={1}>Index Finger</option>
                  <option value={2}>Middle Finger</option>
                  <option value={3}>Ring Finger</option>
                  <option value={4}>Pinky Finger</option>
                </select>
              </div>
              
              {/* Hand preference */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Hand</label>
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button 
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      preferredHand === 'left' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setPreferredHand('left')}
                  >
                    Left
                  </button>
                  <div className="w-px bg-gray-300"></div>
                  <button 
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      preferredHand === 'right' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setPreferredHand('right')}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content - Try-on view */}
        <div className="md:flex-1 bg-white rounded-lg shadow-md overflow-hidden">
          {category === 'rings' ? (
            <div className="relative w-full h-[500px]">
              {selectedProduct && (
                <HandTryOn 
                  product={selectedProduct}
                  onCapture={handleCapture}
                  isActive={true}
                  fingerIndex={fingerIndex}
                  setFingerIndex={setFingerIndex}
                  preferredHand={preferredHand}
                  setPreferredHand={setPreferredHand}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] bg-gray-100">
              <div className="text-center p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {category.charAt(0).toUpperCase() + category.slice(1)} try-on will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Captured image overlay */}
      {capturedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold">Your Virtual Try-On</h3>
            </div>
            <div className="p-4">
              <img 
                src={capturedImage} 
                alt="Try-on capture" 
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => setCapturedImage(null)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={shareImage}
                className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}