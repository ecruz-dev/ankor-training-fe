import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import BoltIcon from '@mui/icons-material/Bolt'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import EmailIcon from '@mui/icons-material/Email'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import BarChartIcon from '@mui/icons-material/BarChart'
import RepeatIcon from '@mui/icons-material/Repeat'
import ScaleIcon from '@mui/icons-material/Scale'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PrintIcon from '@mui/icons-material/Print'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'

const TOP_NAV_ITEMS = [
  'Feed',
  'Workouts',
  'Maxes/PR',
  'Journal',
  'Leaderboard',
  'Docs & Links',
]

const WEEK_DAYS = [
  { day: 'Sat', date: 24, dot: false },
  { day: 'Sun', date: 25, dot: false },
  { day: 'Mon', date: 26, dot: true },
  { day: 'Tue', date: 27, dot: false, selected: true },
  { day: 'Wed', date: 28, dot: true },
  { day: 'Thu', date: 29, dot: true },
  { day: 'Fri', date: 30, dot: true },
]

const SUMMARY_STATS = [
  { label: 'Sets Completed', value: '0', icon: <BarChartIcon fontSize="small" /> },
  { label: 'Total Reps', value: '0', icon: <RepeatIcon fontSize="small" /> },
  { label: 'Tonnage', value: '0', icon: <ScaleIcon fontSize="small" /> },
  { label: 'Session Duration', value: 'N/A', icon: <AccessTimeIcon fontSize="small" /> },
]

export default function HomeDashboardPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        bgcolor: 'grey.50',
        borderRadius: 3,
        p: { xs: 2, md: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'grey.900',
          color: 'common.white',
          borderRadius: 3,
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'common.white',
              color: 'grey.900',
              width: 28,
              height: 28,
            }}
          >
            <WhatshotIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight={700}>
            Ankor
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={2.5}
          alignItems="center"
          sx={{ flexGrow: 1, flexWrap: 'wrap' }}
        >
          {TOP_NAV_ITEMS.map((item) => (
            <Typography
              key={item}
              variant="caption"
              sx={{ letterSpacing: 0.9, textTransform: 'uppercase' }}
            >
              {item}
            </Typography>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="inherit" size="small">
            <EmailIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{ bgcolor: 'warning.main', width: 28, height: 28 }}>
            <WhatshotIcon fontSize="small" />
          </Avatar>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h4" fontWeight={500}>
          Workout Entry
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Stack spacing={2.5}>
            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: 'grey.100',
                        color: 'text.primary',
                        width: 32,
                        height: 32,
                      }}
                    >
                      <BoltIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Exertion Score
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Connect a wearable via the TeamBuilder mobile app to get an
                    Exertion Score.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<LibraryBooksIcon />}
                sx={{
                  bgcolor: 'grey.800',
                  color: 'common.white',
                  borderRadius: 999,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Program Library
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                sx={{
                  bgcolor: 'grey.800',
                  color: 'common.white',
                  borderRadius: 999,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'grey.900' },
                }}
              >
                Print Workout
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      January 2026
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CalendarMonthIcon />}
                      endIcon={<KeyboardArrowDownIcon />}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 999,
                      }}
                    >
                      Monthly
                    </Button>
                    <IconButton size="small">
                      <MoreHorizIcon />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconButton size="small">
                      <ChevronLeftIcon />
                    </IconButton>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: 1,
                        flexGrow: 1,
                      }}
                    >
                      {WEEK_DAYS.map((item) => (
                        <Box key={item.day} sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {item.day}
                          </Typography>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: item.selected
                                ? '1.5px solid'
                                : '1px solid transparent',
                              borderColor: item.selected
                                ? 'grey.700'
                                : 'transparent',
                              display: 'grid',
                              placeItems: 'center',
                              mx: 'auto',
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="subtitle2">
                              {item.date}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: item.dot ? 'error.main' : 'transparent',
                              mx: 'auto',
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                    <IconButton size="small">
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 4, boxShadow: 2 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    January 27, 2026
                  </Typography>
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      border: '2px solid',
                      borderColor: 'grey.700',
                      color: 'text.primary',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FitnessCenterIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={500}>
                    No Workout for the Selected Day
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ textTransform: 'none', borderRadius: 999 }}
                  >
                    View Program Library
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FitnessCenterIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Session Summary
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.5}>
                    {SUMMARY_STATS.map((stat) => (
                      <Grid item xs={6} key={stat.label}>
                        <Paper
                          elevation={0}
                          sx={{
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {stat.label}
                            </Typography>
                            {stat.icon}
                          </Stack>
                          <Typography variant="h6" fontWeight={600} mt={1}>
                            {stat.value}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <UploadFileIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Imported Data
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    No Imported Data for this session.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmojiEventsIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      New PR&apos;s
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    No PRs for this session.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
