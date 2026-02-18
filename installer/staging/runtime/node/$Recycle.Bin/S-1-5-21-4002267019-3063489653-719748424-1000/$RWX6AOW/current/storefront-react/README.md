# EMC Abastos - Premium Storefront (React/Astro)

Alternative high-performance storefront built with Astro + React.

## Features

- **SSG/ISR** - Static generation with incremental regeneration
- **React Islands** - Interactive components hydrated on demand
- **Tailwind CSS** - Premium design with CSS variables for theming
- **API-first** - Consumes Laravel backend endpoints
- **Multi-tenant** - Per-store theming via empresa_id scoping

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create `.env` file:

```env
PUBLIC_SITE_URL=https://emc-abastos.mx
API_BASE_URL=https://emc-abastos.mx/api/v1
```

## Structure

```
src/
  components/     # React components
  pages/          # Astro pages (SSG)
  layouts/        # Layout templates
  lib/            # API client, utilities
  hooks/          # React hooks
  styles/         # Global CSS
```

## Theming

Each store loads its theme from the API and applies CSS variables:

```css
:root {
  --brand-primary: #059669;
  --brand-secondary: #374151;
  --brand-accent: #10B981;
  --border-radius: 1rem;
}
```

## Integration with Laravel

This storefront can be:

1. **Deployed separately** - On Vercel/Netlify, pointing to Laravel API
2. **Integrated** - Build output copied to Laravel public folder

The Laravel backend remains the source of truth for:
- Products, categories, orders
- User authentication
- Payment processing
- WhatsApp notifications
