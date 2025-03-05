import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Paper,
  TextField,
  Box
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Images } from "../../Types/Images";
import ApiService from '../../services/ApiService';

type Props = {
  galleryOpen: boolean;
  admin: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImageLinks: React.Dispatch<React.SetStateAction<string[]>>;
}

const ImageDialog: React.FC<Props> = ({ galleryOpen, admin, setDialogOpen, setImageLinks }) => {

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  /* const [editedFileNames, setEditedFileNames] = useState<{ [key: string]: string }>(
    Object.fromEntries(images.map((img) => [img.id, img.file_name]))
  );
  */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [images, setImages] = useState<Images[]>([]);
  const [totalImg, setTotalImg] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [imgLimit] = useState(3);

  const fetchImages = async (page: number, limit: number) => {
    const data = await ApiService.getImages(page, limit);
    console.log(data);
    setImages(data.images);
    setTotalImg(data.total);
  };

  useEffect(() => {
    fetchImages(imgPage, imgLimit);
  }, [imgPage]); // Re-fetch images when page changes

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleEditClick = (id: string) => {
    setEditingId(id === editingId ? null : id);
  };

  const handleFileNameChange = (id: string, newFileName: string) => {
    //setEditedFileNames((prev) => ({ ...prev, [id]: newFileName }));
  };

  const onCopy = (id: string) => {
    const escLink = 'http://localhost:4400/api/image/get/'+id;
    setCopiedId(id);
    setImageLinks(prevLinks => [...prevLinks, escLink]);
  };

  const handleNextPage = () => {
      if ((imgPage * imgLimit) < totalImg) {
          setImgPage(prev => prev + 1);
      }
  };
  
  const handlePrevPage = () => {
      if (imgPage > 1) {
          setImgPage(prev => prev - 1);
      }
  };

  return (
    <Dialog 
    open={galleryOpen} 
    onClose={() => setDialogOpen(false)}
    maxWidth="xl" // 'md' stands for medium size
    >
      <DialogTitle>
        Images disponibles
        <IconButton
          aria-label="close"
          color="primary"
          onClick={() => setDialogOpen(false)}
          style={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              {images.map((obj: Images) => (
                <TableRow key={obj.id}>
                  <TableCell>
                    <img
                      src={`data:${obj.mime_type};base64,${obj.file_content}`}
                      alt={`Image ${obj.file_name}`}
                      style={{ width: 350, height: "auto", borderRadius: 8 }}
                    />
                  </TableCell>
                  <TableCell>
                    {admin && editingId === obj.id ? (
                      <TextField
                        value={obj.file_name}
                        onChange={(e) => handleFileNameChange(obj.id, e.target.value)}
                        variant="outlined"
                        size="small"
                        style={{ maxWidth: 150 }}
                      />
                    ) : (
                      obj.file_name
                    )}
                  </TableCell>
                  <TableCell  style={{ minWidth: 150 }}>
                    {obj.id}
                    <IconButton onClick={() => onCopy(obj.id)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    {admin && (
                      <>
                        <IconButton onClick={() => handleEditClick(obj.id)} size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(obj.id)} size="small" color="primary">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    {copiedId === obj.id && <span style={{ marginLeft: 8, color: "green" }}>Copié!</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
        <DialogActions style={{ justifyContent: "center", width: "100%" }}>
        <Box display="flex" justifyContent="center" width="100%">
            <Button onClick={handlePrevPage} disabled={imgPage === 1} color="primary">
                Précédent
            </Button>
            <Button onClick={handleNextPage} disabled={(imgPage * imgLimit) >= totalImg} color="primary">
                Suivant
            </Button>
          </Box>
        </DialogActions>
    </Dialog>
  );
};

export default ImageDialog;
