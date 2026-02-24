import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPortfolioEntries,
  createPortfolioEntry,
  updatePortfolioEntry,
  deletePortfolioEntry,
  createDemoEntries,
  exportPortfolio,
  fetchPublicPortfolio,
} from './portfolio';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage for getAuthHeaders
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('listPortfolioEntries', () => {
  it('returns entries on success', async () => {
    const entries = [{ id: '1', title: 'Test' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entries }),
    });

    const result = await listPortfolioEntries();
    expect(result).toEqual(entries);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/entries', expect.any(Object));
  });

  it('returns empty array on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await listPortfolioEntries();
    expect(result).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const result = await listPortfolioEntries();
    expect(result).toEqual([]);
  });
});

describe('createPortfolioEntry', () => {
  it('creates and returns entry', async () => {
    const entry = { id: '1', title: 'New', category: 'project', visibility: 'public', tags: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(entry),
    });

    const result = await createPortfolioEntry({
      title: 'New',
      description: '',
      category: 'project',
      visibility: 'public',
      tags: [],
    });
    expect(result).toEqual(entry);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/entries', {
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: expect.any(String),
    });
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'title is required' }),
    });

    await expect(
      createPortfolioEntry({ title: '', description: '', category: 'project', visibility: 'public', tags: [] }),
    ).rejects.toThrow('title is required');
  });
});

describe('updatePortfolioEntry', () => {
  it('updates and returns entry', async () => {
    const entry = { id: '1', title: 'Updated' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(entry),
    });

    const result = await updatePortfolioEntry('1', { title: 'Updated' });
    expect(result).toEqual(entry);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/entries/1', expect.objectContaining({ method: 'PUT' }));
  });
});

describe('deletePortfolioEntry', () => {
  it('deletes without error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deletePortfolioEntry('1');
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/entries/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'not found' }),
    });

    await expect(deletePortfolioEntry('1')).rejects.toThrow('not found');
  });
});

describe('createDemoEntries', () => {
  it('returns created count', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ created: 3 }),
    });

    const result = await createDemoEntries();
    expect(result.created).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/entries/demo', expect.objectContaining({ method: 'POST' }));
  });
});

describe('exportPortfolio', () => {
  it('returns blob for HTML export', async () => {
    const blob = new Blob(['<html></html>'], { type: 'text/html' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(blob),
    });

    const result = await exportPortfolio('html');
    expect(result).toBe(blob);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/export?format=html', expect.any(Object));
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(exportPortfolio('zip')).rejects.toThrow('Export fehlgeschlagen.');
  });
});

describe('fetchPublicPortfolio', () => {
  it('returns portfolio on success', async () => {
    const portfolio = { userId: 'u1', displayName: 'Test', entries: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(portfolio),
    });

    const result = await fetchPublicPortfolio('u1');
    expect(result).toEqual(portfolio);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/portfolio/page/u1');
  });

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await fetchPublicPortfolio('u1');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const result = await fetchPublicPortfolio('u1');
    expect(result).toBeNull();
  });
});
