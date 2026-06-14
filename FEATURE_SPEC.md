# WHOOP Dashboard — Feature Additions Spec

## Stack: Next.js 16, React 19, Tailwind 4, Recharts, Framer Motion
## Data: WHOOP API v2 (all data already being fetched)

---

## PRIORITY 1 — Critical (Build These First)

### 1. Sleep Hypnogram / Sleep Stage Timeline
**File:** `src/components/SleepHypnogram.tsx` (new)
**Data source:** `sleep.score.stage_summary` — already fetched
**What:** Horizontal stacked bar per night showing sleep stages across time
- Color code: Deep=#1e3a5f, REM=#7c3aed, Light=#3b82f6, Awake=#f59e0b
- X-axis: time of night (e.g. 22:00 → 06:00)
- Y-axis: one row per night (last 7 nights)
- Show total sleep time and sleep need vs actual
- Use Recharts BarChart with stacked bars OR custom SVG

### 2. Heart Rate Zone Distribution
**File:** `src/components/StrainZones.tsx` (new)
**Data source:** `workout.score.zone_duration` — already in type but NOT fetched in API route
**What:** Donut/pie chart showing time spent in each HR zone
- Zone 0: Gray (rest)
- Zone 1: Blue (light)
- Zone 2: Green (moderate)
- Zone 3: Yellow (tempo)
- Zone 4: Orange (threshold)
- Zone 5: Red (max effort)
- Show both per-workout and weekly aggregate
- **NOTE:** Need to update `/api/data/route.ts` to fetch zone_duration from workouts

### 3. Resting Heart Rate Trend Chart
**File:** `src/components/RhrTrend.tsx` (new)
**Data source:** `cycle.score.resting_heart_rate` — already fetched
**What:** Line chart of RHR over 90 days
- Show 7-day rolling average as thicker line
- Color: green when stable/improving, red when elevated
- Annotate with workout markers
- Display current RHR prominently with trend arrow

---

## PRIORITY 2 — High Value

### 4. SpO2 & Skin Temperature Display
**File:** `src/components/VitalsPanel.tsx` (new)
**Data source:** `recovery.score.spo2_percentage`, `recovery.score.skin_temp_celsius`
**What:** Small stat cards showing current SpO2 % and skin temp
- SpO2: normal range 95-100%, alert if <93%
- Skin temp: show deviation from personal baseline
- Mini sparkline for 7-day trend

### 5. Respiratory Rate Display
**File:** Add to VitalsPanel above
**Data source:** `sleep.score.respiratory_rate`
**What:** Current respiratory rate with 7-day trend
- Normal: 12-20 breaths/min
- Elevated = potential stress/illness indicator

### 6. Workout Detail Cards
**File:** `src/components/WorkoutCard.tsx` + `src/components/WorkoutList.tsx` (new)
**Data source:** workouts already fetched but never displayed
**What:** List of recent workouts (last 14 days) showing:
- Sport type (map sport_id to name)
- Duration, strain, kilojoules
- Avg HR, Max HR
- Zone distribution mini-bar
- Click to expand for full zone breakdown

### 7. Sleep Need vs Actual
**File:** `src/components/SleepNeedBar.tsx` (new)
**Data source:** `sleep.score.sleep_needed` (baseline + debt + strain adjustments)
**What:** Horizontal bar showing:
- Baseline sleep need (gray)
- Additional need from sleep debt (red segment)
- Additional need from strain (orange segment)
- Actual sleep gotten (green overlay line)
- "You needed 7:42, you got 6:58 — 44 min deficit"

### 8. Weekly/Monthly Toggle
**File:** Update `src/app/page.tsx`
**What:** Add time range selector: 7d / 30d / 90d
- Pass range to API calls
- Recalculate analytics for selected window
- Default to 7d for daily view, 90d for trends

---

## PRIORITY 3 — Polish

### 9. Recovery Score Component Breakdown
**File:** `src/components/RecoveryBreakdown.tsx` (new)
**What:** Show the 3 components that drive recovery:
- HRV status (with current value)
- RHR status (with current value)
- Sleep performance %
- Visual: 3 horizontal bars, each color-coded

### 10. HRV Detailed Chart with Annotations
**File:** `src/components/HrvChart.tsx` (new)
**What:** Line chart of HRV (RMSSD) over 90 days
- Overlay workout markers as vertical lines
- Overlay poor sleep nights as red dots
- Show correlation: "HRV dropped 12% after 3 high-strain days"

### 11. Calendar Heatmap (Replace Placeholder)
**File:** `src/components/RecoveryHeatmap.tsx` (new)
**What:** GitHub-style contribution heatmap
- 90 days, colored by recovery score
- Green = excellent, yellow = moderate, red = poor
- Hover shows date + score + key factors
- Use Recharts or custom SVG grid

### 12. Nap Detection Display
**File:** Add to SleepHypnogram or separate `src/components/NapIndicator.tsx`
**What:** Show nap duration and impact
- "23 min nap — +4% recovery boost"
- Distinguish from main sleep block

### 13. Disturbance Count
**File:** Add to sleep display
**Data source:** `sleep.score.stage_summary.disturbance_count`
**What:** Show disturbances per night
- "12 disturbances — fragmented sleep"
- Correlate with sleep efficiency

### 14. Streak Tracking
**File:** `src/components/Streaks.tsx` (new)
**What:** Gamification — track consecutive days:
- Recovery > 60% (green streak)
- Sleep > 85% efficiency (blue streak)
- Strain in optimal range (orange streak)
- Display as fire emoji + count: "🔥 12 day recovery streak"

---

## API ROUTE CHANGES

### Update `/src/app/api/data/route.ts`:
1. Pass full workout data including `zone_duration` to frontend
2. Pass recovery data with SpO2 and skin temp
3. Pass sleep data with `sleep_needed` breakdown
4. Add `range` query param (7d/30d/90d) to control date window

---

## PAGE LAYOUT REDESIGN

### Update `/src/app/page.tsx`:
New layout when authenticated:

```
┌─────────────────────────────────────────────┐
│  WHOOP COMMAND CENTER    [7d|30d|90d toggle]│
├─────────────────────────────────────────────┤
│  Recovery Ring  │  Strain Gauge  │  HRV     │
│  (big)          │  (big)         │  + RHR   │
├─────────────────────────────────────────────┤
│  ACTIVE SIGNALS                             │
├─────────────────────────────────────────────┤
│  Sleep Hypnogram (7 nights)                 │
├─────────────────────────────────────────────┤
│  Strain Zones  │  Recovery Breakdown         │
├─────────────────────────────────────────────┤
│  HRV + RHR Trend Chart (90d)               │
├─────────────────────────────────────────────┤
│  Workout Cards (last 14 days)              │
├─────────────────────────────────────────────┤
│  Recovery Heatmap (90d)  │  Streaks         │
├─────────────────────────────────────────────┤
│  Vitals: SpO2 | Temp | Resp Rate           │
└─────────────────────────────────────────────┘
```

---

## IMPLEMENTATION ORDER

1. Update API route to pass through all needed fields
2. Build SleepHypnogram (highest visual impact)
3. Build StrainZones chart
4. Build RhrTrend chart
5. Build VitalsPanel (SpO2, temp, resp rate)
6. Build WorkoutCard + WorkoutList
7. Build SleepNeedBar
8. Build RecoveryBreakdown
9. Build HrvChart
10. Build RecoveryHeatmap (replace placeholder)
11. Build Streaks
12. Add time range toggle to page
13. Redesign page layout
14. Build and test
