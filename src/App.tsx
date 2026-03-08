import './App.css'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

// Public pages
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'

// Guards
import ProtectedRoute from './components/shared/ProtectedRoute'
import RoleRoute from './components/shared/RoleRoute'

// Dashboard router (role-aware redirect)
import DashboardRouter from './pages/DashboardRouter'

// First-time onboarding
import OnboardingPage from './pages/OnboardingPage'

// Role dashboards
import SeekerDashboard from './pages/SeekerDashboard'
import SeekerListingsPage from './pages/SeekerListingsPage'
import SeekerVisitsPage from './pages/SeekerVisitsPage'
import SeekerVisitDetailsPage from './pages/SeekerVisitDetailsPage'
import SeekerShortlistPage from './pages/SeekerShortlistPage'
import SeekerMoveInPage from './pages/SeekerMoveInPage'
import SeekerTicketsPage from './pages/SeekerTicketsPage'
import SeekerComparePage from './pages/SeekerComparePage'
import SeekerExtensionsPage from './pages/SeekerExtensionsPage'
import ListingDetailsPage from './pages/ListingDetailsPage'
// Landlord
import LandlordLayout from './components/shared/LandlordLayout'
import LandlordDashboard from './pages/LandlordDashboard'
import NewListingPage from './pages/NewListingPage'
import LandlordListingsPage from './pages/LandlordListingsPage'
import LandlordVisitsPage from './pages/LandlordVisitsPage'
import LandlordMoveInPage from './pages/LandlordMoveInPage'
import LandlordTicketsPage from './pages/LandlordTicketsPage'
import LandlordExtensionsPage from './pages/LandlordExtensionsPage'

import AdminDashboard from './pages/AdminDashboard'
import AdminLayout from './components/shared/AdminLayout'
import SeekerLayout from './components/shared/SeekerLayout'

// Admin sub-pages
import AdminUsersPage from './pages/AdminUsersPage'
import AdminListingsPage from './pages/AdminListingsPage'
import AdminTicketsPage from './pages/AdminTicketsPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'

/**
 * Route map:
 *
 * /                       public  — landing page
 * /login                  public  — sign in
 * /signup                 public  — sign up
 *
 * /onboarding             auth+   — first-time role picker (profile.onboarded = false)
 * /dashboard              auth+   — smart redirect by active_view / role
 * /seeker/dashboard       auth+   — seeker view (is_seeker = true)
 * /landlord/dashboard     auth+   — landlord view (is_landlord = true)
 * /admin/dashboard        auth+   — superadmin only
 * /admin/users            auth+   — superadmin only – user management
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>

          {/* ── Public ─────────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* ── Protected (login required) ─────────────────────────── */}
          <Route element={<ProtectedRoute />}>

            {/* First-time role picker */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Smart redirect */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Seeker — Layout Wrapper */}
            <Route
              element={
                <RoleRoute check={p => p.is_seeker || p.role === 'superadmin'}>
                  <SeekerLayout />
                </RoleRoute>
              }
            >
              <Route path="/seeker/dashboard" element={<SeekerDashboard />} />
              <Route path="/seeker/listings" element={<SeekerListingsPage />} />
              <Route path="/seeker/visits" element={<SeekerVisitsPage />} />
              <Route path="/seeker/visits/:id" element={<SeekerVisitDetailsPage />} />
              <Route path="/seeker/shortlist" element={<SeekerShortlistPage />} />
              <Route path="/seeker/compare" element={<SeekerComparePage />} />
              <Route path="/seeker/move-in" element={<SeekerMoveInPage />} />
              <Route path="/seeker/tickets" element={<SeekerTicketsPage />} />
              <Route path="/seeker/extensions" element={<SeekerExtensionsPage />} />
            </Route>

            {/* Common Routes */}
            <Route path="/listings/:id" element={<ListingDetailsPage />} />

            {/* Landlord — Layout Wrapper */}
            <Route
              element={
                <RoleRoute check={p => p.is_landlord || p.role === 'superadmin'}>
                  <LandlordLayout />
                </RoleRoute>
              }
            >
              <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
              <Route path="/landlord/listings" element={<LandlordListingsPage />} />
              <Route path="/landlord/listings/new" element={<NewListingPage />} />
              <Route path="/landlord/visits" element={<LandlordVisitsPage />} />
              <Route path="/landlord/move-ins" element={<LandlordMoveInPage />} />
              <Route path="/landlord/tickets" element={<LandlordTicketsPage />} />
              <Route path="/landlord/extensions" element={<LandlordExtensionsPage />} />
            </Route>

            {/* Superadmin — admin layout wrapper */}
            <Route
              element={
                <RoleRoute check={p => p.role === 'superadmin'}>
                  <AdminLayout />
                </RoleRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/listings" element={<AdminListingsPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>

          </Route>

        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
