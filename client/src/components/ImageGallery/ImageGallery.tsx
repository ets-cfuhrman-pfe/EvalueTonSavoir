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
  Box,
  CircularProgress
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { Images } from "../../Types/Images";
import ApiService from '../../services/ApiService';
import { ENV_VARIABLES } from '../../constants';

type Props = {
  galleryOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImageLinks: React.Dispatch<React.SetStateAction<string[]>>;
};

const ImageDialog: React.FC<Props> = ({ galleryOpen, setDialogOpen, setImageLinks }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [images, setImages] = useState<Images[]>([]);
  const [totalImg, setTotalImg] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [imgLimit] = useState(3);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null; linked: boolean }>({ id: null, linked: false });

  const fetchImages = async (page: number, limit: number) => {
    const data = await ApiService.getImages(page, limit);
    setImages(data.images);
    setTotalImg(data.total);
  };

  useEffect(() => {
    fetchImages(imgPage, imgLimit);
  }, [imgPage]);

  const onCopy = (id: string) => {
    const escLink = `${ENV_VARIABLES.IMG_URL}/api/image/get/${id}`;
    setCopiedId(id);
    setImageLinks(prevLinks => [...prevLinks, escLink]);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const isDeleted = await ApiService.deleteImage(id);
    setLoading(false);
    if (!isDeleted) {
      setDeleteConfirm({ id, linked: true });
    } else {
      setImages(images.filter(image => image.id !== id));
      setDeleteConfirm({ id: null, linked: false });
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      setLoading(true);
      await ApiService.deleteImage(deleteConfirm.id);
      setImages(images.filter(image => image.id !== deleteConfirm.id));
      setDeleteConfirm({ id: null, linked: false });
      setLoading(false);
    }
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
    <Dialog open={galleryOpen} onClose={() => setDialogOpen(false)} maxWidth="xl">
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
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : (
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
                    <TableCell>{obj.file_name}</TableCell>
                    <TableCell style={{ minWidth: 150 }}>
                      {obj.id}
                      <IconButton onClick={() => onCopy(obj.id)} size="small" data-testid={`copy-button-${obj.id}`}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(obj.id)} size="small" color="secondary" data-testid={`delete-button-${obj.id}`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      {copiedId === obj.id && <span style={{ marginLeft: 8, color: "green" }}>Copié!</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      {deleteConfirm.linked && (
        <Dialog open={Boolean(deleteConfirm.id)} onClose={() => setDeleteConfirm({ id: null, linked: false })}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            Cette image est liée à d'autres objets. Êtes-vous sûr de vouloir la supprimer ?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm({ id: null, linked: false })} color="primary">
              Annuler
            </Button>
            <Button onClick={confirmDelete} color="secondary">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      )}
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
