import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const FRONTEND_DIR = resolve(__dirname, '..');
const COMPONENTS_DIR = join(FRONTEND_DIR, 'components');

/**
 * Recursively collect all .tsx files under a directory.
 */
function collectTsxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Extract all className strings from a TSX file content.
 */
function extractClassNames(content: string): string[] {
  const matches: string[] = [];
  // Match className="..." and className={`...`}
  const staticRe = /className="([^"]+)"/g;
  const dynamicRe = /className=\{`([^`]+)`\}/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(content)) !== null) matches.push(m[1]);
  while ((m = dynamicRe.exec(content)) !== null) matches.push(m[1]);
  return matches;
}

describe('FR-070: Mobile-First Responsive Design', () => {
  describe('AC6: Voice toggle visibility on mobile', () => {
    it('ChatInput voice output toggle is NOT hidden on mobile', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'shared', 'ChatInput.tsx'),
        'utf-8',
      );
      // The voice toggle button should not have "hidden sm:flex" — it should be visible always
      expect(content).not.toMatch(/className=.*hidden\s+sm:flex.*voiceEnabled/s);
      // It should use "flex" without "hidden"
      const voiceToggleSection = content.slice(
        content.indexOf('onToggleVoice'),
        content.indexOf('onToggleVoice') + 500,
      );
      // Find the className near the voice toggle button
      const classNames = extractClassNames(voiceToggleSection);
      const hasHiddenSmFlex = classNames.some(
        (cn) => cn.includes('hidden') && cn.includes('sm:flex'),
      );
      expect(hasHiddenSmFlex).toBe(false);
    });
  });

  describe('AC3: iOS zoom prevention (font-size >= 16px)', () => {
    it('globals.css contains input font-size rule', () => {
      const css = readFileSync(
        join(FRONTEND_DIR, 'styles', 'globals.css'),
        'utf-8',
      );
      expect(css).toContain('input, textarea, select');
      expect(css).toContain('font-size: 16px');
    });

    it('EmailBookingForm email input uses text-base (not text-sm)', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'intro', 'EmailBookingForm.tsx'),
        'utf-8',
      );
      // The email input should use text-base
      const inputSection = content.slice(
        content.indexOf('type="email"'),
        content.indexOf('type="email"') + 300,
      );
      expect(inputSection).toContain('text-base');
      expect(inputSection).not.toContain('text-sm');
    });

    it('BusinessConfigTab inputs use text-base', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'admin', 'BusinessConfigTab.tsx'),
        'utf-8',
      );
      // Input fields should use text-base
      const inputMatches = content.match(/className="[^"]*text-base[^"]*"/g);
      expect(inputMatches).not.toBeNull();
      expect(inputMatches!.length).toBeGreaterThan(0);
    });
  });

  describe('AC2: No horizontal scroll at 375px', () => {
    it('globals.css contains overflow-x: hidden rule', () => {
      const css = readFileSync(
        join(FRONTEND_DIR, 'styles', 'globals.css'),
        'utf-8',
      );
      expect(css).toContain('overflow-x: hidden');
    });
  });

  describe('AC1: Touch targets >= 44px', () => {
    const MIN_TOUCH_SIZE = 44;

    it('Layout audio mode toggle has min-w-[44px] min-h-[44px]', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'Layout.tsx'),
        'utf-8',
      );
      // Look for the audio toggle button className near "Audio-Modus"
      const audioIdx = content.indexOf('Audio-Modus');
      expect(audioIdx).toBeGreaterThan(-1);
      const audioSection = content.slice(Math.max(0, audioIdx - 400), audioIdx);
      expect(audioSection).toContain('min-w-[44px]');
      expect(audioSection).toContain('min-h-[44px]');
    });

    it('CookieConsentBanner buttons have min-h-[44px]', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'CookieConsentBanner.tsx'),
        'utf-8',
      );
      const classNames = extractClassNames(content);
      const buttonClasses = classNames.filter((cn) => cn.includes('rounded-xl'));
      const withMinHeight = buttonClasses.filter((cn) =>
        cn.includes(`min-h-[${MIN_TOUCH_SIZE}px]`),
      );
      expect(withMinHeight.length).toBeGreaterThanOrEqual(2);
    });

    it('Legal footer links have min-h-[44px]', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'legal', 'LegalFooter.tsx'),
        'utf-8',
      );
      expect(content).toContain('min-h-[44px]');
    });

    it('AdminConsole back button has min-h-[44px]', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'admin', 'AdminConsole.tsx'),
        'utf-8',
      );
      const classNames = extractClassNames(content);
      const backButton = classNames.find(
        (cn) => cn.includes('glass') && cn.includes('min-h-[44px]'),
      );
      expect(backButton).toBeDefined();
    });

    it('WaitingSection carousel dots are wrapped in touch-friendly buttons', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'intro', 'WaitingSection.tsx'),
        'utf-8',
      );
      // Coach dots should be wrapped in w-8 h-8 buttons
      expect(content).toContain('w-8 h-8');
    });
  });

  describe('AC5: PWA "Add to Home Screen"', () => {
    it('index.html contains apple-touch-icon link', () => {
      const html = readFileSync(
        join(FRONTEND_DIR, 'index.html'),
        'utf-8',
      );
      expect(html).toContain('apple-touch-icon');
    });

    it('manifest.json contains id and scope', () => {
      const manifest = JSON.parse(
        readFileSync(join(FRONTEND_DIR, 'public', 'manifest.json'), 'utf-8'),
      );
      expect(manifest.id).toBe('/');
      expect(manifest.scope).toBe('/');
    });
  });

  describe('AC8: Radar chart responsive sizing', () => {
    it('CombinedProfile uses 3-tier responsive sizing for radar chart', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'CombinedProfile.tsx'),
        'utf-8',
      );
      // Should reference window.innerWidth < 400 for smallest tier
      expect(content).toContain('innerWidth < 400');
      // Should have 220 for the smallest breakpoint
      expect(content).toContain('220');
      // Should have 280 for medium
      expect(content).toContain('280');
      // Should have 350 for desktop
      expect(content).toContain('350');
    });
  });

  describe('ChatBubble font sizing', () => {
    it('uses sm:text-base (not sm:text-sm) for proper mobile scaling', () => {
      const content = readFileSync(
        join(COMPONENTS_DIR, 'shared', 'ChatBubble.tsx'),
        'utf-8',
      );
      expect(content).toContain('sm:text-base');
      expect(content).not.toContain('sm:text-sm');
    });
  });
});
