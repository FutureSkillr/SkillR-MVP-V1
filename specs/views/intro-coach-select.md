# View: intro-coach-select

**Route:** `intro-coach-select` (internal view state)
**Component:** `CoachSelectPage.tsx`
**Layout:** None (full-screen, no Layout chrome)

## Structure

```
┌─────────────────────────────────────────────────────┐
│                    (centered)                        │
│                                                     │
│  ← Zurück                                           │
│                                                     │
│           Wähle Deinen Coach                        │
│                                                     │
│   Jeder Coach hat seinen eigenen Stil.              │
│   Such dir jemanden aus, der zu dir passt.          │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ border border-slate-700/50 rounded-2xl p-4  │    │
│  │                                             │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Susi   │ │Karlshains│ │  Rene   │       │    │
│  │  │  Card   │ │  Card   │ │  Card   │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Heiko  │ │ Andreas │ │ Cloudia │       │    │
│  │  │  Card   │ │  Card   │ │  Card   │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘       │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│   Du kannst später jederzeit einen anderen           │
│   Coach wählen.                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Behavior

- **Back:** Navigates to `welcome`
- **Card click:** Sets `introCoachId`, navigates to `intro-chat`
- **Queue active:** Cards dimmed, WaitingSection shown side-by-side
- **Grid:** 2 cols mobile, 3 cols desktop
- **Card deck:** Wrapped in thin border container
- **Cards:** Equal height within each row (`h-full flex flex-col`)
