import * as React from 'react';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import FormLabel from '@mui/material/FormLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

type TeamRow = {
  id: string;
  sport: string; // kept for serialization / onChange compatibility
  name: string;
};

const sportOptions = ['Lacrosse', 'Soccer', 'Basketball', 'Baseball', 'Hockey', 'Other'];

export default function TeamsForm({
  onChange,
  initial = [{ id: crypto.randomUUID?.() ?? String(Date.now()), sport: '', name: '' }],
}: {
  onChange?: (rows: TeamRow[]) => void;
  initial?: TeamRow[]; // if provided with mixed sports, we default to the first row's sport
}) {
  const initialSport = (initial.find((r) => r.sport)?.sport) ?? '';
  const [selectedSport, setSelectedSport] = React.useState<string>(initialSport);
  const [rows, setRows] = React.useState<TeamRow[]>(
    initial.map((r) => ({ ...r, sport: initialSport }))
  );

  const applySport = (list: TeamRow[], sport: string) =>
    list.map((r) => ({ ...r, sport }));

  const propagate = (next: TeamRow[], sport = selectedSport) => {
    const withSport = applySport(next, sport);
    setRows(withSport);
    onChange?.(withSport);
  };

  const handleAddRow = () => {
    propagate([
      ...rows,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${rows.length + 1}`,
        sport: selectedSport,
        name: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    propagate(rows.filter((r) => r.id !== id));
  };

  const handleNameChange = (id: string, value: string) => {
    propagate(rows.map((r) => (r.id === id ? { ...r, name: value } : r)));
  };

  const handleSportChange = (value: string) => {
    setSelectedSport(value);
    // ensure all rows carry the chosen sport for submission/serialization
    propagate(rows, value);
  };

  return (
    <Grid container spacing={3}>
      <FormGrid size={{ xs: 12 }}>
        <FormLabel required>Sport</FormLabel>
        <Select
          size="small"
          fullWidth
          displayEmpty
          value={selectedSport}
          onChange={(e) => handleSportChange(e.target.value as string)}
          required
        >
          <MenuItem value="">
            <em>Select sport</em>
          </MenuItem>
          {sportOptions.map((opt) => (
            <MenuItem key={opt} value={opt.toLowerCase()}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormGrid>

      <FormGrid size={{ xs: 12 }}>
        <FormLabel required sx={{ mt: 2 }}>
          Teams
        </FormLabel>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="teams grid">
            <TableHead>
              <TableRow>
                <TableCell width="90%">Name of the team</TableCell>
                <TableCell width="10%" align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <OutlinedInput
                      size="small"
                      fullWidth
                      placeholder="e.g., U14 Girls Blue"
                      value={row.name}
                      name={`teams[${row.id}].name`}
                      onChange={(e) => handleNameChange(row.id, e.target.value)}
                      required
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="remove row"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length === 1}
                      size="small"
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Stack direction="row" justifyContent="flex-start" p={1.5}>
            <Button
              variant="text"
              startIcon={<AddCircleOutlineOutlinedIcon />}
              onClick={handleAddRow}
              size="small"
              disabled={!selectedSport}
            >
              Add team
            </Button>
          </Stack>
        </TableContainer>
      </FormGrid>

      {/* Hidden inputs to help with form posts */}
      <input type="hidden" name="teamsSport" value={selectedSport} />
      <input type="hidden" name="teamsJson" value={JSON.stringify(rows)} />
    </Grid>
  );
}
