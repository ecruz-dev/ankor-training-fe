// HomeLayout.tsx - Ankor Training App layout
// -------------------------------------------------------------
// Adds the Ankor logo to:
//  • Drawer header (brand row)
//  • Index route placeholder (centered)
// -------------------------------------------------------------

import * as React from 'react'
import {
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  CssBaseline,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import SettingsIcon from '@mui/icons-material/Settings'
import ApartmentIcon from '@mui/icons-material/Apartment'
import GroupIcon from '@mui/icons-material/Group'
import BuildIcon from '@mui/icons-material/Build'
import EventNoteIcon from '@mui/icons-material/EventNote'

// 🔴 REMOVED: Lacrosse icon
// import SportsIcon from '@mui/icons-material/Sports'
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople'
import GroupsIcon from '@mui/icons-material/Groups'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import InsightsIcon from '@mui/icons-material/Insights' // ✅ NEW: icon for report
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthProvider'

const DRAWER_WIDTH = 280
const LOGO_SRC = '/logo-ankor.png' // put your logo file under /public as logo-ankor.png

type MenuKey =
  | 'settings.organization'
  | 'settings.users'
  | 'settings.admin'
  | 'skills'
  | 'scorecards'
  | 'athletes'
  | 'coaches'
  | 'teams'
  | 'easy-join-codes'
  | 'drills'
  | 'evaluations'
  | 'reports.evaluation'
  | 'reports.coach-evaluation'
  | 'reports.athletes-evaluation'
  | 'practice-plans'

const COACH_MENU_KEYS = new Set<MenuKey>([
  'settings.admin',
  'skills',
  'scorecards',
  'athletes',
  'coaches',
  'teams',
  'easy-join-codes',
  'drills',
  'evaluations',
  'reports.coach-evaluation',
  'practice-plans',
])

const ATHLETE_MENU_KEYS = new Set<MenuKey>([
  'skills',
  'drills',
  'reports.evaluation',
  'practice-plans',
])

type RoleBucket = 'admin' | 'coach' | 'athlete' | 'unknown'

function getRoleBucket(role?: string | null): RoleBucket {
  const normalized = (role ?? '').trim().toLowerCase()
  if (!normalized) return 'unknown'
  if (normalized.includes('admin')) return 'admin'
  if (normalized.includes('coach')) return 'coach'
  if (normalized.includes('parent')) return 'athlete'
  if (normalized.includes('athlete')) return 'athlete'
  return 'unknown'
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  paddingLeft: open ? theme.spacing(2) : theme.spacing(3),
  marginLeft: 0,
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1.5),
  ...theme.mixins.toolbar,
}))

function NavItem({
  to,
  icon,
  label,
  selected,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  label: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <ListItemButton
      component={RouterLink}
      to={to}
      selected={selected}
      onClick={onClick}
      sx={{ borderRadius: 2, mb: 0.5 }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  )
}

// -------------------------------------------------------------
// Main layout
// -------------------------------------------------------------

export default function HomeLayout() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(true)
  const location = useLocation()
  const { profile } = useAuth()

  const roleBucket = React.useMemo(
    () => getRoleBucket(profile?.role),
    [profile?.role],
  )

  const canAccess = React.useCallback(
    (key: MenuKey) => {
      if (roleBucket === 'admin' || roleBucket === 'unknown') return true
      if (roleBucket === 'coach') return COACH_MENU_KEYS.has(key)
      if (roleBucket === 'athlete') return ATHLETE_MENU_KEYS.has(key)
      return false
    },
    [roleBucket],
  )

  const showSettings =
    canAccess('settings.organization') ||
    canAccess('settings.users') ||
    canAccess('settings.admin')

  const toggleMobile = () => setMobileOpen((p) => !p)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const showMobileBottomNav =
    !isMdUp && (roleBucket === 'coach' || roleBucket === 'athlete')

  const evaluationNavPath =
    roleBucket === 'athlete' ? '/reports/evaluation-reports' : '/evaluations'
  const evaluationNavLabel =
    roleBucket === 'athlete' ? 'Evaluation reports' : 'Evaluations'

  const bottomNavValue = isActive(evaluationNavPath)
    ? evaluationNavPath
    : isActive('/practice-plans')
    ? '/practice-plans'
    : isActive('/drills')
    ? '/drills'
    : ''

  const drawerContent = (
    <Box role="navigation" sx={{ width: DRAWER_WIDTH }}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            component="img"
            src={LOGO_SRC}
            alt="Ankor logo"
            sx={{ width: 28, height: 28, objectFit: 'contain' }}
          />
          <Typography variant="h6" fontWeight={700} noWrap>
            Ankor Training
          </Typography>
        </Box>
        <IconButton onClick={toggleMobile} sx={{ display: { md: 'none' } }}>
          {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />

      {/* Menu */}
      <List
        subheader={
          <Typography sx={{ px: 2, pt: 2, pb: 1, fontWeight: 700 }}>
            Menu
          </Typography>
        }
      >
        {showSettings && (
          <>
            <ListItemButton
              onClick={() => setSettingsOpen((p) => !p)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
              {settingsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
              <List sx={{ pl: 2 }}>
                {canAccess('settings.organization') && (
                  <NavItem
                    to="/settings/organization"
                    icon={<ApartmentIcon />}
                    label="Organization Profile"
                    selected={isActive('/settings/organization')}
                    onClick={!isMdUp ? toggleMobile : undefined}
                  />
                )}
                {canAccess('settings.users') && (
                  <NavItem
                    to="/settings/users"
                    icon={<GroupIcon />}
                    label="Manage Users"
                    selected={isActive('/settings/users')}
                    onClick={!isMdUp ? toggleMobile : undefined}
                  />
                )}
                {canAccess('settings.admin') && (
                  <NavItem
                    to="/settings/admin"
                    icon={<AdminPanelSettingsIcon />}
                    label="Admin Panel"
                    selected={isActive('/settings/admin')}
                    onClick={!isMdUp ? toggleMobile : undefined}
                  />
                )}
              </List>
            </Collapse>
          </>
        )}

        {canAccess('skills') && (
          <NavItem
            to="/skills"
            icon={<BuildIcon />}
            label="Skills"
            selected={isActive('/skills')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}

        {canAccess('scorecards') && (
          <NavItem
            to="/scorecards"
            icon={<BuildIcon />}
            label="Score Cards Template"
            selected={isActive('/scorecards')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Menu 2 */}
      <List
        subheader={
          <Typography sx={{ px: 2, pt: 2, pb: 1, fontWeight: 700 }}></Typography>
        }
      >
        {canAccess('athletes') && (
          <NavItem
            to="/athletes"
            icon={<PeopleIconSafe />}
            label="Athletes"
            selected={isActive('/athletes')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('coaches') && (
          <NavItem
            to="/coaches"
            icon={<EmojiPeopleIcon />}
            label="Coaches"
            selected={isActive('/coaches')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('teams') && (
          <NavItem
            to="/teams"
            icon={<GroupsIcon />}
            label="Teams"
            selected={isActive('/teams')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('easy-join-codes') && (
          <NavItem
            to="/easy-join-codes"
            icon={<VpnKeyIcon />}
            label="Easy Join Codes"
            selected={isActive('/easy-join-codes')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('drills') && (
          <NavItem
            to="/drills"
            icon={<FitnessCenterIcon />}
            label="Drills"
            selected={isActive('/drills')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('evaluations') && (
          <NavItem
            to="/evaluations"
            icon={<AssignmentIcon />}
            label="Evaluations"
            selected={isActive('/evaluations')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {canAccess('reports.evaluation') && (
          <NavItem
            to="/reports/evaluation-reports"
            icon={<InsightsIcon />}
            label="Evaluation Reports"
            selected={isActive('/reports/evaluation-reports')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {roleBucket === 'coach' && canAccess('reports.coach-evaluation') && (
          <NavItem
            to="/reports/coach-evaluation-reports"
            icon={<InsightsIcon />}
            label="Evaluation Reports"
            selected={isActive('/reports/coach-evaluation-reports')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
        {/* ✅ NEW: Athletes Evaluation Report */}
        {canAccess('reports.athletes-evaluation') && (
          <NavItem
            to="/reports/athletes-evaluations"
            icon={<InsightsIcon />}
            label="Athletes Evaluation Report"
            selected={isActive('/reports/athletes-evaluations')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}

        {canAccess('practice-plans') && (
          <NavItem
            to="/practice-plans"
            icon={<EventNoteIcon />}
            label="Practice Plans"
            selected={isActive('/practice-plans')}
            onClick={!isMdUp ? toggleMobile : undefined}
          />
        )}
      </List>

      <Divider sx={{ mt: 1 }} />
      <Box sx={{ p: 2, color: 'text.secondary', fontSize: 12 }}>
        <Typography variant="caption">
          Built by coaches. Designed for athletes. Powered by purpose.
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Side navigation drawer */}
      {isMdUp ? (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Main open={isMdUp} sx={{ pb: showMobileBottomNav ? 10 : undefined }}>
        <Outlet />
      </Main>

      {showMobileBottomNav && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: (theme) => theme.zIndex.appBar,
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation value={bottomNavValue} showLabels>
            <BottomNavigationAction
              label={evaluationNavLabel}
              value={evaluationNavPath}
              icon={<AssignmentIcon />}
              component={RouterLink}
              to={evaluationNavPath}
            />
            <BottomNavigationAction
              label="Practice plans"
              value="/practice-plans"
              icon={<EventNoteIcon />}
              component={RouterLink}
              to="/practice-plans"
            />
            <BottomNavigationAction
              label="Drills"
              value="/drills"
              icon={<FitnessCenterIcon />}
              component={RouterLink}
              to="/drills"
            />
          </BottomNavigation>
        </Box>
      )}
    </Box>
  )
}

function PeopleIconSafe() {
  return <PeopleAltIcon />
}



