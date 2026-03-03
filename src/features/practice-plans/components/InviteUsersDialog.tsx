import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import { invitePlanUsers } from "../services/practicePlanService";
import { listUsers, type UserListItem, userLabel } from "../../settings/services/usersService";

export type InviteUsersDialogProps = {
  open: boolean;
  onClose: () => void;
  planId?: string | null;
  orgId?: string | null;
  addedBy?: string | null;
  title?: string;
};

export default function InviteUsersDialog({
  open,
  onClose,
  planId,
  orgId,
  addedBy,
  title = "Invite users",
}: InviteUsersDialogProps) {
  const [inviteSearch, setInviteSearch] = React.useState("");
  const [inviteUsers, setInviteUsers] = React.useState<UserListItem[]>([]);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteLoadError, setInviteLoadError] = React.useState<string | null>(null);
  const [inviteSendError, setInviteSendError] = React.useState<string | null>(null);
  const [inviteSaving, setInviteSaving] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState<string | null>(null);
  const [inviteSelectedIds, setInviteSelectedIds] = React.useState<string[]>([]);

  const resolvedOrgId = (orgId ?? "").trim();
  const resolvedPlanId = (planId ?? "").trim();
  const resolvedAddedBy = (addedBy ?? "").trim();

  React.useEffect(() => {
    if (!open) return;
    setInviteSearch("");
    setInviteSelectedIds([]);
    setInviteLoadError(null);
    setInviteSendError(null);
    setInviteResult(null);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (!resolvedOrgId) {
      setInviteLoadError("Missing org_id.");
      setInviteUsers([]);
      return;
    }

    let active = true;
    setInviteLoading(true);
    setInviteLoadError(null);

    listUsers({ orgId: resolvedOrgId })
      .then(({ items }) => {
        if (!active) return;
        setInviteUsers(items);
      })
      .catch((err: any) => {
        if (!active) return;
        setInviteUsers([]);
        setInviteLoadError(err?.message || "Failed to load users.");
      })
      .finally(() => {
        if (active) setInviteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, resolvedOrgId]);

  const filteredInviteUsers = React.useMemo(() => {
    const q = inviteSearch.trim().toLowerCase();
    if (!q) return inviteUsers;

    return inviteUsers.filter((u) => {
      const fields = [
        userLabel(u),
        u.user_id,
        u.role ?? "",
        u.phone ?? "",
        String(u.graduation_year ?? ""),
      ].map((value) => value.toLowerCase());
      return fields.some((value) => value.includes(q));
    });
  }, [inviteUsers, inviteSearch]);

  const inviteSelectedSet = React.useMemo(
    () => new Set(inviteSelectedIds),
    [inviteSelectedIds]
  );

  function toggleInviteSelection(userId: string) {
    setInviteSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function selectAllInviteUsers() {
    setInviteSelectedIds((prev) => {
      const next = new Set(prev);
      for (const user of filteredInviteUsers) {
        if (user.user_id) next.add(user.user_id);
      }
      return Array.from(next);
    });
  }

  function clearInviteSelection() {
    setInviteSelectedIds([]);
  }

  async function handleSendInvites() {
    if (!resolvedPlanId) {
      setInviteSendError("Missing plan id.");
      return;
    }
    if (!resolvedOrgId) {
      setInviteSendError("Missing org_id.");
      return;
    }
    if (inviteSelectedIds.length === 0) {
      setInviteSendError("Select at least one user to invite.");
      return;
    }

    setInviteSaving(true);
    setInviteSendError(null);
    setInviteResult(null);

    try {
      const result = await invitePlanUsers(resolvedPlanId, resolvedOrgId, {
        user_ids: inviteSelectedIds,
        added_by: resolvedAddedBy ? resolvedAddedBy : undefined,
      });

      const invitedCount = result.invited_user_ids.length;
      const skippedCount = result.skipped_user_ids.length;
      const message = `Invited ${invitedCount} user${invitedCount === 1 ? "" : "s"}${
        skippedCount > 0 ? `. Skipped ${skippedCount}.` : "."
      }`;

      setInviteResult(message);
      setInviteSelectedIds([]);
    } catch (err: any) {
      setInviteSendError(err?.message || "Failed to send invites.");
    } finally {
      setInviteSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            value={inviteSearch}
            onChange={(e) => setInviteSearch(e.target.value)}
            placeholder="Search users"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {inviteLoading
                ? "Loading users..."
                : `${filteredInviteUsers.length} user${filteredInviteUsers.length === 1 ? "" : "s"}`}
            </Typography>
            <Button
              size="small"
              onClick={selectAllInviteUsers}
              disabled={inviteLoading || filteredInviteUsers.length === 0}
            >
              Select all
            </Button>
            <Button
              size="small"
              onClick={clearInviteSelection}
              disabled={inviteSelectedIds.length === 0}
            >
              Clear
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            {inviteLoading ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading users...
                </Typography>
              </Box>
            ) : inviteLoadError ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="error">
                  {inviteLoadError}
                </Typography>
              </Box>
            ) : filteredInviteUsers.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No users found.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredInviteUsers.map((user, idx) => {
                  const primary = userLabel(user);
                  const metaParts = [
                    user.role ? user.role.replace(/^./, (c) => c.toUpperCase()) : "",
                    user.phone ?? "",
                    user.graduation_year ? `Class of ${user.graduation_year}` : "",
                  ].filter(Boolean);
                  const meta = metaParts.join(" | ");
                  const checked = inviteSelectedSet.has(user.user_id);

                  return (
                    <React.Fragment key={user.user_id}>
                      <ListItemButton
                        onClick={() => toggleInviteSelection(user.user_id)}
                        sx={{ py: 1.1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography fontWeight={800}>{primary}</Typography>}
                          secondary={
                            <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {meta || "No details"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.user_id}
                              </Typography>
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                        />
                      </ListItemButton>
                      {idx !== filteredInviteUsers.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Paper>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Selected: {inviteSelectedIds.length}
            </Typography>
            {inviteResult && (
              <Typography variant="caption" sx={{ color: "success.main" }}>
                {inviteResult}
              </Typography>
            )}
          </Stack>

          {inviteSendError && (
            <Typography variant="caption" color="error">
              {inviteSendError}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSendInvites}
          variant="contained"
          disabled={inviteSaving || inviteSelectedIds.length === 0}
        >
          {inviteSaving ? "Sending..." : "Send invites"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
