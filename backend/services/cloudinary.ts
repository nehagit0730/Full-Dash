import { v2 as cloudinary } from 'cloudinary';

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
  return cloudinary;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  fileSize: number;
  folder: string;
  originalFilename: string;
  createdAt: string;
}

/**
 * Upload buffer or base64 data string to Cloudinary
 */
export async function uploadToCloudinary(
  fileBufferOrDataUri: Buffer | string,
  options: {
    folder?: string;
    originalFilename?: string;
    resourceType?: 'auto' | 'image' | 'video' | 'raw';
    publicId?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const client = getCloudinaryClient();
  const folder = options.folder || 'storefront_media';
  const resourceType = options.resourceType || 'auto';

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.');
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }
    if (options.originalFilename) {
      uploadOptions.context = { original_filename: options.originalFilename };
    }

    if (Buffer.isBuffer(fileBufferOrDataUri)) {
      const uploadStream = client.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary failed without error result.'));
          }
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format || 'bin',
            width: result.width,
            height: result.height,
            fileSize: result.bytes,
            folder: result.folder || folder,
            originalFilename: options.originalFilename || result.original_filename || result.public_id,
            createdAt: result.created_at || new Date().toISOString()
          });
        }
      );
      uploadStream.end(fileBufferOrDataUri);
    } else {
      // String or Data URI upload
      client.uploader.upload(fileBufferOrDataUri, uploadOptions, (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed without error result.'));
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          format: result.format || 'bin',
          width: result.width,
          height: result.height,
          fileSize: result.bytes,
          folder: result.folder || folder,
          originalFilename: options.originalFilename || result.original_filename || result.public_id,
          createdAt: result.created_at || new Date().toISOString()
        });
      });
    }
  });
}

/**
 * Delete asset from Cloudinary by publicId
 */
export async function deleteFromCloudinary(publicId: string, resourceType: string = 'image'): Promise<boolean> {
  if (!isCloudinaryConfigured()) return false;
  try {
    const client = getCloudinaryClient();
    const result = await client.uploader.destroy(publicId, {
      resource_type: resourceType as any,
      invalidate: true
    });
    return result.result === 'ok' || result.result === 'not found';
  } catch (err) {
    console.error(`[Cloudinary] Delete error for publicId ${publicId}:`, err);
    return false;
  }
}

/**
 * Generate optimized and transformed image/video URL
 */
export function buildOptimizedCloudinaryUrl(
  publicIdOrUrl: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
    gravity?: string;
  } = {}
): string {
  if (!publicIdOrUrl) return '';
  if (!publicIdOrUrl.includes('res.cloudinary.com')) {
    return publicIdOrUrl;
  }

  // If it's already a full cloudinary URL, insert transformations after /upload/
  const { width, height, crop = 'limit', quality = 'auto', format = 'auto', gravity } = transformations;
  const parts: string[] = [];
  
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);

  const transformString = parts.join(',');

  if (publicIdOrUrl.includes('/upload/')) {
    const [base, rest] = publicIdOrUrl.split('/upload/');
    // Avoid double transformation if already present
    if (rest.startsWith('w_') || rest.startsWith('c_') || rest.startsWith('q_') || rest.startsWith('f_')) {
      return publicIdOrUrl;
    }
    return `${base}/upload/${transformString}/${rest}`;
  }

  return publicIdOrUrl;
}
