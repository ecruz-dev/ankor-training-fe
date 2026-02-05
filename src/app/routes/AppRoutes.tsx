// src/routes/AppRoutes.tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NewPlanPage from '../../features/practice-plans/pages/NewPlanPage'
import { useAuth } from '../providers/AuthProvider'
import { isAdminRole } from '../../shared/auth/roles'


// Centralize paths here (kept local to this file)
export const PATHS = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  orgSignUp: '/org-signup',
} as const

function RequireAuth({ children }: { children: JSX.Element }) {
  const { loading, isAuthenticated } = useAuth()
  if (loading) return null
  return isAuthenticated ? children : <Navigate to={PATHS.signIn} replace />
}

function RequireAdmin({
  children,
  fallbackPath = '/',
}: {
  children: JSX.Element
  fallbackPath?: string
}) {
  const { loading, profile } = useAuth()
  if (loading) return null
  return isAdminRole(profile?.role) ? (
    children
  ) : (
    <Navigate to={fallbackPath} replace />
  )
}

// Lazy-loaded pages
const Login = lazy(() => import('../../features/auth/pages/Login'))
const SignUp = lazy(() => import('../../features/auth/pages/SignUp'))
const OrgSignUp = lazy(() => import('../../features/auth/pages/OrgSignUp'))

// App shell + feature pages
const HomeLayout = lazy(() => import('../../features/home/pages/HomePage'))
const OrganizationProfilePage = lazy(() => import('../../features/settings/pages/OrganizationProfile'))
const ManageUsersPage = lazy(() => import('../../features/settings/pages/ManageUsersPage'))
const AdminPanel = lazy(() => import('../../features/settings/pages/AdminPanel'))
const SkillListPage = lazy(() => import('../../features/skills/pages/SkillListPage'))
const NewSkillPage = lazy(() => import('../../features/skills/pages/NewSkillPage'))
const SkillDetailViewPage = lazy(() => import('../../features/skills/pages/SkillDetailViewPage'))
const SkillEditPage = lazy(() => import('../../features/skills/pages/SkillEditPage'))
const AthletesListPage = lazy(() => import('../../features/athletes/pages/AthletesListPage')) // ⬅️ added
const NewAthletePage = lazy(() => import('../../features/athletes/pages/NewAthletePage'))
const AthleteDetailPage = lazy(() => import('../../features/athletes/pages/AthleteDetailPage'))
const EditAthletePage = lazy(() => import('../../features/athletes/pages/EditAthletePage'))
const CoachListPage = lazy(() => import('../../features/coaches/pages/CoachListPage'))
const AthleteDetail = lazy(() => import('../../features/admin/pages/AdminAthleteDetail'))
const AdminCoachDetail = lazy(() => import('../../features/admin/pages/AdminCoachDetail'))
const TeamsPage = lazy(() => import('../../features/teams/pages/TeamsPage'))
const NewTeamPage = lazy(() => import('../../features/teams/pages/NewTeamPage'))
const TeamDetailPage = lazy(() => import('../../features/teams/pages/TeamDetailPage'))
const EditTeamPage = lazy(() => import('../../features/teams/pages/EditTeamPage'))
const DrillsPage = lazy(() => import('../../features/drills/pages/DrillsPage'))  
const ViewDrillPage = lazy(() => import('../../features/drills/pages/ViewDrillPage'))
const NewDrillPage = lazy(() => import('../../features/drills/pages/NewDrillPage'))
const EditDrillPage = lazy(() => import('../../features/drills/pages/EditDrillPage'))
const ScorecardTemplatesPage = lazy(() => import('../../features/scorecards/pages/AdminScorecardTemplatesPage'))
const ScorecarteTemplateDetailPage = lazy(() => import('../../features/scorecards/pages/AdminScorecardTemplateDetailPage'))
const EvaluationsListPage = lazy(() => import('../../features/evaluations/pages/EvaluationsListPage'))
const EvaluationsDetailPage = lazy(() => import('../../features/evaluations/pages/EvaluationsDetailPage'))
const EditEvaluationPage = lazy(() => import('../../features/evaluations/pages/EditEvaluationPage'))
const AthletesEvaluationReportPage = lazy(() => import('../../features/reports/pages/AthletesEvaluationReportPage'))
const EvaluationReportListPage = lazy(() => import('../../features/reports/pages/EvaluationReportListPage'))
const CoachEvaluationReportListPage = lazy(() => import('../../features/reports/pages/CoachEvaluationReportListPage'))
const EvaluationReportDetailPage = lazy(() => import('../../features/reports/pages/EvaluationReportDetailPage'))
const NewEvaluationDetailPage = lazy(() => import('../../features/evaluations/pages/NewEvaluationDetailPage'))
const PracticePlansListPage = lazy(() => import('../../features/practice-plans/pages/PracticePlansListPage'))
const NewPracticePlanPage = lazy(() => import('../../features/practice-plans/pages/NewPlanPage'))
const ViewPracticePlanPage = lazy(() => import('../../features/practice-plans/pages/ViewPracticePlanPage'))
const EditPracticePlansPage = lazy(() => import('../../features/practice-plans/pages/EditPracticePlansPage'))
const JoinCodesListPage = lazy(() => import('../../features/join-codes/pages/JoinCodesListPage'))
const NewJoinCodePage = lazy(() => import('../../features/join-codes/pages/NewJoinCodePage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={null /* or a spinner */}>
      <Routes>
        {/* Auth routes */}
        <Route path={PATHS.signIn} element={<Login />} />
        <Route path={PATHS.signUp} element={<SignUp />} />
        <Route path={PATHS.orgSignUp} element={<OrgSignUp />} />

        {/* App shell with side nav & app bar */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomeLayout />
            </RequireAuth>
          }
        >
          {/* Default landing inside the app */}
          <Route index element={<Navigate to="/settings/organization" replace />} />

          {/* Settings */}
          <Route path="settings/organization" element={<OrganizationProfilePage />} />
          <Route path="settings/users" element={<ManageUsersPage />} />
          <Route path="settings/admin" element={<AdminPanel />} />

          <Route path="admin/athletes/:id" element={<AthleteDetail />} />
          <Route path="admin/coaches/:coachId" element={<AdminCoachDetail />} />
         <Route path="admin/coaches/:coachId" element={<AdminCoachDetail />} />
         

          {/* Skills */}
          <Route path="skills" element={<SkillListPage />} />
          <Route path="skills/new" element={<NewSkillPage />} />
          <Route path="skills/:id" element={<SkillDetailViewPage />} />
          <Route
            path="skills/:id/edit"
            element={
              <RequireAdmin fallbackPath="/skills">
                <SkillEditPage />
              </RequireAdmin>
            }
          />
          <Route path="scorecards" element={<ScorecardTemplatesPage />} />
          <Route path="scorecards/:id" element={<ScorecarteTemplateDetailPage />} />

          {/* Other menu links */}
          <Route path="athletes" element={<AthletesListPage />} />
          <Route path="athletes/new" element={<NewAthletePage />} />
          <Route path="athletes/:id" element={<AthleteDetailPage />} />
          <Route path="athletes/:id/edit" element={<EditAthletePage />} />
          <Route path="coaches" element={<CoachListPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/new" element={<NewTeamPage />} />
          <Route path="teams/:id" element={<TeamDetailPage />} />
          <Route path="teams/:id/edit" element={<EditTeamPage />} />
          <Route path="easy-join-codes" element={<JoinCodesListPage />} />
          <Route path="easy-join-codes/new" element={<NewJoinCodePage />} />
          <Route path="drills" element={<DrillsPage />} />
          <Route path="drills/new" element={<NewDrillPage />} />
          <Route path="drills/:id" element={<ViewDrillPage />} />
          <Route
            path="drills/:id/edit"
            element={
              <RequireAdmin fallbackPath="/drills">
                <EditDrillPage />
              </RequireAdmin>
            }
          />
          <Route path="evaluations" element={<EvaluationsListPage />} />      
          <Route path="evaluations/create" element={<NewEvaluationDetailPage />} />
          <Route path="evaluations/:id" element={<EvaluationsDetailPage />} />
          <Route path="evaluations/:id/edit" element={<EditEvaluationPage />} />
          <Route path="reports/athletes-evaluations" element={<AthletesEvaluationReportPage />} />
          <Route path="reports/evaluation-reports" element={<EvaluationReportListPage />} />
          <Route path="reports/evaluation-reports/:id" element={<EvaluationReportDetailPage />} />
          <Route path="reports/coach-evaluation-reports" element={<CoachEvaluationReportListPage />} />
          <Route path="/practice-plans" element={<PracticePlansListPage />} />
          <Route path="/practice-plans/new" element={<NewPracticePlanPage />} />
          <Route path="/practice-plans/:id" element={<ViewPracticePlanPage />} />
          <Route path="/practice-plans/:id/edit" element={<EditPracticePlansPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={PATHS.signIn} replace />} />
      </Routes>
    </Suspense>
  )
}
