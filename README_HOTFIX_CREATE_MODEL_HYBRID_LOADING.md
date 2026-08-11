# Hotfix Create Model IA — Hybrid native loading scanner

Base: AppWeb 75 uploaded by the user.

Changes ONLY inside Create Model IA preview:
- Keeps the currently visible image on screen while the next one loads.
- Applies blur to the old image while loading.
- Loads the target directly with native `new Image()` and `decode()`.
- Scanner moves vertically down/up indefinitely while the target is not ready.
- The new image replaces the old one ONLY after it is fully decoded.
- Blur is removed immediately on the successful swap.
- Scanner fades out just after the new image is ready.
- Uses a request-id guard so an older/slower image can never overwrite a newer slider selection.
- Previously decoded URLs are remembered in-memory so revisiting a variant can swap immediately from browser cache.

No fetch/blob/objectURL is used.
No npm dependency is added.
No changes to sliders, FaceSwap, Generation, auth, billing, gallery, routes, backend, or storage provider logic.

Works with any browser-accessible image URL, including:
- local URLs
- Cloudflare R2 / CDN
- Amazon S3 / CDN

Apply:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "feat: add hybrid decoded image loading scanner to Create Model IA"
git push
