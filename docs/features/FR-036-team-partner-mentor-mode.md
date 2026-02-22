# FR-036: Team, Partner & Mentor Mode (Social + Viral Growth)

**Status:** draft
**Priority:** should
**Created:** 2026-02-18

## Problem

The app needs social mechanics that:
1. Drive user base growth through invites (viral loop)
2. Enable collaborative learning (team stations in DC-013)
3. Allow experienced users to mentor new ones
4. Give parents, teachers, and Azubibotschafter a natural way to connect with students

## Solution

Three social modes that serve different relationships and growth mechanics:

### Mode 1: Partner Mode (1:1)

Two students explore together. They see each other on the globe, can visit the same station simultaneously, and compare profiles.

| Feature | Details |
|---|---|
| Invite | Share a link or QR code: "Reise mit mir!" |
| Shared globe | Both players' positions and travel arcs visible |
| Co-stations | Some stations designed for two: "Ihr muesst euch aufteilen — einer geht nach links, einer nach rechts" |
| Profile compare | Side-by-side spider diagrams: "Schau, du bist staerker in Technik, ich in Kreativitaet" |
| XP bonus | +5 XP for completing a station with a partner |

### Mode 2: Team Mode (3-5 players)

Small groups tackle Entrepreneur Journey (DC-013) team stations together.

| Feature | Details |
|---|---|
| Team creation | One player creates a team, shares invite code |
| Team stations | Entrepreneurial challenges requiring role division: CEO, Designer, Engineer, Marketer |
| Team chat | Simple in-station messaging (moderated, no free chat outside stations) |
| Team profile | Combined team spider diagram showing complementary strengths |
| XP bonus | +10 XP per team station, +25 XP for team that completes Entrepreneur Journey |

### Mode 3: Mentor Mode (1:many)

Experienced users (Level 21+, or external roles) can mentor newer users.

| Mentor Type | How They Enter | What They Can Do |
|---|---|---|
| **Student mentor** | Reaches Level 21 (DC-014), opts in | See mentee's progress, send encouragement, endorse skills (FR-030) |
| **Azubibotschafter** | Linked via IHK program | Same as student mentor + can endorse professional skills |
| **Teacher** | School pilot account | See class aggregate progress, assign stations, endorse |
| **Parent** | Parent account (FR-025) | See child's progress (privacy boundary applies) |

### The Viral Invite Loop

```
Student completes station → "Teile dieses Abenteuer mit einem Freund!"
    → Share link (WhatsApp, Instagram DM, QR code)
    → Friend opens link → lands on the SAME station the inviter just did
    → Friend completes station → both get XP bonus
    → Friend creates account → inviter gets "Botschafter" badge progress
    → Friend invites THEIR friend → chain continues
```

Key mechanics:
- **Contextual invites**: The invite links to a SPECIFIC station, not the generic app. "Probier mal die Kochstation in Rom!" is more compelling than "Lad dir diese App runter."
- **Mutual reward**: Both inviter and invitee get XP when the invitee completes their first station.
- **Badge incentive**: 3 successful invites = "Botschafter" badge. 10 = "Entdecker-Netzwerker."
- **Team incentive**: Team stations REQUIRE inviting friends — the game mechanic itself drives growth.

### Moderation and Safety

Since users are minors:
- **No open chat.** Communication is limited to: pre-written reactions ("Cool!", "Gut gemacht!", "Hilfe!"), in-station team messages (moderated, topic-locked), and mentor messages (pre-approved templates + free text only for verified mentors).
- **No stranger matching.** Partners and teams are formed ONLY through direct invite links. No random matchmaking.
- **Reporting**: Any user can report inappropriate behavior. Flagged interactions are reviewed within 24h.
- **DSGVO**: Social features require additional consent per FR-033.

## Acceptance Criteria

- [ ] Student can invite a partner via link/QR code
- [ ] Partners see each other on the globe/map
- [ ] Team stations require 3-5 players and involve role division
- [ ] Mentor mode allows Level 21+ students to see mentee progress
- [ ] Teacher and Azubibotschafter accounts can endorse skills
- [ ] Invite links point to specific stations (contextual)
- [ ] Both inviter and invitee receive XP on first station completion
- [ ] No open chat between minors — pre-written reactions only
- [ ] All social features require additional consent (FR-033)

## Dependencies
- DC-013 (Entrepreneur Journey — team stations)
- DC-014 (Duolingo Engagement — XP bonuses, badges)
- FR-030 (Third-Party Endorsement — mentor endorsement)
- FR-033 (Datenschutz — consent for social features)
- FR-035 (Avatar System — avatars visible to partners/team)
- FR-037 (Items — shareable/tradeable items between partners)
- BC-008 (Multiplikatoren-Netzwerk — IHK/teacher as multiplier entry points)
