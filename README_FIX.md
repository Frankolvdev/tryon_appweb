HOTFIX Models — structural arrow isolation + slider cleanup

Changes:
- Back arrow moved OUTSIDE the shared header rail.
- Arrow no longer participates in alignment/width.
- modelHeaderRail and modelLeftRail share the same left origin and width.
- Removes/hides floating numeric current values from sliders.
- Keeps endpoint labels (Small/Huge, Very Low/Very High, etc.).

Untouched:
- scanner crop/aspect
- Butt Elevation
- gallery button
- slider behavior
- persistence
- backend/API
- other views

Files:
- src/components/models/model-studio.tsx
- src/app/globals.css
