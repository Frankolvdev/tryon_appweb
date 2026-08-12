HOTFIX Models — structural shared parent rail

This fix changes structure, not offsets.

- Header content is wrapped in `modelHeaderRail`.
- Scanner/gallery side is `modelLeftRail`.
- Both share the exact same CSS width token.
- Name + sculpt widget are children of the same parent rail.
- Scanner fills its corresponding rail 100%.
- Back arrow lives in its own header grid column.

This prevents the stair-step effect caused by independent margins.

Also:
- Model name slightly smaller.

Untouched:
- scanner crop/aspect
- Butt Elevation
- sliders
- gallery behavior
- persistence
- backend/API
