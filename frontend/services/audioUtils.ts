/**
 * Audio utility functions for converting between PCM, WAV, and base64 formats.
 * Used by Gemini TTS (PCM→WAV playback) and STT (WebM→WAV→base64 upload).
 */

/**
 * Convert base64-encoded raw PCM (16-bit signed, mono) to a playable WAV Blob.
 * Gemini TTS returns raw PCM — this wraps it with a 44-byte RIFF/WAV header.
 */
export function pcmToWavBlob(base64Pcm: string, sampleRate = 24000): Blob {
  const raw = atob(base64Pcm);
  const pcmBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    pcmBytes[i] = raw.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBytes.length;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmBytes, headerSize);

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Convert a recorded audio Blob (WebM/Opus or mp4) to a base64-encoded WAV string.
 * Uses AudioContext to decode, then re-encodes as 16-bit mono PCM WAV.
 */
export async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Float32 [-1,1] → Int16
    const pcmData = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.byteLength;
    const headerSize = 44;

    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(new Uint8Array(pcmData.buffer), headerSize);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < wavBytes.length; i++) {
      binary += String.fromCharCode(wavBytes[i]);
    }
    return btoa(binary);
  } finally {
    await audioCtx.close();
  }
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
