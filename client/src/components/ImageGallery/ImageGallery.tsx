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
import EditIcon from "@mui/icons-material/Edit";
import { Images } from "../../Types/Images";
import ApiService from '../../services/ApiService';
import { ENV_VARIABLES } from '../constants';

type Props = {
  galleryOpen: boolean;
  admin: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImageLinks: React.Dispatch<React.SetStateAction<string[]>>;
}

const ImageDialog: React.FC<Props> = ({ galleryOpen, admin, setDialogOpen, setImageLinks }) => {

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [images, setImages] = useState<Images[]>([]);
  const [totalImg, setTotalImg] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [imgLimit] = useState(3);

  const fetchImages = async (page: number, limit: number) => {
    const data = await ApiService.getImages(page, limit);
    setImages(data.images);
    setTotalImg(data.total);
  };

  useEffect(() => {
    fetchImages(imgPage, imgLimit);
  }, [imgPage]); // Re-fetch images when page changes

  const handleEditClick = (id: string) => {
    setEditingId(id === editingId ? null : id);
  };

  const onCopy = (id: string) => {
    const escLink = `${ENV_VARIABLES.IMG_URL}/api/image/get/${id}`;
    console.log(escLink);
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
                    <IconButton onClick={() => onCopy(obj.id)} size="small" data-testid={`copy-button-${obj.id}`}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    {admin && (
                      <>
                        <IconButton onClick={() => handleEditClick(obj.id)} size="small" color="primary" data-testid={`edit-button-${obj.id}`}>
                          <EditIcon fontSize="small" />
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
