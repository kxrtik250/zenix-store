# Zenix Store

Zenix Store is a polished static ecommerce storefront demo. It includes product browsing, search, filters, wishlist, cart, checkout, demo authentication, profile management, order history, invoices, contact support, error pages, responsive layouts, dark mode, validation, and toast notifications.

## Features

- Professional landing page with category and featured product sections
- Responsive product listing with search, category filters, price filters, and sorting
- Product details pages with quantity selection and related products
- LocalStorage-backed cart, wishlist, coupons, checkout, orders, and invoices
- Demo authentication: register, login, forgot password, profile, and password update
- Checkout validation for delivery, contact, coupon, and payment metadata fields
- Order history and printable invoices built from saved order snapshots
- Contact page with validated local message storage
- Protected admin dashboard route for future operator roles
- Shared navbar, footer, dark mode, empty states, accessible focus states, and toasts
- Netlify security headers and 404 fallback configuration

## Project Structure

```text
.
|-- index.html              # Landing page
|-- products.html           # Product listing page
|-- product.html            # Product detail route
|-- cart.html               # Shopping cart
|-- checkout.html           # Checkout flow
|-- wishlist.html           # Saved products
|-- orders.html             # User order history
|-- invoice.html            # Printable invoice
|-- login.html              # Sign in
|-- register.html           # Account creation
|-- forgot-password.html    # Demo password reset
|-- profile.html            # Profile and password management
|-- about.html              # About page
|-- contact.html            # Contact form
|-- 404.html / 500.html     # Error pages
|-- data.js                 # Product, category, and coupon data
|-- app.js                  # Shared state, auth, validation, rendering, layout helpers
|-- *.js                    # Page-specific behavior
|-- style.css               # Responsive design system
|-- netlify.toml            # Static deployment and security headers
```

## Run Locally

This project has no build step and no package install.

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 5501
```

Then open:

```text
http://localhost:5501
```

The included VS Code Live Server setting also uses port `5501`.

## Demo Account Flow

1. Open `register.html`.
2. Create an account with a password containing at least 8 characters, one letter, and one number.
3. Add products to the cart.
4. Checkout while signed in.
5. View the generated invoice and order history.

To review the protected admin dashboard in this static demo, register with `admin@zenix.store`. That account is treated as a local operator account in the current browser.

Coupons available in the demo:

- `SAVE10`: 10% off orders above INR 1,000
- `SAVE20`: 20% off orders above INR 25,000
- `FLAT500`: INR 500 off orders above INR 5,000

## Deployment

Deploy the folder to any static host such as Netlify, Vercel, GitHub Pages, Cloudflare Pages, or an S3-compatible bucket.

### GitHub Pages

This repository includes `.github/workflows/pages.yml`, so GitHub can deploy the static site automatically.

1. Push the project to a GitHub repository.
2. Open the repository on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **GitHub Actions** as the source.
5. Push to the `main` branch.
6. Open the **Actions** tab and wait for the Pages deployment to finish.

The deployed URL will usually be:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

For Netlify:

1. Create a new site from this folder or repository.
2. Use publish directory `.`.
3. Leave the build command empty.
4. Netlify will read `netlify.toml` for security headers and the 404 fallback.

## Security Notes

This is production-quality static frontend code, but it is not a substitute for a real ecommerce backend. For a real store, add server-side authentication, password hashing, payment order creation, payment signature verification, inventory locking, admin role provisioning, email delivery, and database-backed order storage.

The static demo avoids hardcoded payment keys, does not store full card data, validates inputs, escapes user-controlled rendering, and scopes data to browser LocalStorage.

## Browser Support

The app targets current evergreen browsers. It uses modern CSS and JavaScript features supported by recent Chrome, Edge, Firefox, and Safari versions.
