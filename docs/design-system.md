# SkillR Quest UX — Design System

> Game-style design system for the Future SkillR learning journey platform.
> "Professional productivity tool meets modern RPG HUD."

**Created:** 2026-02-19
**Status:** active

---

## 1. Design Principles

### Core Experience Goals

1. **Progress is always visible** — the user never wonders "where am I?"
2. **User feels like leveling up** — every interaction builds momentum
3. **Interface feels alive but not childish** — modern gaming, not cartoon
4. **Compact like a pro tool** — no wasted space, every pixel earns its place
5. **Modern gaming aesthetic** — dark-mode first, neon accents, glass surfaces
6. **Performance over decoration** — speed and clarity beat visual noise

### Design Tone

Professional. Motivating. Alive.

Inspirations: Duolingo (gamification), Linear.app (polish), Notion (clarity), modern game HUD interfaces.

---

## 2. Color System

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `skillr-blue` | `#4DA3FF` | Primary actions, links, active states |
| `skillr-purple` | `#7B61FF` | Accent, gradients, brand identity |
| `skillr-cyan` | `#22D3EE` | Glow effects, energy, focus states |

**Primary Gradient:**

```css
background: linear-gradient(135deg, #4DA3FF 0%, #7B61FF 100%);
```

### Background Layers

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0B0F1A` | App background, deepest layer |
| `bg-secondary` | `#111827` | Content area background |
| `bg-panel` | `#161E2E` | Cards, panels, elevated surfaces |
| `bg-elevated` | `#1C2639` | Modals, dropdowns, popovers |

### Game Feedback Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | XP gain, completion, correct answers |
| `warning` | `#F59E0B` | Attention, time running out |
| `error` | `#EF4444` | Failed, incorrect, connection errors |
| `energy` | `#06B6D4` | Focus mode, active session |
| `gold` | `#FBBF24` | Rewards, achievements, premium |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#E6EDF7` | Headings, body text, primary content |
| `text-secondary` | `#9CA3AF` | Labels, descriptions, meta info |
| `text-muted` | `#6B7280` | Placeholders, disabled, timestamps |

### Tailwind Config

```js
theme: {
  extend: {
    colors: {
      skillr: {
        blue: '#4DA3FF',
        purple: '#7B61FF',
        cyan: '#22D3EE',
      },
      bg: {
        primary: '#0B0F1A',
        secondary: '#111827',
        panel: '#161E2E',
        elevated: '#1C2639',
      },
      game: {
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        energy: '#06B6D4',
        gold: '#FBBF24',
      },
    },
  },
}
```

---

## 3. Typography

### Font Stack

| Role | Font | Fallback |
|------|------|----------|
| **Headings** | Inter | system-ui, sans-serif |
| **Body** | Inter | system-ui, sans-serif |
| **Game accents** | Space Grotesk | Inter, sans-serif |
| **Badges / XP** | Orbitron | Space Grotesk, monospace |
| **Code / Mono** | JetBrains Mono | monospace |

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 28-32px | SemiBold (600) | 1.2 | Page titles |
| H2 | 22-24px | SemiBold (600) | 1.3 | Section headers |
| H3 | 18px | Medium (500) | 1.4 | Card titles, station names |
| Body | 14-16px | Regular (400) | 1.5 | Content, chat messages |
| Meta | 12px | Medium (500) | 1.4 | Labels, timestamps, XP values |
| Badge | 11px | Bold (700) | 1.0 | Level badges, status pills |

### Rules

- Headings: tracking tight (`letter-spacing: -0.02em`)
- Body: tracking normal
- Game accents (XP, level): use Space Grotesk or Orbitron sparingly
- Never use Orbitron for body text

---

## 4. Spacing System

**Base unit:** 4px grid.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon padding, tight gaps |
| `sm` | 8px | Inline spacing, button padding |
| `md` | 12px | Card padding, list gaps |
| `base` | 16px | Section spacing, input padding |
| `lg` | 20px | Card margins |
| `xl` | 24px | Section margins |
| `2xl` | 32px | Page sections |
| `3xl` | 40px | Major section breaks |

### Rule

> Never waste vertical space. Game UIs are compact.

- Top bar: max 56px height
- Card padding: 12-16px
- Button padding: 8px 16px
- Gaps between elements: 8-12px

---

## 5. Component Library

### Cards — Glass Gaming Style

```css
.card-panel {
  background: rgba(28, 38, 57, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(123, 97, 255, 0.15);
  border-radius: 14px;
}

.card-panel:hover {
  border-color: rgba(123, 97, 255, 0.35);
  box-shadow: 0 0 20px rgba(123, 97, 255, 0.15);
}
```

**Tailwind equivalent:**

```
bg-bg-panel/70 backdrop-blur-md border border-skillr-purple/15 rounded-[14px]
hover:border-skillr-purple/35 hover:shadow-[0_0_20px_rgba(123,97,255,0.15)]
```

### Buttons

#### Primary (Action / Continue / Start)

```
bg-gradient-to-r from-skillr-blue to-skillr-purple
text-white font-medium
px-5 py-2.5 rounded-xl
shadow-lg shadow-skillr-blue/30
hover:scale-[1.03] hover:shadow-skillr-blue/40
active:scale-[0.98]
transition-all duration-150
```

#### Secondary

```
bg-bg-panel border border-white/10
text-text-primary font-medium
px-4 py-2 rounded-xl
hover:border-skillr-blue/40
transition-all duration-150
```

#### Ghost

```
bg-transparent text-text-secondary
px-3 py-2 rounded-lg
hover:bg-white/5 hover:text-text-primary
transition-all duration-150
```

#### XP / Reward Variant

```
bg-game-gold/10 border border-game-gold/30
text-amber-300 font-medium
px-4 py-2 rounded-xl
hover:bg-game-gold/20
```

#### Danger

```
bg-game-error/10 border border-game-error/30
text-red-300 font-medium
px-4 py-2 rounded-xl
hover:bg-game-error/20
```

### Input Fields

```
bg-bg-primary border border-white/10
text-text-primary placeholder:text-text-muted
px-4 py-2.5 rounded-xl
focus:border-skillr-blue/50 focus:ring-1 focus:ring-skillr-blue/20
focus:outline-none
transition-all duration-150
```

### Chat Bubbles

#### User Message

```
bg-skillr-blue/20 border border-skillr-blue/20
text-text-primary
rounded-2xl rounded-br-md
px-4 py-3
max-w-[80%] self-end
```

#### Assistant Message

```
bg-bg-panel border border-white/5
text-text-primary
rounded-2xl rounded-bl-md
px-4 py-3
max-w-[80%] self-start
```

---

## 6. Gamification UI Elements

### Level Badge

Small rounded pill with gradient border and subtle glow.

```
inline-flex items-center gap-1
bg-skillr-purple/15 border border-skillr-purple/30
text-skillr-purple text-[11px] font-bold
px-2.5 py-0.5 rounded-full
shadow-[0_0_8px_rgba(123,97,255,0.2)]
```

Content: `Lvl 12` or icon + number.

### XP Progress Bar

Animated gradient fill with optional shimmer.

```html
<!-- Container -->
<div class="h-2 bg-bg-primary rounded-full overflow-hidden">
  <!-- Fill -->
  <div class="h-full bg-gradient-to-r from-skillr-cyan to-skillr-blue
              rounded-full transition-all duration-500 ease-out
              relative overflow-hidden">
    <!-- Shimmer (optional) -->
    <div class="absolute inset-0 bg-gradient-to-r from-transparent
                via-white/20 to-transparent animate-shimmer" />
  </div>
</div>
```

XP label: `2,450 / 3,000 XP` in meta text, Space Grotesk.

### Quest / Module Card

```
┌─────────────────────────────────────┐
│  [icon]  Module Title        [75%]  │
│  Subtitle / description             │
│  ████████████░░░░  +120 XP          │
│  Status: In Progress                │
└─────────────────────────────────────┘
```

- Progress bar inside card
- XP reward shown in gold accent
- Status as a colored pill

### Achievement Badge

```
inline-flex items-center gap-2
bg-game-gold/10 border border-game-gold/20
px-3 py-1.5 rounded-lg
```

Contains: icon (trophy/star) + achievement title in gold text.

### Streak Counter

```
inline-flex items-center gap-1.5
text-game-energy font-medium text-sm
```

Content: flame icon + `5 Tage` (days streak).

---

## 7. Top Panel (HUD Layout)

### Desktop (>768px)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]  Journey: VUCA Reise          ████░░ 2,450 XP    [=] [A] │
│          Module 3 von 12                   Lvl 12       [N] [P] │
└──────────────────────────────────────────────────────────────────┘

Logo     = SkillR brand mark (compact)
Journey  = Current journey title + module
Progress = XP bar + numeric value
Lvl      = Level badge
[=]      = Menu / settings (ghost button)
[A]      = Avatar (small circle, 32px)
[N]      = Notification bell (if needed)
[P]      = Profile dropdown trigger
```

**Height:** 56px max. Glass panel style.

### Mobile (<768px)

```
┌──────────────────────────────────┐
│ [Logo]  ████░░ Lvl 12      [=]  │
└──────────────────────────────────┘
```

Journey context and XP details move to a slide-down panel or the main content area.

### Admin Access

Admin is NOT a primary button. It appears as:
- A small role badge next to the avatar: `Admin` pill in purple
- A menu item in the profile dropdown
- Never dominates the navigation

---

## 8. Motion and Interaction

### Timing

| Type | Duration | Easing |
|------|----------|--------|
| Hover states | 150ms | ease-out |
| Panel transitions | 200ms | ease-in-out |
| Progress bar fills | 500ms | ease-out |
| Page transitions | 250ms | ease-in-out |
| XP gain animation | 600ms | cubic-bezier(0.34, 1.56, 0.64, 1) |

### Micro-interactions

| Element | Hover | Active | Notes |
|---------|-------|--------|-------|
| Primary button | `scale(1.03)` + glow increase | `scale(0.98)` | Subtle bounce feel |
| Card | Border glow + slight lift | — | Glow uses brand purple |
| Avatar | Ring glow | — | Indicates online/active |
| XP number | Count-up animation | — | On XP gain |
| Level badge | Pulse glow | — | On level up |
| Chat bubble | Fade-in + slide-up | — | 120ms staggered |

### Completion Celebrations

- XP gain: Number floats up and fades (+120 XP)
- Level up: Badge pulses with expanding glow ring
- Quest complete: Confetti burst (subtle, 1-2 seconds)
- Achievement: Toast notification with gold border slides in

### CSS Keyframes

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes float-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-24px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(123, 97, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.5); }
}
```

---

## 9. Icon System

### Primary Icon Set: Lucide

Source: https://lucide.dev

- Modern, clean, consistent stroke weight
- React component library available (`lucide-react`)
- Customizable size and stroke width

### Secondary: Phosphor Icons

Source: https://phosphoricons.com

- Multiple weights (thin, light, regular, bold, fill, duotone)
- Slightly more personality for gamified elements
- Use for badges and achievement icons

### Game Icons: game-icons.net

Source: https://game-icons.net

- Use ONLY for achievements, badges, rewards
- Not for core navigation or UI elements

### Semantic Icon Mapping

| Feature | Icon Name | Set |
|---------|-----------|-----|
| Profile | `user` | Lucide |
| Progress | `bar-chart-2` | Lucide |
| Journey / Map | `map` | Lucide |
| Module | `layers` | Lucide |
| XP / Energy | `zap` | Lucide |
| Level | `star` | Lucide |
| Achievement | `trophy` | Lucide |
| Admin | `shield` | Lucide |
| Settings | `settings` | Lucide |
| Notifications | `bell` | Lucide |
| Logout | `log-out` | Lucide |
| Learning / AI | `sparkles` | Lucide |
| Voice / Audio | `mic` | Lucide |
| Send | `send` | Lucide |
| Back | `chevron-left` | Lucide |
| Menu | `menu` | Lucide |
| Close | `x` | Lucide |
| Streak | `flame` | Lucide |
| Timer | `clock` | Lucide |
| Check | `check-circle` | Lucide |
| Error | `alert-circle` | Lucide |

### Icon Sizing

| Context | Size | Stroke |
|---------|------|--------|
| Inline with text | 16px | 2px |
| Button icon | 18px | 2px |
| Navigation | 20px | 1.5px |
| Feature icon | 24px | 1.5px |
| Hero / empty state | 32-48px | 1.5px |

---

## 10. Shadows and Elevation

| Level | Shadow | Usage |
|-------|--------|-------|
| None | — | Flat elements, text |
| Low | `0 1px 3px rgba(0,0,0,0.3)` | Cards, panels |
| Medium | `0 4px 12px rgba(0,0,0,0.4)` | Dropdowns, popovers |
| High | `0 8px 24px rgba(0,0,0,0.5)` | Modals, dialogs |
| Glow (brand) | `0 0 20px rgba(123,97,255,0.15)` | Active cards, hover |
| Glow (energy) | `0 0 16px rgba(34,211,238,0.2)` | Active session, focus |
| Glow (gold) | `0 0 16px rgba(251,191,36,0.2)` | Rewards, achievements |

---

## 11. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Tags, small pills |
| `md` | 8px | Inputs, small buttons |
| `lg` | 12px | Cards, larger buttons |
| `xl` | 14px | Panels, modal corners |
| `2xl` | 16px | Chat bubbles |
| `full` | 9999px | Avatars, badges, pills |

---

## 12. Layout Patterns

### Station / Chat View

```
┌─────────────────────────────────────────┐
│  HUD Top Bar (56px)                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Station Header                 │    │
│  │  [back] Dein Coach   Step 1/3   │    │
│  ├─────────────────────────────────┤    │
│  │                                 │    │
│  │  Chat Messages                  │    │
│  │  (scrollable area)              │    │
│  │                                 │    │
│  ├─────────────────────────────────┤    │
│  │  [input field]         [send]   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Zurueck zur Hauptseite]               │
└─────────────────────────────────────────┘
```

### Journey Selection (Globe)

```
┌─────────────────────────────────────────┐
│  HUD Top Bar                            │
├─────────────────────────────────────────┤
│                                         │
│  Waehle deine Reise                     │
│                                         │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ VUCA  │  │Founder│  │ Self  │       │
│  │Journey│  │Journey│  │Learn  │       │
│  │       │  │       │  │       │       │
│  │ [>>>] │  │ [>>>] │  │ [>>>] │       │
│  └───────┘  └───────┘  └───────┘       │
│                                         │
│  Profile Summary Card                   │
│  Interests / Strengths / Style          │
└─────────────────────────────────────────┘
```

### Dashboard / VUCA Curriculum

```
┌─────────────────────────────────────────┐
│  HUD Top Bar                            │
├─────────────────────────────────────────┤
│                                         │
│  VUCA Lehrplan: [Goal]                  │
│  ████████░░░░░░░░  4/12 Module          │
│                                         │
│  ┌─ V ──────────────────────────────┐   │
│  │ [x] Modul 1   [x] Modul 2       │   │
│  │ [ ] Modul 3                      │   │
│  ├─ U ──────────────────────────────┤   │
│  │ [ ] Modul 4   [ ] Modul 5 ...   │   │
│  ├─ C ──────────────────────────────┤   │
│  │ ...                              │   │
│  ├─ A ──────────────────────────────┤   │
│  │ ...                              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 13. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, bottom nav, compact HUD |
| Tablet | 640-1024px | Centered content, side panels collapse |
| Desktop | > 1024px | Full layout, side-by-side panels |

### Mobile Adaptations

- HUD collapses to: logo + XP bar + avatar
- Journey context moves to content area
- Chat input sticks to bottom with safe area padding
- Cards stack vertically, full-width
- Navigation via bottom tab bar or hamburger menu

---

## 14. Sound Design (Optional)

Micro-sound feedback for enhanced game feel:

| Event | Sound | Duration |
|-------|-------|----------|
| Button click | Soft tap | 50ms |
| XP gain | Rising chime | 300ms |
| Level up | Achievement fanfare | 800ms |
| Quest complete | Success chord | 500ms |
| Error | Low thud | 200ms |
| Message sent | Whoosh | 150ms |
| Message received | Soft ping | 100ms |

Implementation: Use Web Audio API with preloaded buffers. All sounds must be optional (user preference `voiceEnabled`).

---

## 15. Accessibility

Despite the game aesthetic, accessibility is non-negotiable:

- **Contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- **Focus states:** Visible focus rings using `skillr-blue` glow
- **Motion:** Respect `prefers-reduced-motion` — disable animations
- **Screen readers:** All icons have `aria-label`, progress bars have `aria-valuenow`
- **Keyboard:** Full keyboard navigation for all interactive elements
- **Color-blind safe:** Never use color alone to convey status — always pair with icons or text

---

## 16. File Organization

```
frontend/
  styles/
    tokens.css          <- CSS custom properties (colors, spacing, etc.)
  components/
    ui/
      Button.tsx        <- Primary, Secondary, Ghost, XP variants
      Card.tsx          <- Glass panel card
      Badge.tsx         <- Level badge, status pills
      ProgressBar.tsx   <- XP progress bar with shimmer
      Input.tsx         <- Text input, search
      Avatar.tsx        <- User avatar with level ring
    game/
      XPCounter.tsx     <- Animated XP display
      LevelBadge.tsx    <- Level indicator with glow
      QuestCard.tsx     <- Module/quest card with progress
      AchievementToast.tsx <- Achievement notification
    layout/
      HUD.tsx           <- Top bar / game HUD
      MobileNav.tsx     <- Bottom navigation for mobile
```

---

## Related

- TC-023: Chat Dialog Architecture
- FR-026: Micro-session UX
- FR-032: Transit Audio Mode
- DC-001: VUCA Bingo Matrix
