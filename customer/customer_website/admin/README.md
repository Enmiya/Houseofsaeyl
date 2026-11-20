# House of Saeyl Admin UI Prototype

This is a standalone first-pass admin UI. It does not modify the public homepage.

## Preview
Open `index.html` with VS Code Live Server. The login form currently performs prototype-only navigation for UI review. Any non-empty email/password will open the preview dashboard.

## Important security note
This is NOT production authentication. The current login is only a visual prototype and must not be exposed publicly or used to protect real product data. Before deployment, replace the temporary login with EmDash authentication and enforce permissions on the server. Product changes currently save only in this browser using localStorage; they are not connected to EmDash or the customer website yet.
