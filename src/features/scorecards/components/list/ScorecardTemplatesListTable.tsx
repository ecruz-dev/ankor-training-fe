import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ScorecardTemplateListRow } from "../../types";
import { formatDateTime } from "../../utils/formatters";

type ScorecardTemplatesListTableProps = {
  rows: ScorecardTemplateListRow[];
  loading?: boolean;
  error?: string | null;
  onRowClick: (id: string) => void;
};

export default function ScorecardTemplatesListTable({
  rows,
  loading = false,
  error = null,
  onRowClick,
}: ScorecardTemplatesListTableProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Loading scorecards...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No scorecards found.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {rows.map((row, idx) => {
              const createdBy = row.created_by?.trim() || "";
              const description = row.description?.trim() || "No description.";
              const updatedLabel = formatDateTime(row.updated_at || row.created_at);

              return (
                <React.Fragment key={row.id}>
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => onRowClick(row.id)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {row.name}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {description}
                          </Typography>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{
                              alignItems: { xs: "flex-start", sm: "center" },
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              size="small"
                              color={row.is_active ? "success" : "default"}
                              variant="outlined"
                              label={row.is_active ? "Active" : "Inactive"}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Updated {updatedLabel}
                            </Typography>
                            {createdBy && (
                              <Typography variant="caption" color="text.secondary">
                                Created by {createdBy}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignSelf: "center", ml: 2 }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRowClick(row.id);
                        }}
                      >
                        Edit
                      </Button>
                    </Stack>
                  </ListItemButton>
                  {idx !== rows.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
}
