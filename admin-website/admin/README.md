# ShopEase Admin Panel Upgrade

## Final scope
Single-store ecommerce. Only the authorized ShopEase admin manages products. Seller signup, seller portal, supplier onboarding and multi-seller workflows are excluded.

## Replace files
1. Back up existing `dashboard.html`, `admin.css`, and `admin.js`.
2. Copy these three files into your existing admin project folder, replacing only those files.
3. Keep the existing `config.js` and `login.html`.
4. Ensure `config.js` defines `window.SHOPEASE_SUPABASE_URL` and `window.SHOPEASE_SUPABASE_PUBLISHABLE_KEY`.
5. Sign in using the existing admin account.

## Features
- Overview counts: total, published, pending and low stock.
- Add and edit products.
- Publish, reject and delete products.
- Search and filter by status/stock.
- Category list and category selection.
- Responsive dashboard layout.
- Admin role verification through `profiles.role`.

## Database expectations
`products`: `id`, `name`, `description`, `price`, `stock_quantity`, `image_url`, `status`, `category_id`, `created_at`.
`categories`: `id`, `name`.
`profiles`: `id`, `role`, `full_name`.
The signed-in profile must have `role = 'admin'`.

## Security
Keep Row Level Security enabled. The product actions rely on existing Supabase policies. If an action reports a permission error, review the relevant RLS policy; never disable RLS as a shortcut. Use only the publishable key in browser code, never a service-role/secret key.

## Important integration checks
- The customer website should query products with `status = 'approved'` to show published items.
- New products default to Published in the form. The admin can select Pending or Rejected before saving.
- Image field currently accepts a public image URL; Supabase Storage upload is not included.
- Category management is read-only in this version because write permissions have not been verified.
- Orders, payments, customers and revenue are not included because the required database tables/features have not been confirmed.
- Deploy the admin project using its existing hosting setup; verify that setup before running a deployment command.
