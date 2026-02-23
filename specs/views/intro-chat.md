# View: intro-chat

**Route:** `intro-chat` (internal view state)
**Component:** `IntroChat.tsx`
**Layout:** None (full-screen, no Layout chrome)

## Structure

The IntroChat view follows the same centered page pattern as `intro-coach-select`.
The chat dialog is centered on the page with a back link and headline above it.

```
┌─────────────────────────────────────────────────────┐
│                    (centered)                        │
│                                                     │
│  ← Zurück                              Weiter >     │
│                                                     │
│              Vorstellungsrunde                       │
│         (gradient-text, bold, large)                 │
│                                                     │
│   Erfahre wie wir gemeinsam lernen wollen...        │
│         (text-slate-400, centered)                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Chat Dialog (glass, rounded-2xl)            │    │
│  │                                             │    │
│  │ ┌─ Header ──────────────────────────────┐   │    │
│  │ │ 🎨 Susi              ●●●●○○○○ Phase  │   │    │
│  │ │    Kunstatelier Köln                  │   │    │
│  │ └──────────────────────────────────────-┘   │    │
│  │                                             │    │
│  │  Messages area (scrollable)                 │    │
│  │                                             │    │
│  │  ┌─ Assistant bubble ─────────────────┐     │    │
│  │  │ Hallo! Ich bin Susi...             │     │    │
│  │  └────────────────────────────────────┘     │    │
│  │                                             │    │
│  │              ┌─ User bubble ──────────┐     │    │
│  │              │ Hi, ich mag Musik!     │     │    │
│  │              └────────────────────────┘     │    │
│  │                                             │    │
│  │ ┌─ Input ──────────────────────────────┐   │    │
│  │ │ 🎤  [Erzähl mir von dir...     ] ➤  │   │    │
│  │ └──────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Header Section (above chat)

| Element | Style | Text |
|---------|-------|------|
| Back link | `text-slate-500 hover:text-white text-sm` with ← chevron, left-aligned | `Zurück` |
| Skip link | `text-slate-500 hover:text-white text-sm` with → chevron, right-aligned | `Weiter` |
| Headline | `text-2xl sm:text-3xl md:text-4xl font-extrabold` | `Vorstellungsrunde` (gradient-text) |
| Subtitle | `text-slate-400 max-w-lg mx-auto` | `Erfahre wie wir gemeinsam lernen wollen...` |

The back and skip links are in a `flex justify-between` row above the headline.

## Chat Dialog

The chat container is the existing glass panel, but no longer uses `h-[100dvh]`. Instead it uses a fixed height that fits within the centered page layout.

| Property | Mobile | Desktop |
|----------|--------|---------|
| Max width | full | `max-w-3xl` |
| Height | `h-[70dvh]` | `h-[65vh]` |
| Corners | `rounded-2xl` | `rounded-2xl` |
| Background | `glass` | `glass` |

## Chat Header (inside dialog)

- Coach emoji + name (colored) + setting text
- Progress dots (desktop) / bar (mobile)
- Phase label: `Smalltalk` or `Skill-Demo`
- Offline badge (conditional)
- **No back button inside the chat header** (moved to page level above)

## Behavior

- **Back:** Navigates to `intro-coach-select`
- **Fast-forward ("Weiter >"):** Skips the dialog, sets `fastForward: true` in IntroState, tracks `intro-fast-forward` analytics event, navigates to `intro-register`. Hidden during celebration overlay.
- **Two phases:** `smalltalk` (5 exchanges) → `demo` (3 exchanges)
- **Completion:** Shows celebration overlay (+25 XP), then navigates to `intro-register`
- **Offline fallback:** Automatically switches to scripted offline chat if API fails
- **Voice:** Text-to-speech for assistant messages, speech-to-text for input
- **Auto-scroll:** Messages area scrolls to newest message

## Dialog Data Capture

For users who complete the dialog normally (not fast-forward), the following profile data is captured in IntroState (localStorage):

| Data Point | Description |
|------------|-------------|
| `messages` | Full conversation content (role + content + timestamp) |
| `startedAt` | Timestamp when intro began |
| `smalltalkCompletedAt` | Timestamp when smalltalk phase finished |
| `demoCompletedAt` | Timestamp when demo phase finished |
| `completedAt` | Timestamp when intro flow completed |
| `fastForward` | Boolean — whether user skipped via "Weiter >" |
| `interests` | Extracted interests from smalltalk |

This data is transferred to the backend profile on registration via `transferIntroToProfile()`.

## Flow

```
intro-coach-select
       ↓ (coach selected)
intro-chat
       ├─→ (smalltalk + demo complete) → intro-register
       └─→ (Weiter > fast-forward)     → intro-register
```
