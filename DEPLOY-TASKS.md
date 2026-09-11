# Task workflow activation

This branch adds staff login and database columns. Configure it before promoting to main.

1. Set Render secrets DATABASE_URL and NEXTAUTH_SECRET (random 32+ characters).
2. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
3. Set NEXT_PUBLIC_APP_URL to the exact HTTPS service URL, without a trailing slash.
4. Run npm run db:push against the existing database. This adds columns; do not use --accept-data-loss. Existing services, tasks and prices remain.
5. Create your first administrator in a trusted terminal or Render shell: set STAFF_EMAIL, STAFF_PASSWORD (12+ characters), STAFF_ROLE=ADMIN, then npm run staff:create. Remove STAFF_PASSWORD from the environment afterwards.
6. Repeat with a separate email and STAFF_ROLE=WORKER for each worker. Existing users are never overwritten by the script.
7. Set CLEANUP_SECRET in Render (random 32+ characters).
8. Add GitHub Actions secrets QM_APP_URL (your HTTPS URL) and QM_CLEANUP_SECRET (same cleanup secret). Enable Actions. The daily workflow runs on the default branch and can be triggered manually.
9. Disable Cloudinary backups for these assets if the six-month policy must also exclude backup copies. Cleanup requests CDN invalidation. Previously downloaded customer PDFs cannot be recalled.
10. Deploy and sign in at /login. Test admin pricing, worker status changes, image upload, and PDF download using a test service.

Verification performed: production build and TypeScript validation; unauthenticated
task, photo, service-creation and cleanup requests return 403; progress and
month-end expiry checks; rendered PDF sample inspected.
Cloudinary operations and authenticated writes against the live database still
require verification with your configured accounts.

New services record the intake reason only. Prices are the sum of tasks.
Each task has equal weight: completed = 3 points; any other state = 0.
Progress = completed points / (3 × number of tasks), rounded to the nearest percent.
No tasks = 0%. Adding tasks can lower the completion percentage.

New images expire six calendar months after upload (clamped to month-end).
They disappear from current app views and PDFs at expiry and are deleted by the daily job.
Old images without Cloudinary storage IDs need a storage inventory before physical deletion can be automated; the code does not delete unrelated cloud assets.

The existing MercadoPago webhook is still a development placeholder; this release does not authorize live payments.
