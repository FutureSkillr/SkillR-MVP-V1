import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lfsUpload, LfsUploadError } from './lfsUpload';

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

// Mock XMLHttpRequest
class MockXHR {
  method = '';
  url = '';
  headers: Record<string, string> = {};
  upload = { onprogress: null as ((e: unknown) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 200;
  responseText = '';
  sentData: unknown = null;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  send(data: unknown) {
    this.sentData = data;
    // Auto-resolve in next tick
    setTimeout(() => this.onload?.(), 0);
  }
}

let mockXhr: MockXHR;

beforeEach(() => {
  mockXhr = new MockXHR();
  vi.stubGlobal('XMLHttpRequest', vi.fn(() => mockXhr));
});

describe('lfsUpload', () => {
  it('sends correct headers for small files', async () => {
    mockXhr.status = 200;
    mockXhr.responseText = JSON.stringify({
      kfs_lfs: 'v1',
      bucket: 'test',
      key: 'path/file.mp4',
      size: 1024,
      sha256: 'abc',
      content_type: 'video/mp4',
    });

    const file = new File(['test'], 'video.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 1024 });

    const result = await lfsUpload(file, 'my-topic', 'my-key', undefined, 0);

    expect(mockXhr.method).toBe('POST');
    expect(mockXhr.url).toBe('/api/lfs/produce');
    expect(mockXhr.headers['Authorization']).toBe('Bearer mock-token');
    expect(mockXhr.headers['X-Kafka-Topic']).toBe('my-topic');
    expect(mockXhr.headers['X-Kafka-Key']).toBe(btoa('my-key'));
    expect(mockXhr.headers['X-LFS-Size']).toBe('1024');
    expect(mockXhr.headers['X-LFS-Mode']).toBe('single');
    expect(mockXhr.headers['Content-Type']).toBe('video/mp4');
    expect(result.bucket).toBe('test');
  });

  it('uses multipart mode for large files', async () => {
    mockXhr.status = 200;
    mockXhr.responseText = JSON.stringify({
      kfs_lfs: 'v1', bucket: 'test', key: 'path/big.mp4',
      size: 10_000_000, sha256: 'def', content_type: 'video/mp4',
    });

    const file = new File(['test'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 10_000_000 });

    await lfsUpload(file, 'topic', 'key', undefined, 0);

    expect(mockXhr.headers['X-LFS-Mode']).toBe('multipart');
  });

  it('calls onProgress callback', async () => {
    mockXhr.status = 200;
    mockXhr.responseText = JSON.stringify({
      kfs_lfs: 'v1', bucket: 'test', key: 'f', size: 100, sha256: '', content_type: '',
    });

    // Override send to trigger progress
    mockXhr.send = function (data: unknown) {
      this.sentData = data;
      if (this.upload.onprogress) {
        this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
      }
      setTimeout(() => this.onload?.(), 0);
    };

    const progressFn = vi.fn();
    const file = new File(['test'], 'v.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 100 });

    await lfsUpload(file, 'topic', 'key', progressFn, 0);

    expect(progressFn).toHaveBeenCalledWith({ loaded: 50, total: 100, percent: 50 });
  });

  it('rejects on HTTP error', async () => {
    mockXhr.status = 500;
    mockXhr.responseText = 'server error';

    const file = new File(['test'], 'v.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 100 });

    await expect(lfsUpload(file, 'topic', 'key', undefined, 0)).rejects.toThrow(LfsUploadError);
  });

  it('rejects on network error', async () => {
    mockXhr.send = function () {
      setTimeout(() => this.onerror?.(), 0);
    };

    const file = new File(['test'], 'v.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 100 });

    await expect(lfsUpload(file, 'topic', 'key', undefined, 0)).rejects.toThrow('Network error');
  });
});
