import { v2 as cloudinary } from 'cloudinary';

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Loads Cloudinary credentials into the running process and reports whether
 * uploads can proceed.
 *
 * Order of precedence:
 *   1. Admin → Settings → Integrations → Cloudinary (encrypted in Neon). The
 *      integration store itself falls back to CLOUDINARY_* env vars per field.
 *   2. CLOUDINARY_* environment variables.
 *   3. The older Layout-tab fields (layout settings), kept for compatibility.
 *
 * Everything downstream still reads process.env, so the resolved values are
 * written there; a change saved in the dashboard takes effect on the next call
 * without a restart or redeploy.
 */
export async function ensureCloudinaryConfigured(): Promise<boolean> {
  try {
    const { getIntegrationCredentials } = await import('./integrations/store');
    const { values } = await getIntegrationCredentials('cloudinary');
    const cloudName = String(values.cloudName || '').trim();
    const apiKey = String(values.apiKey || '').trim();
    const apiSecret = String(values.apiSecret || '').trim();
    if (cloudName && apiKey && apiSecret) {
      process.env.CLOUDINARY_CLOUD_NAME = cloudName;
      process.env.CLOUDINARY_API_KEY = apiKey;
      process.env.CLOUDINARY_API_SECRET = apiSecret;
    }
  } catch (err: any) {
    console.warn('[Cloudinary] Could not read Integrations settings:', err?.message || err);
  }

  if (!isCloudinaryConfigured()) {
    try {
      // Populates CLOUDINARY_* from the legacy layout-settings fields if present.
      const { fetchLayoutSettings } = await import('../../serverDb');
      await fetchLayoutSettings();
    } catch (_e) {}
  }

  return isCloudinaryConfigured();
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
  if (!(await ensureCloudinaryConfigured())) {
    throw new Error('Cloudinary is not configured. Add the cloud name, API key and API secret in Admin → Settings → Integrations → Cloudinary.');
  }
  const client = getCloudinaryClient();
  const folder = options.folder || 'storefront_media';
  const resourceType = options.resourceType || 'auto';

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
  if (!(await ensureCloudinaryConfigured())) return false;
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
