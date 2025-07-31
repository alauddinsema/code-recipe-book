/**
 * Test script for AI Image Generation functionality
 * Tests both development and production modes
 */

import { ImageGenerationService } from '../services/imageGeneration';
import { GeminiService } from '../services/gemini';

// Test data
const testRecipe = {
  title: 'Chocolate Chip Cookies',
  description: 'Classic homemade chocolate chip cookies with a crispy edge and chewy center',
  ingredients: ['flour', 'butter', 'brown sugar', 'chocolate chips', 'eggs', 'vanilla']
};

async function testImageGenerationDirect() {
  console.log('🧪 Testing Direct Image Generation...');
  
  try {
    const imageUrl = await ImageGenerationService.generateRecipeImage(
      testRecipe.title,
      testRecipe.description,
      testRecipe.ingredients
    );
    
    if (imageUrl) {
      console.log('✅ Image generation successful!');
      console.log('📸 Image URL type:', typeof imageUrl);
      console.log('📸 Image URL length:', imageUrl.length);
      console.log('📸 Image URL preview:', imageUrl.substring(0, 100) + '...');
      
      // Validate it's a proper data URL
      if (imageUrl.startsWith('data:image/')) {
        console.log('✅ Valid data URL format');
      } else {
        console.log('❌ Invalid data URL format');
      }
      
      return true;
    } else {
      console.log('❌ Image generation returned null/undefined');
      return false;
    }
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    return false;
  }
}

async function testFullRecipeGeneration() {
  console.log('🧪 Testing Full Recipe Generation with Image...');
  
  try {
    const recipe = await GeminiService.generateRecipe(testRecipe.ingredients);
    
    console.log('✅ Recipe generation successful!');
    console.log('📝 Recipe title:', recipe.title);
    console.log('📝 Recipe description:', recipe.description);
    
    if (recipe.image_url) {
      console.log('✅ Recipe includes generated image!');
      console.log('📸 Image URL type:', typeof recipe.image_url);
      console.log('📸 Image URL length:', recipe.image_url.length);
      
      // Validate it's a proper data URL
      if (recipe.image_url.startsWith('data:image/')) {
        console.log('✅ Valid data URL format');
      } else {
        console.log('❌ Invalid data URL format');
      }
      
      return true;
    } else {
      console.log('⚠️ Recipe generated but no image included');
      return false;
    }
  } catch (error) {
    console.error('❌ Full recipe generation failed:', error);
    return false;
  }
}

async function testImageValidation() {
  console.log('🧪 Testing Image Validation...');
  
  // Test valid data URL
  const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const isValid = ImageGenerationService.validateImageUrl(validDataUrl);
  
  if (isValid) {
    console.log('✅ Image validation works correctly');
  } else {
    console.log('❌ Image validation failed for valid URL');
  }
  
  // Test invalid URL
  const invalidUrl = 'not-a-valid-url';
  const isInvalid = ImageGenerationService.validateImageUrl(invalidUrl);
  
  if (!isInvalid) {
    console.log('✅ Image validation correctly rejects invalid URLs');
  } else {
    console.log('❌ Image validation incorrectly accepts invalid URLs');
  }
  
  return isValid && !isInvalid;
}

async function testFallbackImage() {
  console.log('🧪 Testing Fallback Image...');
  
  const fallbackUrl = ImageGenerationService.getFallbackImageUrl('dessert');
  
  if (fallbackUrl && fallbackUrl.length > 0) {
    console.log('✅ Fallback image URL generated:', fallbackUrl);
    return true;
  } else {
    console.log('❌ Fallback image URL generation failed');
    return false;
  }
}

// Main test runner
export async function runImageGenerationTests() {
  console.log('🚀 Starting AI Image Generation Tests...\n');
  
  const results = {
    imageValidation: false,
    fallbackImage: false,
    directImageGeneration: false,
    fullRecipeGeneration: false
  };
  
  // Test 1: Image validation
  results.imageValidation = await testImageValidation();
  console.log('');
  
  // Test 2: Fallback image
  results.fallbackImage = await testFallbackImage();
  console.log('');
  
  // Test 3: Direct image generation (may fail if API key issues)
  results.directImageGeneration = await testImageGenerationDirect();
  console.log('');
  
  // Test 4: Full recipe generation with image
  results.fullRecipeGeneration = await testFullRecipeGeneration();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AI Image Generation is working correctly.');
  } else if (passedTests >= 2) {
    console.log('⚠️ Some tests passed. Basic functionality works, but there may be API issues.');
  } else {
    console.log('❌ Most tests failed. There are significant issues with the implementation.');
  }
  
  return results;
}

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to global scope for manual testing
  (window as any).testImageGeneration = runImageGenerationTests;
  console.log('🔧 Image generation tests available. Run: testImageGeneration()');
}
