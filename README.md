# MegaZIP 3 — AppWeb Exact Commercial Savings

The AppWeb continues to consume backend-authoritative prices. Copy now labels the displayed percentage as the **real commercial saving**, which is calculated from nominal price versus final price. No infrastructure or generation logic is duplicated in the frontend.

Run:
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
