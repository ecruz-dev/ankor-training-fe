// HomeLayout.tsx — Ankor Training App (with logo + notifications + profile)
// -------------------------------------------------------------
// Adds the Ankor logo to:
//  • Drawer header (brand row)
//  • AppBar (left of the “Home” title)
//  • Index route placeholder (centered)
// Also adds a NotificationBell + UserProfileMenu in the AppBar.
// -------------------------------------------------------------

import * as React from 'react'
import {
  AppBar,
  Toolbar,
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
  Tooltip,
  useMediaQuery,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
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
import NotificationsIcon from '@mui/icons-material/Notifications'
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

function formatRoleLabel(role?: string | null) {
  const trimmed = (role ?? '').trim()
  if (!trimmed) return undefined
  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase())
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
// Notifications
// -------------------------------------------------------------

type NotificationItem = {
  id: string
  title: string
  description?: string
  topic: string
  createdAt: string
  read: boolean
}

// You can later replace this with data from your backend
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New evaluation report ready',
    description: 'Attack unit evaluation for Team Blue was completed.',
    topic: 'evaluation',
    createdAt: '2025-11-29T10:30:00Z',
    read: false,
  },
  {
    id: '2',
    title: 'Weekly training summary available',
    description: 'Review performance trends for all athletes this week.',
    topic: 'report',
    createdAt: '2025-11-28T18:00:00Z',
    read: false,
  },
  {
    id: '3',
    title: 'Roster update',
    description: 'Two new athletes were added to Team Red.',
    topic: 'team',
    createdAt: '2025-11-27T14:00:00Z',
    read: true,
  },
]

function NotificationBell() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [items, setItems] = React.useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS,
  )

  const open = Boolean(anchorEl)
  const unreadCount = items.filter((n) => !n.read).length

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleItemClick = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
    // Later you can route to detail pages (e.g. evaluations) from here
    handleClose()
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 1 }}>
          <Badge
            color="error"
            badgeContent={unreadCount || undefined}
            overlap="circular"
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 320, maxWidth: 360 },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          {items.length > 0 && unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Typography>
          )}
        </Box>
        <Divider />

        {items.length === 0 && (
          <MenuItem disabled>
            <ListItemText
              primary="No notifications yet"
              secondary="You’ll see evaluation reports and updates here."
            />
          </MenuItem>
        )}

        {items.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => handleItemClick(n.id)}
            sx={{
              alignItems: 'flex-start',
              ...(n.read ? {} : { bgcolor: 'action.hover' }),
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant="body2"
                    fontWeight={n.read ? 400 : 600}
                    noWrap
                  >
                    {n.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={n.topic}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              }
              secondary={
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block', mt: 0.25 }}
                >
                  {n.description}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

// -------------------------------------------------------------
// User profile menu
// -------------------------------------------------------------

type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  role?: string
}

function UserProfileMenu({
  user,
  onLogout,
}: {
  user: User
  onLogout?: () => void
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogoutClick = () => {
    onLogout?.()
    handleClose()
  }

  const initials = React.useMemo(() => {
    if (!user.name) return ''
    const parts = user.name.trim().split(' ')
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
    return (first + last).toUpperCase()
  }, [user.name])

  return (
    <>
      <Tooltip title={user.name}>
        <IconButton
          color="inherit"
          onClick={handleOpen}
          size="small"
          sx={{ ml: 1 }}
        >
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.name}
            sx={{ width: 32, height: 32 }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 260 },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src={user.avatarUrl || undefined}
            alt={user.name}
            sx={{ width: 40, height: 40 }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {user.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: 180 }}
            >
              {user.email}
            </Typography>
            {user.role && (
              <Typography variant="caption" color="text.secondary">
                {user.role}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider />

        <MenuItem onClick={handleClose}>
          <ListItemText primary="View profile" />
        </MenuItem>
        <MenuItem onClick={handleLogoutClick}>
          <ListItemText primary="Log out" />
        </MenuItem>
      </Menu>
    </>
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
  const { profile, user, signOut } = useAuth()

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

  const profileUser = React.useMemo<User>(() => {
    const metadataName =
      typeof user?.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : ''
    const rawName =
      profile?.full_name?.trim() || metadataName.trim() || user?.email || 'User'
    const name = rawName.trim() || 'User'
    const email = profile?.email ?? user?.email ?? ''
    const roleLabel = formatRoleLabel(profile?.role)
    return {
      id: profile?.id ?? user?.id ?? 'unknown',
      name,
      email,
      avatarUrl: null,
      role: roleLabel,
    }
  }, [profile, user])

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
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          {!isMdUp && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleMobile}
              sx={{ mr: 1 }}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Ankor logo"
              sx={{ width: 24, height: 24, objectFit: 'contain' }}
            />
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Home
            </Typography>
          </Box>

          {/* 🔔 Notifications */}
          <NotificationBell />

          {/* 👤 User profile */}
          <UserProfileMenu
            user={profileUser}
            onLogout={() => void signOut()}
          />
        </Toolbar>
      </AppBar>

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
        <DrawerHeader />
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

