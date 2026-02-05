import { Box, Divider } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ScorecardCategoriesGrid from "../components/detail/ScorecardCategoriesGrid";
import ScorecardSubskillsGrid from "../components/detail/ScorecardSubskillsGrid";
import ScorecardTemplateFormCard from "../components/detail/ScorecardTemplateFormCard";
import ScorecardTemplateHeader from "../components/detail/ScorecardTemplateHeader";
import useScorecardTemplateBuilder from "../hooks/useScorecardTemplateBuilder";
import type { ScorecardLocationState } from "../types";

export default function AdminScorecardTemplateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = (location.state as ScorecardLocationState) || null;
  const templateId = id ?? "new";

  const {
    template,
    isSaving,
    categories,
    activeCategoryId,
    activeCategory,
    visibleSubskills,
    skills,
    skillsLoading,
    skillsError,
    skillTitleById,
    setTemplateField,
    toggleTemplateActive,
    addCategory,
    deleteCategory,
    handleCategoryRowClick,
    updateCategoryRow,
    addSubskill,
    deleteSubskill,
    updateSubskillRow,
    saveTemplate,
  } = useScorecardTemplateBuilder({
    templateId,
    locationState,
    onSaved: () => navigate("/admin/scorecards/templates"),
  });

  const handleBack = () => navigate(-1);

  return (
    <Box sx={{ p: 3 }}>
      <ScorecardTemplateHeader templateId={templateId} onBack={handleBack} />

      <ScorecardTemplateFormCard
        template={template}
        isSaving={isSaving}
        onChange={setTemplateField}
        onToggleActive={toggleTemplateActive}
        onCancel={handleBack}
        onSave={saveTemplate}
      />

      <Divider sx={{ my: 3 }} />

      <ScorecardCategoriesGrid
        categories={categories}
        activeCategoryId={activeCategoryId}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onRowClick={handleCategoryRowClick}
        onRowUpdate={updateCategoryRow}
      />

      <ScorecardSubskillsGrid
        subskills={visibleSubskills}
        activeCategoryName={activeCategory?.name ?? null}
        skills={skills}
        skillTitleById={skillTitleById}
        skillsLoading={skillsLoading}
        skillsError={skillsError}
        onAddSubskill={addSubskill}
        onDeleteSubskill={deleteSubskill}
        onRowUpdate={updateSubskillRow}
      />
    </Box>
  );
}
