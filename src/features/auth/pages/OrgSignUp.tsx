import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CssBaseline from '@mui/material/CssBaseline'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

import AdminInfoForm from '../components/AdminInfoForm'
import InfoMobile from '../components/InfoMobile'
import OrganizationForm from '../components/OrganizationForm'
import TeamsForm from '../components/TeamsForm'
import AppTheme from '../theme/AppTheme'
import ColorModeIconDropdown from '../theme/ColorModeIconDropdown'
import AnkorBrandPanel from '../components/AnkorBrandPanel'

// JSON-only backend submit helpers
import { buildOrgSignupPayload, submitOrgSignupJson } from '../services/orgSignUpService'

const steps = ['Admin Info', 'Organization', 'Teams']

function getStepContent(step: number) {
  switch (step) {
    case 0:
      return <AdminInfoForm />
    case 1:
      return <OrganizationForm />
    case 2:
      return <TeamsForm />
    default:
      throw new Error('Unknown step')
  }
}

export default function OrgSignUp(props: { disableCustomTheme?: boolean }) {
  const [activeStep, setActiveStep] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = React.useState<string | null>(null)

  // Single form wrapper so we can read values and build JSON
  const formRef = React.useRef<HTMLFormElement>(null)

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1))
  const goNext = () => setActiveStep((s) => Math.min(steps.length - 1, s + 1))

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (activeStep < steps.length - 1) {
      goNext()
      return
    }

    // Last step => send JSON
    if (!formRef.current) return

    // Client-side guard for password match (optional; backend also validates)
    const fd = new FormData(formRef.current)
    const pw = String(fd.get('adminPassword') ?? '')
    const pw2 = String(fd.get('adminPasswordConfirm') ?? '')
    if (pw !== pw2) {
      setServerError('Passwords do not match')
      return
    }

    setSubmitting(true)
    setServerSuccess(null)
    try {
      const payload = buildOrgSignupPayload(formRef.current)
      const result = await submitOrgSignupJson(payload)
      if (!result.ok) {
        setServerError(result.error || 'Signup failed')
        return
      }
      setServerSuccess(`Organization created! orgId: ${result.orgId}`)
      setActiveStep(steps.length) // show success screen
    } catch (err: any) {
      setServerError(err?.message ?? String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <Box sx={{ position: 'fixed', top: '1rem', right: '1rem' }}>
        <ColorModeIconDropdown />
      </Box>

      <Grid
        container
        sx={{
          height: { xs: '100%', sm: 'calc(100dvh - var(--template-frame-height, 0px))' },
          mt: { xs: 4, sm: 0 },
        }}
      >
        {/* Left brand panel */}
        <Grid
          size={{ xs: 12, sm: 5, lg: 4 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRight: { sm: 'none', md: '1px solid' },
            borderColor: { sm: 'none', md: 'divider' },
            alignItems: 'start',
            pt: 16,
            px: 10,
            gap: 4,
          }}
        >
          <AnkorBrandPanel />
        </Grid>

        {/* Right content */}
        <Grid
          size={{ sm: 12, md: 7, lg: 8 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            width: '100%',
            backgroundColor: { xs: 'transparent', sm: 'background.default' },
            alignItems: 'start',
            pt: { xs: 0, sm: 16 },
            px: { xs: 2, sm: 10 },
            gap: { xs: 4, md: 8 },
          }}
        >
          {/* Desktop stepper */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: { sm: 'space-between', md: 'flex-end' },
              alignItems: 'center',
              width: '100%',
              maxWidth: { sm: '100%', md: 600 },
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexGrow: 1,
              }}
            >
              <Stepper id="desktop-stepper" activeStep={activeStep} sx={{ width: '100%', height: 40 }}>
                {steps.map((label) => (
                  <Step sx={{ ':first-child': { pl: 0 }, ':last-child': { pr: 0 } }} key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>

          {/* Mobile summary (left intact) */}
          <Card sx={{ display: { xs: 'flex', md: 'none' }, width: '100%' }}>
            <CardContent
              sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Selected products
                </Typography>
                <Typography variant="body1">{activeStep >= 2 ? '$144.97' : '$134.98'}</Typography>
              </div>
              <InfoMobile totalPrice={activeStep >= 2 ? '$144.97' : '$134.98'} />
            </CardContent>
          </Card>

          {/* Main content */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              width: '100%',
              maxWidth: { sm: '100%', md: 600 },
              maxHeight: '720px',
              gap: { xs: 5, md: 'none' },
            }}
          >
            {/* Mobile stepper */}
            <Stepper id="mobile-stepper" activeStep={activeStep} alternativeLabel sx={{ display: { sm: 'flex', md: 'none' } }}>
              {steps.map((label) => (
                <Step
                  sx={{ ':first-child': { pl: 0 }, ':last-child': { pr: 0 }, '& .MuiStepConnector-root': { top: { xs: 6, sm: 12 } } }}
                  key={label}
                >
                  <StepLabel sx={{ '.MuiStepLabel-labelContainer': { maxWidth: '70px' } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* ===== Form wrapper (JSON submit on Save) ===== */}
            <form ref={formRef} onSubmit={handleSubmit}>
              {activeStep === steps.length ? (
                <Stack spacing={2} useFlexGap>
                  <Typography variant="h1">🎉</Typography>
                  <Typography variant="h5">Organization created!</Typography>
                  {serverSuccess && <Typography>{serverSuccess}</Typography>}
                  <Button variant="contained" sx={{ alignSelf: 'start' }}>Go to dashboard</Button>
                </Stack>
              ) : (
                <React.Fragment>
                  {/* Keep all steps mounted so FormData includes their inputs */}
<Box sx={{ display: activeStep === 0 ? 'block' : 'none' }}>
  <AdminInfoForm />
</Box>
<Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
  <OrganizationForm />
</Box>
<Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
  <TeamsForm />
</Box>

                  {/* Server feedback */}
                  {serverError && (
                    <Typography color="error" sx={{ mt: 2 }}>
                      {serverError}
                    </Typography>
                  )}
                  {serverSuccess && (
                    <Typography color="success.main" sx={{ mt: 2 }}>
                      {serverSuccess}
                    </Typography>
                  )}

                  {/* Navigation buttons */}
                  <Box
                    sx={[
                      {
                        display: 'flex',
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                        alignItems: 'end',
                        flexGrow: 1,
                        gap: 1,
                        pb: { xs: 12, sm: 0 },
                        mt: { xs: 2, sm: 2,  },
                        mb: '60px',
                      },
                      activeStep !== 0 ? { justifyContent: 'space-between' } : { justifyContent: 'flex-end' },
                    ]}
                  >
                    {activeStep !== 0 && (
                      <Button
                        startIcon={<ChevronLeftRoundedIcon />}
                        onClick={handleBack}
                        variant="text"
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
                        disabled={submitting}
                        type="button"
                      >
                        Previous
                      </Button>
                    )}
                    {activeStep !== 0 && (
                      <Button
                        startIcon={<ChevronLeftRoundedIcon />}
                        onClick={handleBack}
                        variant="outlined"
                        fullWidth
                        sx={{ display: { xs: 'flex', sm: 'none' } }}
                        disabled={submitting}
                        type="button"
                      >
                        Previous
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      endIcon={<ChevronRightRoundedIcon />}
                      type={activeStep === steps.length - 1 ? 'submit' : 'button'}
                      onClick={activeStep === steps.length - 1 ? undefined : () => setActiveStep((s) => s + 1)}
                      sx={{ width: { xs: '100%', sm: 'fit-content' } }}
                      disabled={submitting}
                    >
                      {activeStep === steps.length - 1 ? (submitting ? 'Saving…' : 'Save') : 'Next'}
                    </Button>
                  </Box>
                </React.Fragment>
              )}
            </form>
          </Box>
        </Grid>
      </Grid>
    </AppTheme>
  )
}