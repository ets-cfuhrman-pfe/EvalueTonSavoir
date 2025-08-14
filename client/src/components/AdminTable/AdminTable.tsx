import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Input,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  InputAdornment,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { AdminTableType } from "../../Types/AdminTableType";
import { LabelMap } from "../../Types/LabelMap";


interface AdminTableProps {
  data: AdminTableType[];
  onDelete: (row: AdminTableType) => void;
  filterKeys?: string[];
  labelMap?: LabelMap;
}

const AdminTable: React.FC<AdminTableProps> = ({
  data,
  onDelete,
  filterKeys = [],
  labelMap = {}, 
}) => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteRow, setDeleteRow] = useState<AdminTableType | null>(null);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (row: AdminTableType) => {
    setDeleteRow(row);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDeleteRow(null);
  };

  const handleConfirmDelete = () => {
    if (deleteRow) {
      onDelete(deleteRow);
    }
    handleCloseDialog();
  };

  const filteredData = data.filter((row) => {
    return Object.values(row).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const headers = Object.keys(labelMap).filter((key) => !filterKeys.includes(key));

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", padding: "16px" }}>
      <Box display="flex" justifyContent="flex-start" marginBottom={2}>
        <Input
          placeholder="Recherche: Enseignant, Courriel..."
          value={searchQuery}
          onChange={handleSearchChange}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
          sx={{ width: "30%" }}
        />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((key) => (
                <TableCell key={key} sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  {labelMap[key] || key} {/* Use custom label from map or fallback to key */}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={row._id} sx={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "inherit" }}>
                  {headers.map((key) => {
                    const value = row[key as keyof AdminTableType];
                    let displayValue;
                    if (value instanceof Date) {
                      displayValue = value.toLocaleDateString();
                    } else if (value && typeof value === "string" && !isNaN(Date.parse(value))) {
                      displayValue = new Date(value).toLocaleDateString();
                    } else {
                      displayValue = value;
                    }

                    return <TableCell key={key}>{displayValue}</TableCell>;
                  })}
                  <TableCell>
                    <IconButton color="error" onClick={() => handleOpenDialog(row)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment supprimer?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminTable;
