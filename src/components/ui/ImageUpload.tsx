import React, { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ImageUploadService } from '../../services/imageUpload';
import { useAuth } from '../../contexts/AuthContext';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onImageFile?: (file: File) => void;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  accept?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  uploadToStorage?: boolean; // Whether to upload to Supabase storage
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onImageFile,
  maxSizeMB = 2,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.8,
  accept = 'image/*',
  className = '',
  placeholder = 'Upload recipe image',
  disabled = false,
  uploadToStorage = true
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image compression utility
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, [maxWidth, maxHeight, quality]);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = ImageUploadService.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress the image
      setUploadProgress(25);
      const compressedFile = await compressImage(file);

      if (uploadToStorage && user) {
        // Upload to Supabase storage
        setUploadProgress(50);
        const imageUrl = await ImageUploadService.uploadImage(compressedFile, user.id);
        setUploadProgress(100);

        setPreviewUrl(imageUrl);
        onChange(imageUrl);
      } else {
        // Use blob URL for preview only
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);
        onChange(url);
      }

      // Call callback with file
      if (onImageFile) {
        onImageFile(compressedFile);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      alert(error instanceof Error ? error.message : 'Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [compressImage, maxSizeMB, onChange, onImageFile, uploadToStorage, user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviewUrl(url);
    onChange(url);
  }, [onChange]);

  const clearImage = useCallback(() => {
    setPreviewUrl(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Preview */}
      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Recipe preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing image...'}
              </p>
              {uploadProgress > 0 && (
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Drag & drop or click to select • Max {maxSizeMB}MB • JPG, PNG, WebP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* URL Input Alternative */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or enter image URL
        </label>
        <input
          type="url"
          value={value || ''}
          onChange={handleUrlChange}
          disabled={disabled}
          className="input-field"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Image Info */}
      {previewUrl && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Image will be automatically optimized for web and mobile viewing</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
