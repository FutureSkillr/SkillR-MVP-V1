/** LFS Upload Service (FR-131)
 *  XHR-based upload to /api/lfs/produce with progress tracking and retry.
 *  Follows the E72 Browser LFS SDK pattern. */

export interface LfsEnvelope {
  kfs_lfs: string;
  bucket: string;
  key: string;
  size: number;
  sha256: string;
  content_type: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

const TOKEN_KEY = 'skillr-token';
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5 MB

/**
 * Upload a file to the LFS proxy.
 * Returns the LFS envelope on success.
 */
export function lfsUpload(
  file: File,
  topic: string,
  key: string,
  onProgress?: (progress: UploadProgress) => void,
  maxRetries = 3,
): Promise<LfsEnvelope> {
  return sendWithRetry(file, topic, key, onProgress, maxRetries, 0);
}

function sendWithRetry(
  file: File,
  topic: string,
  key: string,
  onProgress: ((progress: UploadProgress) => void) | undefined,
  maxRetries: number,
  attempt: number,
): Promise<LfsEnvelope> {
  return uploadWithProgress(file, topic, key, onProgress).catch((err) => {
    if (attempt < maxRetries && isRetryable(err)) {
      const delay = Math.min(200 * Math.pow(2, attempt), 5000);
      return new Promise<LfsEnvelope>((resolve) =>
        setTimeout(() => resolve(sendWithRetry(file, topic, key, onProgress, maxRetries, attempt + 1)), delay),
      );
    }
    throw err;
  });
}

function isRetryable(err: unknown): boolean {
  if (err instanceof LfsUploadError) {
    return err.status >= 500 || err.status === 0;
  }
  return false;
}

export class LfsUploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'LfsUploadError';
  }
}

function uploadWithProgress(
  file: File,
  topic: string,
  key: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<LfsEnvelope> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/lfs/produce');

    // Auth header
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // LFS headers
    xhr.setRequestHeader('X-Kafka-Topic', topic);
    xhr.setRequestHeader('X-Kafka-Key', btoa(key));
    xhr.setRequestHeader('X-LFS-Size', String(file.size));
    xhr.setRequestHeader('X-LFS-Mode', file.size >= MULTIPART_THRESHOLD ? 'multipart' : 'single');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new LfsUploadError('Invalid response from LFS proxy', xhr.status));
        }
      } else {
        reject(new LfsUploadError(`Upload failed: HTTP ${xhr.status}`, xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(new LfsUploadError('Network error during upload', 0));
    };

    xhr.onabort = () => {
      reject(new LfsUploadError('Upload aborted', 0));
    };

    xhr.send(file);
  });
}
