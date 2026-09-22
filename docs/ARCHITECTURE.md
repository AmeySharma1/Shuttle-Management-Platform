# CampusRide — Architecture & Technical Design

CampusRide is a front-end-only prototype of a university campus shuttle management system built with **Next.js (App Router, JavaScript)** and **Tailwind CSS v4**.

---

## 1. Directory Structure

```
├── /app                  # Next.js App Router (pages, layout, globals.css)
├── /components
│   ├── /ui               # Atomic, reusable design-system components
│   │   ├── Button.js     # Primary, secondary, ghost, danger buttons + loading state
│   │   ├── Card.js       # Glassmorphism container cards
│   │   ├── ConfirmDialog.js # Accessible destructive action confirmation
│   │   ├── Drawer.js     # Slide-in right panel with portal & focus trap
│   │   ├── EmptyState.js # Zero-data placeholders with icon + action
│   │   ├── Field.js      # Form label + inline error wrapper
│   │   ├── Input.js      # Styled text input
│   │   ├── Modal.js      # Centered dialog with portal, Esc, focus trap
│   │   ├── Select.js     # Custom-styled native select dropdown
│   │   ├── Skeleton.js   # Shimmer loading placeholders (Card, TableRow)
│   │   ├── StatCard.js   # Metric display card with icon & trends
│   │   ├── StatusBadge.js # Pill badge with status colors & dot indicator
│   │   └── Tabs.js       # Tab list navigation
│   └── /layout
│       └── ThemeToggle.js # Light / Dark / System theme switcher
├── /data                 # Mock seed JSON datasets
│   ├── bookings.json     # 30+ realistic bookings with relative day offsets
│   ├── drivers.json      # 6 drivers with vehicles, shifts, and breaks
│   ├── routes.json       # 5 campus routes with ordered stop sequences
│   └── stops.json        # 8 campus locations (Main Gate, Library, etc.)
├── /docs                 # Project documentation
│   └── ARCHITECTURE.md   # Architectural overview and complexity analysis
├── /hooks                # Custom React hooks
│   └── index.js          # useDebounce, useAsyncData
├── /lib                  # Utilities, storage, constants, rules
│   ├── constants.js      # Roles, statuses, theme tokens, time constants
│   ├── errors.js         # ServiceError custom error class
│   ├── seed.js           # Dynamic dayOffset → YYYY-MM-DD resolver
│   ├── statusRules.js    # Allowed state transitions & friendly guard messages
│   ├── storage.js        # In-memory Map + localStorage persistence engine
│   └── utils.js          # cn(), date/time helpers, ID generation
└── /services             # Async mock service layer
    ├── bookingService.js # Booking queries, creation, status transitions
    ├── driverService.js  # Driver shifts, duty status, schedule queries
    └── routeService.js   # Route and stop definitions
```

---

## 2. Service Layer Architecture

The application implements a decoupled, realistic async service layer between React components and mock data:

```
[ UI Components / Pages ]
          │
          ▼  (calls async functions with artificial 300-500ms delay)
[ Services Layer (bookingService, driverService, routeService) ]
          │
          ├──> [ Business Rules & Guards (lib/statusRules.js) ]
          │        └── Throws ServiceError on illegal operations
          │
          ▼
[ Storage Layer (lib/storage.js) ]
     ├── In-Memory Map (Fast primary read/write)
     └── LocalStorage (Browser persistence across page reloads)
```

### Key Highlights:
1. **Network Latency Simulation**: Every service method introduces an artificial `300–500ms` delay to simulate realistic network latency and exercise loading states (`useAsyncData`, `Skeleton`, `Button` spinners).
2. **Encapsulated State**: UI components never import `data/*.json` directly. All data access flows through services.
3. **Dynamic Dates**: Seed data uses `dayOffset` (-1 = yesterday, 0 = today, +1 = tomorrow). `lib/seed.js` calculates exact `YYYY-MM-DD` strings on initialization, ensuring the demo always reflects the current calendar date.
4. **Persistence & Reset**: Changes persist in `localStorage` under the `campusride_*` prefix. `resetAllData()` allows instant reset back to seed data.

---

## 3. Business Rules & Guard Architecture

Business rules live in `lib/statusRules.js` and within service validation routines:

### Booking Lifecycle State Machine
```
[ Requested ] ───► [ Accepted ] ───► [ On Going ] ───► [ Completed ]
      │                  │                ▲
      ├──► [ Declined ]  ├──► [ Waiting ] ┘
      │                  │
      └──► [ Cancelled ] ├──► [ Cancelled ]
                         └──► [ No Show ]
```
- **Terminal States**: `Completed`, `Cancelled`, `No Show`, `Declined` are immutable.
- **Cancellation**: Permitted only in `Requested`, `Accepted`, or `Waiting`. Blocked once `On Going` or completed.
- **Editing**: Permitted only in `Requested`, `Accepted`, or `Waiting`.
- **Friendly Guard Messages**: `getBlockedReason(action, status)` provides user-facing error messages (e.g. *"This trip is currently in progress and can't be cancelled."*) wrapped in `ServiceError` and rendered via toast alerts.

### Driver Duty Constraints
- **Overlapping Trips**: Drivers cannot have overlapping trips within a 20-minute booking slot.
- **Shift & Break Alignment**: Drivers can only start trips during scheduled active shift hours and outside approved break intervals.

---

## 4. Algorithmic Complexity & Performance

## Demo Tips

Choose a role on the welcome screen first. For the admin demo, open Overview to see the stats and chart, then Bookings to search and inspect a booking, Drivers to view the timeline, and Routes to add or assign a route. For the commuter demo, book a ride and open My trips. For the driver demo, open My day and start duty before working with a trip.

| Operation | Implementation Details | Time Complexity | Space Complexity |
|---|---|---|---|
| **Lookup by ID** | `Map.get(id)` in `storage.js` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| **Upsert / Delete** | Map set/delete + LS serialization | $\mathcal{O}(1)$ mem / $\mathcal{O}(n)$ LS write | $\mathcal{O}(n)$ |
| **Search Filtering** | Substring search over rider/id/stops | $\mathcal{O}(n)$ | $\mathcal{O}(k)$ filtered subset |
| **Sorting** | `Array.prototype.sort()` | $\mathcal{O}(n \log n)$ | $\mathcal{O}(n)$ |
| **Pagination** | `Array.prototype.slice(start, end)` | $\mathcal{O}(1)$ | $\mathcal{O}(\text{pageSize})$ |
| **Overlap Check** | Minute range arithmetic $[s_1, e_1) \cap [s_2, e_2)$ | $\mathcal{O}(1)$ per comparison / $\mathcal{O}(m)$ over driver's trips | $\mathcal{O}(1)$ |
| **Search Input** | Debounced with `useDebounce` (300ms) | Negligible UI re-renders | $\mathcal{O}(1)$ |
| **Race-Condition Safety** | `useAsyncData` call-counter + mounted ref | Avoids stale out-of-order state updates | $\mathcal{O}(1)$ |
