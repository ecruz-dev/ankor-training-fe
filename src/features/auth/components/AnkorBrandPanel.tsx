import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function AnkorBrandPanel() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        maxWidth: 500,
      }}
    >
      <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
        <Box
          component="img"
          src="/logo-ankor.png"            // served from public/
          alt="Ankor Lacrosse Logo"
          sx={{ width: 96, height: 96, objectFit: 'contain', mb: 0.5 }}
        />

        <Typography variant="h4" fontWeight={800}>
          Ankor Lacrosse
        </Typography>

        {/* <Typography variant="caption" color="text.secondary">
          Ankor Lacrosse Logo
        </Typography> */}

        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
          BUILT BY COACHES. DESIGNED FOR ATHLETES. POWERED BY PURPOSE.
        </Typography>

        <Typography variant="body2">
          The Ankor Athlete App is a comprehensive, all-in-one lacrosse development ecosystem that
          bridges the gap between coaching and training with precision, clarity, and purpose.
        </Typography>
      </Stack>
    </Box>
  );
}
