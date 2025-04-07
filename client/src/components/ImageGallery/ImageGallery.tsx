import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Button,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  DialogContentText,
  Tabs,
  Tab,
  TextField, Snackbar,
  Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import { ImageType } from "../../Types/ImageType";
import ApiService from "../../services/ApiService";
import { Upload } from "@mui/icons-material";
import { ENV_VARIABLES } from '../../constants';
import { escapeForGIFT } from "src/utils/giftUtils";

interface ImagesProps {
  handleCopy?: (id: string) => void;
  handleDelete?: (id: string) => void;
}

const ImageGallery: React.FC<ImagesProps> = ({ handleCopy, handleDelete }) => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [totalImg, setTotalImg] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [imgLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageType | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [importedImage, setImportedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const fetchImages = async () => {
    setLoading(true);
    const data = await ApiService.getUserImages(imgPage, imgLimit);
    setImages(data.images);
    setTotalImg(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, [imgPage]);

  const defaultHandleDelete = async (id: string) => {
    if (imageToDelete) {
      setLoading(true);
      const isDeleted = await ApiService.deleteImage(id);
      setLoading(false);

      if (isDeleted) {
        setImgPage(1);
        fetchImages();
        setSnackbarMessage("Image supprimée avec succès!");
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage("Erreur lors de la suppression de l'image. Veuillez réessayer.");
        setSnackbarSeverity("error");
      }

      setSnackbarOpen(true);
      setSelectedImage(null);
      setImageToDelete(null);
      setOpenDeleteDialog(false);
    }
  };

  const defaultHandleCopy = (id: string) => {
    if (navigator.clipboard) {
      const link = `${ENV_VARIABLES.IMG_URL}/api/image/get/${id}`;
      const imgTag = `[markdown]![alt_text](${escapeForGIFT(link)} "texte de l'infobulle") {T}`;
      setSnackbarMessage("Le lien Markdown de l’image a été copié dans le presse-papiers");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigator.clipboard.writeText(imgTag);
    }
    if(handleCopy) {
      handleCopy(id);
    }
  };

  const handleDeleteFunction = handleDelete || defaultHandleDelete;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setImportedImage(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  const handleSaveImage = async () => {
    try {
      if (!importedImage) {
        setSnackbarMessage("Veuillez choisir une image à téléverser.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const imageUrl = await ApiService.uploadImage(importedImage);

      if (imageUrl.includes("ERROR")) {
        setSnackbarMessage("Une erreur est survenue. Veuillez réessayer plus tard.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      fetchImages();

      setSnackbarMessage("Téléversée avec succès !");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setImportedImage(null);
      setPreview(null);
      setTabValue(0);
    } catch (error) {
      setSnackbarMessage(`Une erreur est survenue.\n${error}\nVeuillez réessayer plus tard.`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };


  return (
    <Box p={3}>
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
        <Tab label="Galerie" />
        <Tab label="Import" />
      </Tabs>
      {tabValue === 0 && (
        <>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gridTemplateRows="repeat(2, 1fr)" gap={2} maxWidth="900px" margin="auto">
                {images.map((obj) => (
                  <Card key={obj.id} sx={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={() => setSelectedImage(obj)}>
                    <CardContent sx={{ p: 0 }}>
                      <img
                        src={`data:${obj.mime_type};base64,${obj.file_content}`}
                        alt={`Image ${obj.file_name}`}
                        style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: 8 }}
                      />
                    </CardContent>
                    <Box display="flex" justifyContent="center" mt={1}>
                      <IconButton onClick={(e) => {
                        e.stopPropagation();
                        defaultHandleCopy(obj.id);
                        }} 
                        color="primary"
                        data-testid={`gallery-tab-copy-${obj.id}`} >
                        
                        <ContentCopyIcon sx={{ fontSize: 18 }} />
                      </IconButton>

                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageToDelete(obj);
                          setOpenDeleteDialog(true);
                        }}
                        color="error"
                        data-testid={`gallery-tab-delete-${obj.id}`}  >

                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button onClick={() => setImgPage((prev) => Math.max(prev - 1, 1))} disabled={imgPage === 1} color="primary">
                  Précédent
                </Button>
                <Button onClick={() => setImgPage((prev) => (prev * imgLimit < totalImg ? prev + 1 : prev))} disabled={imgPage * imgLimit >= totalImg} color="primary">
                  Suivant
                </Button>
              </Box>
            </>
          )}
        </>
      )}
      {tabValue === 1 && (
        <Box display="flex" flexDirection="column" alignItems="center" width="100%" mt={3}>
          {/* Image Preview at the top */}
          {preview && (
            <Box
              mt={2}
              mb={2}
              sx={{
                width: "100%",
                maxWidth: 600,
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 8,
                  maxHeight: "600px", 
                }}
              />
            </Box>
          )}
          <Box display="flex" flexDirection="row" alignItems="center" width="100%" maxWidth={400}>
            <TextField
              type="file"
              data-testid="file-input"
              onChange={handleImageUpload}  
              slotProps={{
                htmlInput: {
                  "data-testid": "file-input",
                  accept: "image/*",
                },
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              aria-label="Téléverser"
              onClick={() => { handleSaveImage() }}
              sx={{ ml: 2, height: "100%" }} 
            >
              Téléverser <Upload sx={{ ml: 1 }} />
            </Button>
          </Box>    
        </Box>
      )}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="md">
        <IconButton color="primary" onClick={() => setSelectedImage(null)} sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
          data-testid="close-button">
          <CloseIcon />
        </IconButton>
        <DialogContent>
          {selectedImage && (
            <img
              src={`data:${selectedImage.mime_type};base64,${selectedImage.file_content}`}
              alt="Enlarged view"
              style={{ width: "100%", height: "auto", borderRadius: 8, maxHeight: "500px" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Supprimer</DialogTitle>
        <DialogContent>
          <DialogContentText>Voulez-vous supprimer cette image?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={() => imageToDelete && handleDeleteFunction(imageToDelete.id)} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbarOpen}
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        >
        <Alert 
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImageGallery;
