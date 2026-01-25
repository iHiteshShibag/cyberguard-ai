# CyberGuard AI - Fixes and Modifications Log

This document tracks the specific changes made to the CyberGuard AI project to resolve initialization errors and improve the local development experience.

## 1. Resolved URIError (Malformed URI Sequence)
- **File**: `client/index.html`
- **Issue**: The analytics script was using undefined environment variables (`%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%`), which caused Vite to fail when trying to decode the malformed URL.
- **Fix**: Removed the analytics script block from the HTML template.

## 2. Resolved TypeError (Invalid URL)
- **File**: `client/src/const.ts`
- **Issue**: The `getLoginUrl` function was attempting to create a `new URL()` using `import.meta.env.VITE_OAUTH_PORTAL_URL`, which was undefined in the local environment, leading to a crash.
- **Fix**: Added a fallback default value (`https://auth.manus.im`) for the OAuth portal URL.

## 3. Local Development Authentication Bypass
- **File**: `server/_core/context.ts`
- **Issue**: The "Sign In" button points to an external Manus OAuth service that may not be accessible or configured for local development, preventing access to protected routes.
- **Fix**: Implemented a bypass in the tRPC context. When `NODE_ENV` is set to `development`, the system automatically injects a mock "Admin User" into the context if no valid session is found.
- **File**: `client/src/pages/Home.tsx`
- **Fix**: Updated the landing page to show "Enter Dashboard (Dev Mode)" buttons when running in development mode, allowing users to skip the external OAuth step.

## 4. Environment Configuration
- **File**: `.env` (New)
- **Action**: Created a default `.env` file with placeholder values for `DATABASE_URL`, `JWT_SECRET`, and OAuth settings to ensure the application starts without manual configuration.

## 5. Port Availability
- **File**: `server/_core/index.ts` (Reviewed)
- **Note**: The project already includes a robust port-finding mechanism that automatically switches from port 3000 if it is busy.
