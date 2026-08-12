HOTFIX — Sculpt card true full width

Fixes the real cause shown in screenshot:
- The card itself was 100%, but modelHeaderRail was still capped at 92%.
- modelHeaderRail now expands to 100% while keeping its existing left edge.
- Scanner/modelLeftRail remains at the approved 92% width.
- Sculpt card therefore reaches the true right edge of its parent.
- Internal muted aside-red gradient is noticeably stronger and more progressive.

Untouched:
- solid border color
- light sweep animation
- scanner size/crop
- sliders
- Butt Elevation
- gallery
- persistence/backend
