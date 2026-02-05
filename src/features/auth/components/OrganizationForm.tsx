import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

export default function OrganizationForm() {
  return (
    <Grid container spacing={3}>
      {/* Organization Name (replaces First/Last Name) */}
      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="org-name" required>
          Organization Name
        </FormLabel>
        <OutlinedInput
          id="org-name"
          name="organizationName"
          type="text"
          placeholder="Ankor Lacrosse Academy"
          autoComplete="organization"
          required
          size="small"
        />
      </FormGrid>

      {/* Logo file uploader */}
      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="org-logo">
          Logo
        </FormLabel>
        <OutlinedInput
          id="org-logo"
          name="logo"
          type="file"
          inputProps={{ accept: 'image/*' }}
          size="small"
        />
      </FormGrid>

      {/* Address 1 */}
      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="address1" required>
          Address line 1
        </FormLabel>
        <OutlinedInput
          id="address1"
          name="address1"
          type="text"
          placeholder="Street name and number"
          autoComplete="address-line1"
          required
          size="small"
        />
      </FormGrid>

      {/* Address 2 */}
      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="address2">Address line 2</FormLabel>
        <OutlinedInput
          id="address2"
          name="address2"
          type="text"
          placeholder="Apartment, suite, unit, etc. (optional)"
          autoComplete="address-line2"
          size="small"
        />
      </FormGrid>

      {/* City */}
      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="city" required>
          City
        </FormLabel>
        <OutlinedInput
          id="city"
          name="city"
          type="text"
          placeholder="New York"
          autoComplete="address-level2"
          required
          size="small"
        />
      </FormGrid>

      {/* State */}
      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="state" required>
          State
        </FormLabel>
        <OutlinedInput
          id="state"
          name="state"
          type="text"
          placeholder="NY"
          autoComplete="address-level1"
          required
          size="small"
        />
      </FormGrid>

      {/* Zip */}
      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="zip" required>
          Zip / Postal code
        </FormLabel>
        <OutlinedInput
          id="zip"
          name="zip"
          type="text"
          placeholder="12345"
          autoComplete="postal-code"
          required
          size="small"
        />
      </FormGrid>

      {/* Country */}
      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="country" required>
          Country
        </FormLabel>
        <OutlinedInput
          id="country"
          name="country"
          type="text"
          placeholder="United States"
          autoComplete="country-name"
          required
          size="small"
        />
      </FormGrid>     
    </Grid>
  );
}
