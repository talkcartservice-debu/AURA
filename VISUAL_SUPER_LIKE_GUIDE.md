# Visual Demo Guide - Super Like Feature

## What Users See

### Discover Page - Free User

```
┌─────────────────────────────────────┐
│  ✨ Discover                        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │      [Profile Photo]         │  │
│  │                              │  │
│  │   Sarah, 28 ✓                │  │
│  │   📍 Lagos                   │  │
│  │                              │  │
│  │   "Love for AI..."           │  │
│  │                              │  │
│  │   ✨ Why you match           │  │
│  │   • Shared interests         │  │
│  │                              │  │
│  │   💕 Art  💕 Music           │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌────────────┬────────────┐       │
│  │  ✕ Pass    │  ❤ Like    │       │
│  └────────────┴────────────┘       │
│                                     │
└─────────────────────────────────────┘

Note: No Super Like button visible
```

### Discover Page - Premium User (Has Super Likes)

```
┌─────────────────────────────────────┐
│  ✨ Discover                        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │      [Profile Photo]         │  │
│  │                              │  │
│  │   Sarah, 28 ✓                │  │
│  │   📍 Lagos                   │  │
│  │                              │  │
│  │   "Love for AI..."           │  │
│  │                              │  │
│  │   ✨ Why you match           │  │
│  │   • Shared interests         │  │
│  │                              │  │
│  │   💕 Art  💕 Music           │  │
│  │                              │  │
│  │   💡 Generate AI Icebreaker  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────┬──────┬──────────┐        │
│  │ ✕    │ ❤    │ 🔥       │        │
│  │Pass  │Like  │Super Like│        │
│  │      │      │[ACTIVE]  │        │
│  └──────┴──────┴──────────┘        │
│                                     │
└─────────────────────────────────────┘

Super Like button is blue/cyan gradient and active
```

### Discover Page - Premium User (No Super Likes Left)

```
┌─────────────────────────────────────┐
│  ✨ Discover                        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │      [Profile Photo]         │  │
│  │                              │  │
│  │   Sarah, 28 ✓                │  │
│  │   📍 Lagos                   │  │
│  │                              │  │
│  │   "Love for AI..."           │  │
│  │                              │  │
│  │   ✨ Why you match           │  │
│  │   • Shared interests         │  │
│  │                              │  │
│  │   💕 Art  💕 Music           │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────┬──────┬──────────┐        │
│  │ ✕    │ ❤    │ 🔥       │        │
│  │Pass  │Like  │Super Like│        │
│  │      │      │[DISABLED]│        │
│  └──────┴──────┴──────────┘        │
│                                     │
└─────────────────────────────────────┘

Super Like button is gray and disabled
Tooltip: "No Super Likes remaining"
```

## Mobile View

### Free User (Bottom Action Bar)

```
┌─────────────────────────┐
│                         │
│    [Profile Card]       │
│                         │
│                         │
└─────────────────────────┘
┌─────────────────────────┐
│ ┌──────┬──────────┐    │
│ │ ✕    │  ❤       │    │
│ │Pass  │  Like    │    │
│ └──────┴──────────┘    │
└─────────────────────────┘

Only 2 buttons: Pass and Like
```

### Premium User (Bottom Action Bar)

```
┌─────────────────────────┐
│                         │
│    [Profile Card]       │
│                         │
│                         │
└─────────────────────────┘
┌─────────────────────────┐
│ ┌────┬────┬────────┐   │
│ │ ✕  │ ❤  │ 🔥     │   │
│ │Pass│Like│Super   │   │
│ │    │    │Like    │   │
│ └────┴────┴────────┘   │
└─────────────────────────┘

3 buttons: Pass, Like, Super Like
```

## Interaction Flow

### Sending a Super Like

```
Step 1: User sees profile
┌──────────────────────────────┐
│                              │
│     [Profile Photo]          │
│     Sarah, 28 ✓              │
│                              │
│     🔥 Super Like available  │
│                              │
└──────────────────────────────┘

Step 2: User clicks Super Like button
┌──────────────────────────────┐
│                              │
│     [Profile Photo]          │
│     Sarah, 28 ✓              │
│                              │
│     ✨ Animation effect      │
│     "Sending..."             │
│                              │
└──────────────────────────────┘

Step 3: Success notification
┌──────────────────────────────┐
│  ⭐ Super Like sent!         │
│                              │
│  Subscription updated:       │
│  Super Likes: 4/5 remaining  │
└──────────────────────────────┘
```

## Premium Page - Microtransactions Section

```
┌─────────────────────────────────────┐
│  ⚡ Boost Your Experience           │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┬──────────────┐   │
│  │  ⚡ Boost    │  ❤ Super     │   │
│  │              │    Like (5)  │   │
│  │  Get 10x    │  Stand out   │   │
│  │  more views │  & get       │   │
│  │  for 30 min │  noticed     │   │
│  │              │              │   │
│  │  ₦4,990     │  ₦4,990      │   │
│  │              │              │   │
│  │ [Buy Boost] │ [Buy Super   │   │
│  │              │  Likes]      │   │
│  └──────────────┴──────────────┘   │
│                                     │
│  Your Boosts: 2                     │
│  [Activate Boost]                   │
│                                     │
└─────────────────────────────────────┘
```

## Error States

### Free User Tries to Access Super Like

```
If free user somehow triggers Super Like endpoint:

Backend Response (403 Forbidden):
{
  "error": "Super Likes require Premium subscription"
}

Frontend Toast:
❌ Super Likes require Premium subscription
[Upgrade to Premium] button
```

### Premium User Out of Super Likes

```
UI State:
- Super Like button: Disabled (gray)
- Tooltip: "No Super Likes remaining"

Toast on click attempt:
❌ No Super Likes remaining. Purchase more in Premium!

[Purchase Super Likes] button links to Premium page
```

## Success Feedback

### Super Like Sent Successfully

```
Toast Notification (Top):
⭐ Super Like sent!

Subscription Counter Updates:
Before: Super Likes: 5/5
After:  Super Likes: 4/5

Button State:
Still active (if count > 0)
Disabled (if count = 0)
```

### Mutual Match with Super Like

```
Special Animation:
┌──────────────────────────────┐
│                              │
│      💕 IT'S A MATCH! 💕     │
│                              │
│  You and Sarah liked each   │
│  other!                      │
│                              │
│  [Send Message] [Keep       │
│   Browsing]                  │
│                              │
└──────────────────────────────┘

Toast:
💕 It's a match! + ⭐ Super Like bonus
```

## Color Scheme

### Super Like Button States

**Active (Available):**
- Background: Blue-Cyan Gradient
- Icon: Flame with white fill
- Text: White
- Shadow: Blue glow

**Disabled (No Super Likes):**
- Background: Gray (#f3f4f6)
- Icon: Flame outline only
- Text: Gray (#9ca3af)
- No shadow

**Hover (Active only):**
- Darker blue-cyan gradient
- Slightly elevated
- Enhanced shadow

### Comparison with Regular Like

**Like Button:**
- Rose-Purple gradient
- Heart icon
- Red/Pink theme

**Super Like Button:**
- Blue-Cyan gradient
- Flame icon
- Blue/Cyan theme

This creates clear visual distinction between the two actions.

## Accessibility

### Keyboard Navigation
- Tab order: Pass → Like → Super Like
- Enter/Space to activate
- Escape to cancel

### Screen Reader Support
```html
<button 
  aria-label="Super Like Sarah"
  aria-disabled="false"
  title="Super Like"
>
  🔥
</button>
```

### Visual Indicators
- Icon + color for colorblind users
- Tooltip on hover
- Clear disabled state
- High contrast mode support

## Performance Considerations

### Optimizations
- ✅ Button visibility determined by subscription query
- ✅ Local state for immediate feedback
- ✅ Optimistic UI updates
- ✅ Debounced API calls
- ✅ Query invalidation for real-time updates

### Loading States
```
During Super Like send:
- Button shows spinner
- Disabled state applied
- Prevents double-send

After completion:
- Immediate toast notification
- Counter updates
- Button re-enabled or disabled based on new count
```

## Testing Scenarios

### Scenario 1: Happy Path
1. Premium user with Super Likes opens Discover
2. Sees active Super Like button
3. Clicks button
4. Success toast appears
5. Counter decrements
6. Can continue swiping

### Scenario 2: Out of Super Likes
1. Premium user uses last Super Like
2. Counter shows 0/5
3. Button becomes disabled
4. Click shows error message
5. Prompted to purchase more

### Scenario 3: Network Error
1. User clicks Super Like
2. Request fails
3. Error toast shown
4. Counter not decremented
5. Button re-enabled for retry

### Scenario 4: Subscription Expires
1. User has Premium with Super Likes
2. Subscription expires mid-session
3. Next page refresh removes Super Like button
4. User prompted to renew

---

This visual guide helps developers and designers understand how the Super Like feature should look and behave across different states and devices.
