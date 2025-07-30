import { supabase } from './supabase';

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'recipe-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Upload an image file to Supabase storage
   * @param file - The image file to upload
   * @param userId - The user ID for organizing files
   * @returns Promise<string> - The public URL of the uploaded image
   */
  static async uploadImage(file: File, userId: string): Promise<string> {
    try {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Supabase storage
   * @param imageUrl - The public URL of the image to delete
   * @returns Promise<void>
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  /**
   * Compress an image file for web optimization
   * @param file - The image file to compress
   * @param maxWidth - Maximum width in pixels
   * @param maxHeight - Maximum height in pixels
   * @param quality - JPEG quality (0-1)
   * @returns Promise<File> - The compressed image file
   */
  static async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 800,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
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
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate responsive image URLs for different screen sizes
   * @param baseUrl - The base image URL
   * @returns Object with different sized URLs
   */
  static generateResponsiveUrls(baseUrl: string) {
    // For now, return the same URL. In a real implementation,
    // you might use a service like Cloudinary or implement
    // server-side image resizing
    return {
      thumbnail: baseUrl, // 150x150
      small: baseUrl,     // 300x300
      medium: baseUrl,    // 600x600
      large: baseUrl,     // 1200x1200
      original: baseUrl
    };
  }

  /**
   * Validate image file before upload
   * @param file - The file to validate
   * @returns boolean - Whether the file is valid
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    // Check for supported formats
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Supported formats: JPEG, PNG, WebP, GIF' 
      };
    }

    return { valid: true };
  }

  /**
   * Create a storage bucket if it doesn't exist
   * @returns Promise<void>
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }
}

export default ImageUploadService;
