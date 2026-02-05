import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ScorecardTemplatesListFilters from "../components/list/ScorecardTemplatesListFilters";
import ScorecardTemplatesListHeader from "../components/list/ScorecardTemplatesListHeader";
import ScorecardTemplatesListTable from "../components/list/ScorecardTemplatesListTable";
import useScorecardTemplatesList from "../hooks/useScorecardTemplatesList";

export default function AdminScorecardTemplatesPage() {
  const navigate = useNavigate();
  const { rows, searchText, setSearchText } = useScorecardTemplatesList();

  return (
    <Box sx={{ width: "100%" }}>
      <ScorecardTemplatesListHeader />
      <ScorecardTemplatesListFilters
        searchText={searchText}
        onSearchChange={setSearchText}
      />
      <ScorecardTemplatesListTable
        rows={rows}
        onRowClick={(id) => navigate(`/scorecards/${id}`)}
      />
    </Box>
  );
}
