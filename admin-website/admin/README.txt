HOUSE OF SAEYL - SUPABASE LOGIN STARTER

Included files:
- index.html: login screen AND admin dashboard markup
- admin.css: styling for login and dashboard
- admin.js: Supabase email/password login and existing demo product UI
- supabase-config.js: paste your Supabase Project URL and Publishable Key here

SETUP:
1. Keep all four files in the same folder.
2. Open supabase-config.js.
3. Replace the Project URL placeholder with your Supabase Project URL.
4. Replace the Publishable Key placeholder with your sb_publishable_... key.
5. Keep ADMIN_EMAIL set to the authorized client email.
6. Do not put an sb_secret_... or service_role key in this file.
7. Serve the folder through a local web server (not by double-clicking index.html).
   Example: npx serve .

IMPORTANT:
- The dashboard is already included inside index.html. There is no separate dashboard.html file.
- Product records are still stored in browser localStorage in this first login stage.
- Before production, protect product APIs/server routes with server-side authorization.
