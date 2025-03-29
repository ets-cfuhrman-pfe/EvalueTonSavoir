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
  TextField
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import { ImageType } from "../../Types/ImageType";
import ApiService from "../../services/ApiService";
import { Upload } from "@mui/icons-material";

interface ImagesProps {
  handleCopy?: (id: string) => void;
}

const ImageGallery: React.FC<ImagesProps> = ({ handleCopy }) => {
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

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const data = await ApiService.getImages(imgPage, imgLimit);
      setImages(data.images);
      setTotalImg(data.total);
      setLoading(false);
    };
    fetchImages();
  }, [imgPage]);

  const handleDelete = async () => {
    if (imageToDelete) {
      setLoading(true);
      const isDeleted = await ApiService.deleteImage(imageToDelete.id);
      setLoading(false);
      if (isDeleted) {
        setImages(images.filter((image) => image.id !== imageToDelete.id));
        setSelectedImage(null);
        setImageToDelete(null);
        setOpenDeleteDialog(false);
      }
    }
  };

  const defaultHandleCopy = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
  };

  const handleCopyFunction = handleCopy || defaultHandleCopy;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setImportedImage(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  return (
    <Box p={3}>
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
        <Tab label="Gallery" />
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
                  <Card key={obj.id} sx={{ cursor: "pointer" }} onClick={() => setSelectedImage(obj)}>
                    <CardContent sx={{ p: 0 }}>
                      <img
                        src={`data:${obj.mime_type};base64,${obj.file_content}`}
                        alt={`Image ${obj.file_name}`}
                        style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: 8 }}
                      />
                    </CardContent>
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
              onChange={handleImageUpload}  
              slotProps={{
                htmlInput: {
                  accept: "image/*",
                },
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              aria-label="Téléverser"
              onClick={() => { console.log("save..."); }}
              sx={{ ml: 2, height: "100%" }} 
            >
              Téléverser <Upload sx={{ ml: 1 }} />
            </Button>
          </Box>    
        </Box>
      )}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="md">
        <IconButton color="primary" onClick={() => setSelectedImage(null)} sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}>
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
        <DialogActions sx={{ justifyContent: "center" }}>
          {selectedImage && (
            <IconButton onClick={() => handleCopyFunction(selectedImage.id)} color="primary">
              <ContentCopyIcon />
            </IconButton>
          )}
          <IconButton
            onClick={() => {
              setImageToDelete(selectedImage);
              setOpenDeleteDialog(true);
            }}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this image?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageGallery;
