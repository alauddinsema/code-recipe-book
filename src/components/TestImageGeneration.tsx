/**
 * Test Component for AI Image Generation
 * Provides a simple UI to test image generation functionality
 */

import React, { useState } from 'react';
import { ImageGenerationService } from '../services/imageGeneration';
import { GeminiService } from '../services/gemini';

const TestImageGeneration: React.FC = () => {
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [isTestingFull, setIsTestingFull] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectImageGeneration = async () => {
    setIsTestingDirect(true);
    addResult('🧪 Starting direct image generation test...');
    
    try {
      const imageUrl = await ImageGenerationService.generateRecipeImage(
        'Chocolate Chip Cookies',
        'Classic homemade chocolate chip cookies with crispy edges',
        ['flour', 'butter', 'brown sugar', 'chocolate chips', 'eggs', 'vanilla']
      );
      
      if (imageUrl) {
        addResult('✅ Direct image generation successful!');
        addResult(`📸 Image URL length: ${imageUrl.length} characters`);
        setGeneratedImage(imageUrl);
        
        if (imageUrl.startsWith('data:image/')) {
          addResult('✅ Valid data URL format');
        } else {
          addResult('❌ Invalid data URL format');
        }
      } else {
        addResult('❌ Direct image generation returned null');
      }
    } catch (error) {
      addResult(`❌ Direct image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsTestingDirect(false);
  };

  const testFullRecipeGeneration = async () => {
    setIsTestingFull(true);
    addResult('🧪 Starting full recipe generation test...');
    
    try {
      const recipe = await GeminiService.generateRecipe(['chicken', 'rice', 'vegetables']);
      
      addResult('✅ Recipe generation successful!');
      addResult(`📝 Recipe: ${recipe.title}`);
      
      if (recipe.image_url) {
        addResult('✅ Recipe includes generated image!');
        addResult(`📸 Image URL length: ${recipe.image_url.length} characters`);
        setGeneratedImage(recipe.image_url);
        
        if (recipe.image_url.startsWith('data:image/')) {
          addResult('✅ Valid data URL format');
        } else {
          addResult('❌ Invalid data URL format');
        }
      } else {
        addResult('⚠️ Recipe generated but no image included');
      }
    } catch (error) {
      addResult(`❌ Full recipe generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsTestingFull(false);
  };

  const testFallbackImage = () => {
    addResult('🧪 Testing fallback image...');
    const fallbackUrl = ImageGenerationService.getFallbackImageUrl('dessert');
    
    if (fallbackUrl) {
      addResult(`✅ Fallback image URL: ${fallbackUrl}`);
      setGeneratedImage(fallbackUrl);
    } else {
      addResult('❌ Fallback image generation failed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setGeneratedImage(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🧪 AI Image Generation Test Suite
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Test Controls
          </h3>
          
          <button
            onClick={testDirectImageGeneration}
            disabled={isTestingDirect}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingDirect ? '⏳ Testing...' : '🎨 Test Direct Image Generation'}
          </button>
          
          <button
            onClick={testFullRecipeGeneration}
            disabled={isTestingFull}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingFull ? '⏳ Testing...' : '🍳 Test Full Recipe Generation'}
          </button>
          
          <button
            onClick={testFallbackImage}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            🖼️ Test Fallback Image
          </button>
          
          <button
            onClick={clearResults}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            🗑️ Clear Results
          </button>
        </div>
        
        {/* Generated Image Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Generated Image
          </h3>
          
          {generatedImage ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <img
                src={generatedImage}
                alt="Generated recipe image"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  addResult('❌ Failed to display generated image');
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  addResult('✅ Image displayed successfully');
                }}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
              No image generated yet
            </div>
          )}
        </div>
      </div>
      
      {/* Test Results Log */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Test Results Log
        </h3>
        
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No test results yet. Run a test to see results here.
            </p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-sm font-mono text-gray-800 dark:text-gray-200"
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestImageGeneration;
