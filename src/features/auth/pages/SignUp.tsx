import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../theme/AppTheme';
import ColorModeSelect from '../theme/ColorModeSelect';
import {  SitemarkIcon } from '../components/CustomIcons';
import MenuItem from '@mui/material/MenuItem';
import { signUp, makeAthleteInput, makeCoachInput } from '../services/signupService';
import { useNavigate } from 'react-router-dom'; 



const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  maxWidth: 560,
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    maxWidth: 900,
  },

  /* keep smaller screens scrollable, let desktop breathe */
  maxHeight: '85dvh',
  overflowY: 'auto',
  scrollbarGutter: 'stable',
  [theme.breakpoints.up('md')]: {
    maxHeight: 'none',
    overflowY: 'visible',
  },

  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));
const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

//COACH FORM
// {
//     "joinCode": "BOU-LAX-2026A-COACH-1",
//     "role": "coach",
//     "email": "cruzdejesusenmanueln@gmail.com",
//     "password": "Enter2021",
//     "firstName": "Jose",
//     "lastName": "Cruz",
//     "cellNumber": "555-222-3333",
//     "termsAccepted": true,
//     "username": "coach_jose"
//   }

//ATHLETE FORM 
// {
//     "joinCode": "BOU-LAX-2026A-ATH-1",
//     "role": "athlete",
//     "email": "enmanuelcruzdejesus@gmail.com",
//     "password": "Open2020",
//     "firstName": "Enmanuel",
//     "lastName": "Cruz",
//     "cellNumber": "555-111-2222",
//     "graduationYear": 2027,
//     "positions": ["Attack"],
//     "termsAccepted": true,
//     "username": "ecruz"
//   }

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  
  const navigate = useNavigate(); // ✅ hook

  const [role, setRole] = React.useState<'athlete' | 'coach'>('athlete');
  const [typeCodeError, setTypeCodeError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [firstNameError, setFirstNameError] = React.useState(false);
  const [firstNameErrorMessage, setFirstNameErrorMessage] = React.useState('');
  const [lastNameError, setLasNameError] = React.useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    return isValid;
  };

  // const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  //   if (nameError || emailError || passwordError) {
  //     event.preventDefault();
  //     return;
  //   }
  //   const data = new FormData(event.currentTarget);
  //   console.log({
  //     name: data.get('name'),
  //     lastName: data.get('lastName'),
  //     email: data.get('email'),
  //     password: data.get('password'),
  //   });
  // };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // keep your existing error flags respected
        if (nameError || emailError || passwordError) return;

        const form = new FormData(event.currentTarget);

        // map form fields to payload
        const joinCode = String(form.get('typecode') || '').trim(); // "typecode" input -> joinCode
        const email = String(form.get('email') || '').trim();
        const password = String(form.get('password') || '');
        const firstName = String(form.get('firstName') || '').trim();
        const lastName = String(form.get('lastName') || '').trim();
        const cellNumberRaw = form.get('cellNumber');
        const cellNumber = (cellNumberRaw ? String(cellNumberRaw) : '').trim() || undefined;

        // username may not be present in your current form—fallback to email local-part
        const usernameField = String(form.get('username') || '').trim();
        const username = usernameField || (email.includes('@') ? email.split('@')[0] : '');

        // checkbox: FormData returns "on" when checked
        const termsAccepted =
          !!form.get('termsAccepted') ||
          !!(document.getElementById('termsAccepted') as HTMLInputElement | null)?.checked;

        // athlete-only fields (gracefully handle if hidden/not present)
        const graduationYearStr = String(form.get('graduationYear') || '').trim();
        const graduationYear = graduationYearStr ? Number(graduationYearStr) : NaN;

        const positionsValue = String(form.get('positions') || '').trim();
        const positions = positionsValue ? [positionsValue] : [];

        try {
          if (role === 'athlete') {
            const input = makeAthleteInput({
              joinCode,
              email,
              password,
              firstName,
              lastName,
              username,
              cellNumber,
              termsAccepted,
              graduationYear,
              positions,
            });
            const res = await signUp(input);
            console.log('Signup (athlete) OK:', res);
            navigate('/');
          } else {
            const input = makeCoachInput({
              joinCode,
              email,
              password,
              firstName,
              lastName,
              username,
              cellNumber,
              termsAccepted,
            });
            const res = await signUp(input);
            console.log('Signup (coach) OK:', res);
            navigate('/');
          }
        } catch (err: any) {
          console.error('Signup error:', err);
          // minimal feedback without altering UI structure
          alert(err?.message || 'Signup failed');
        }
      };
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Create Account
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="name">TypeCode</FormLabel>
              <TextField
                autoComplete="off"
                name="typecode"
                required
                fullWidth
                id="typecode"
                placeholder="BOU-LAX-2026A-COACH-1"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="role">Role</FormLabel>
              <TextField
                id="role"
                name="role"
                select
                fullWidth
                value={role}
                onChange={(e) => setRole(e.target.value as 'athlete' | 'coach')}
              >
                <MenuItem value="athlete">Athlete</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
              </TextField>
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="firstName">First name</FormLabel>
              <TextField
                autoComplete="given-name"
                name="firstName"
                id="firstName"
                required
                fullWidth
                placeholder="Jose"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="lastName">Last name</FormLabel>
              <TextField
                autoComplete="family-name"
                name="lastName"
                id="lastName"
                required
                fullWidth
                placeholder="Cruz"
              />
            </FormControl>

            {/* ATHLETE-ONLY FIELDS */}
            {role === 'athlete' && (
              <>
                <FormControl>
                  <FormLabel htmlFor="graduationYear">Graduation year</FormLabel>
                  <TextField
                    type="number"
                    name="graduationYear"
                    id="graduationYear"
                    required
                    fullWidth
                    placeholder="2026"
                    inputProps={{ min: 1900, max: 2100 }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="positions">Position</FormLabel>
                  <TextField
                    id="positions"
                    name="positions"
                    select
                    fullWidth
                    defaultValue=""
                    placeholder="Select position"
                  >
                    <MenuItem value="Attack">Attack</MenuItem>
                    <MenuItem value="MidField">MidField</MenuItem>
                    <MenuItem value="Defense">Defense</MenuItem>
                    <MenuItem value="Goalie">Goalie</MenuItem>
                  </TextField>
                </FormControl>
              </>
            )}

            <FormControl>
              <FormLabel htmlFor="cellNumber">Cell number</FormLabel>
              <TextField
                type="tel"
                autoComplete="tel"
                name="cellNumber"
                id="cellNumber"
                fullWidth
                placeholder="555-222-3333"
              />
            </FormControl>

            <FormControlLabel
              sx={{ gridColumn: { sm: '1 / -1' } }}
              control={<Checkbox name="termsAccepted" id="termsAccepted" color="primary" required />}
              label="I agree to the Terms of Service and Privacy Policy."
            />
            <FormControlLabel
              sx={{ gridColumn: { sm: '1 / -1' } }}
              control={<Checkbox name="parentGuardian" id="parentGuardian" color="primary" />}
              label="I'm a Parent/Guardian"
            />

            <Button
              sx={{ gridColumn: { sm: '1 / -1' } }}
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Sign up
            </Button>              
          </Box>
          <Typography sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <Link
                component="button"
                type="button"
                onClick={() => navigate('/sign-in')}
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign In
              </Link>
            </Typography>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
