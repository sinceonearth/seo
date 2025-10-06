# Design Guidelines: Flight Tracker Web Application

## Design Approach: Reference-Based (Travel & Aviation Apps)

**Primary References:** App in the Air, Flighty, TripIt  
**Design Philosophy:** Clean, data-dense aviation interface with professional travel app aesthetics. Focus on readability, efficient data presentation, and aviation-inspired visual language.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 214 100% 50% (Aviation Blue - used for headers, primary actions, flight routes)
- Secondary: 214 20% 30% (Dark Blue-Gray - text, borders)
- Background: 0 0% 98% (Off-white for main surfaces)
- Surface: 0 0% 100% (White for cards and elevated elements)
- Accent: 24 95% 53% (Orange - for active flights, alerts, CTAs)
- Success: 142 76% 36% (Green - completed flights)
- Muted: 214 15% 70% (Light Blue-Gray - borders, disabled states)

**Dark Mode:**
- Primary: 214 100% 60% (Lighter blue for contrast)
- Secondary: 214 20% 85% (Light text)
- Background: 222 47% 11% (Deep navy background)
- Surface: 217 32% 17% (Elevated card surface)
- Accent: 24 95% 60% (Brighter orange for visibility)
- Success: 142 71% 45% (Lighter green)
- Muted: 214 15% 40% (Darker muted for borders)

### B. Typography

**Font Stack:**
- Primary: 'Inter', system-ui, sans-serif (clean, modern, excellent readability)
- Monospace: 'JetBrains Mono', monospace (for flight numbers, IATA codes, times)

**Text Hierarchy:**
- Headers (H1): text-4xl font-bold (Dashboard titles)
- Headers (H2): text-2xl font-semibold (Section headers)
- Headers (H3): text-xl font-semibold (Card titles, flight routes)
- Body: text-base (Main content)
- Small: text-sm (Metadata, timestamps, terminal info)
- Tiny: text-xs font-medium uppercase tracking-wide (Labels, IATA codes)

### C. Layout System

**Spacing Primitives:** Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Card spacing: gap-4 to gap-6
- Section spacing: space-y-8 to space-y-12
- Page margins: px-6 to px-8, py-8 to py-12

**Container Widths:**
- Dashboard: max-w-7xl mx-auto
- Forms: max-w-2xl mx-auto
- Content sections: max-w-6xl mx-auto

### D. Component Library

**Navigation:**
- Top navbar with logo, main navigation links, user profile
- Height: h-16, sticky positioning
- Background: Surface color with subtle border-b
- Active state: Primary color with underline indicator

**Flight Cards:**
- Card design with rounded-xl borders, shadow-md elevation
- Grid layout: 3 columns on desktop (airline badge | route/times | status)
- Route visualization: From → To with arrow icon
- Color-coded status indicators (upcoming=accent, completed=success, cancelled=muted)
- Flight number in monospace font with airline logo/icon

**Timeline View:**
- Vertical timeline with connecting lines between flights
- Year dividers with sticky headers
- Group consecutive flights into trip cards with subtle background
- Date labels positioned on left margin

**Statistics Dashboard:**
- 4-column grid on desktop: Total Flights, Airlines, Countries, Distance
- Large numbers (text-4xl font-bold) with icons
- Subtle gradient backgrounds or solid surface cards
- Bar charts for top airlines/routes using primary color scale

**Forms (Manual Entry):**
- Two-column layout on desktop for efficient space use
- Input fields with floating labels or clear label positioning
- Autocomplete for airports with IATA code display
- Date/time pickers with aviation-standard formats
- Primary button for submit with accent color

**Data Tables (Import View):**
- Striped rows for readability
- Sticky header on scroll
- Monospace font for IATA codes and flight numbers
- Compact padding (py-2 px-4)
- Hover states with subtle background change

**Import Flow:**
- Drag-and-drop CSV upload area with dashed border
- Preview table showing parsed data before import
- Success confirmation with flight count statistics

### E. Iconography

**Icon Library:** Heroicons (outline style for most UI, solid for active states)
- Use aviation-specific icons: PaperAirplaneIcon, GlobeAltIcon, ClockIcon
- Size consistency: w-5 h-5 for inline icons, w-6 h-6 for emphasis
- Color: currentColor to inherit text colors

### F. Interactions & Animations

**Minimal Motion:**
- Subtle hover states: scale-[1.02] for cards
- Transitions: transition-all duration-200
- Loading states: Pulsing skeleton screens with bg-muted/20
- NO complex animations - this is a utility app

---

## Page-Specific Guidelines

**Dashboard/Home:**
- Hero statistics section at top (4-stat grid)
- Recent flights timeline below with "View All" link
- Optional: Mini route map visualization if feasible

**Flight History:**
- Filter bar: Year dropdown, airline select, search by airport
- Timeline view as default
- Each flight card shows: airline, flight number, route, date, aircraft type
- Trip grouping with subtle container around consecutive flights

**Add Flight (Manual Entry):**
- Centered form layout, max-w-2xl
- Clean input fields with clear labels
- Autocomplete dropdowns for airports
- Calendar picker for dates, time inputs for departure/arrival
- Submit button: "Add Flight" with accent color

**CSV Import:**
- Drop zone with upload icon and instructions
- Parse and show preview table
- Confirmation step with data summary
- Success message with redirect to dashboard

**Statistics:**
- Multi-metric dashboard with various chart types
- Top airlines horizontal bar chart
- Countries visited as badge list
- Monthly flight activity line graph
- Total distance with visual representation

---

## Images

**No hero image required** - this is a utility application focused on data visualization. Instead:
- Airline logos: Use small circular badges (w-8 h-8) next to flight numbers
- Aircraft type icons: Optional small icons for visual interest
- Empty states: Illustration of airplane/travel for "No flights yet"
- Background patterns: Subtle topographic/map patterns at 5% opacity for section backgrounds

---

## Accessibility & Responsiveness

- Dark mode toggle in navbar with smooth transition
- All form inputs maintain consistent styling in both modes
- Mobile: Single column layouts, collapsible filters, swipeable flight cards
- Tablet: 2-column grids where appropriate
- Desktop: Full multi-column layouts as specified
- Focus states: ring-2 ring-primary with offset
- Semantic HTML: proper heading hierarchy, nav landmarks