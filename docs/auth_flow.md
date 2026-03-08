---
description: Authentication and Authorization Flow
---

# Authentication & Authorization Flow

![SettleIn Logo](./images/flow (1).png)

SettleIn uses Supabase Auth with Magic Links to provide a passwordless, secure, and user-friendly authentication experience.

### Sign-in / Sign-up Flow

![Sign Up Screen](./images/flow (35).png)

1.  **Entry Point**: User visits `/login` or `/signup`.
2.  **Magic Link Request**:
    *   User enters their email address.
    *   System calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/dashboard' } })`.
    *   A secure Magic Link is sent to the user's email.
3.  **Verification**:
    *   User clicks the link in their email.
    *   They are redirected back to the application (usually `/dashboard?code=...`).
    *   Supabase automatically handles the code exchange and establishes a session.
4.  **Profile Initialization**:
    *   On a fresh sign-up, a corresponding record is created in the `public.profiles` table (via database triggers).
    *   Users are prompted to complete their profile (Name, Role: Seeker or Landlord) if it's their first time.

## Redirection Logic

Based on the user's `role` in the `profiles` table:
*   **Seekers**: Redirected to `/seeker/dashboard`.
*   **Landlords**: Redirected to `/landlord/dashboard`.
*   **Admins**: Redirected to `/admin/dashboard`.

Unauthorized access to role-specific routes is prevented by the `App.tsx` router configuration and protected route guards.

## Session Management

*   Sessions are monitored via `AuthContext`.
*   If a session expires or the user logs out, they are redirected to the home page or login screen.
