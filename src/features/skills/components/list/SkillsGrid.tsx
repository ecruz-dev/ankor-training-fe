import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import type { Skill } from "../../services/skillsService";
import { COACHING_POINTS_LIMIT } from "../../constants";
import { formatDate } from "../../utils/formatters";

type SkillsGridProps = {
  skills: Skill[];
};

export default function SkillsGrid({ skills }: SkillsGridProps) {
  return (
    <Grid container spacing={2}>
      {skills.map((skill) => (
        <Grid key={skill.id} item xs={12} sm={6} md={4} lg={3}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip size="small" label={skill.category} color="default" />
                <Chip size="small" label={skill.level} variant="outlined" />
                <Chip
                  size="small"
                  label={skill.status}
                  color={skill.status === "approved" ? "success" : "default"}
                  variant={skill.status === "approved" ? "filled" : "outlined"}
                />
              </Stack>

              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {skill.title}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                {skill.description}
              </Typography>

              {Array.isArray(skill.coaching_points) &&
                skill.coaching_points.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Coaching points
                    </Typography>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                      {skill.coaching_points
                        .slice(0, COACHING_POINTS_LIMIT)
                        .map((point, index) => (
                          <li key={index}>
                            <Typography variant="caption">{point}</Typography>
                          </li>
                        ))}
                      {skill.coaching_points.length > COACHING_POINTS_LIMIT && (
                        <li>
                          <Typography variant="caption" color="text.secondary">
                            +{skill.coaching_points.length - COACHING_POINTS_LIMIT} more
                          </Typography>
                        </li>
                      )}
                    </ul>
                  </Box>
                )}

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                <Chip size="small" label={skill.visibility} variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  Updated {formatDate(skill.updated_at)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
