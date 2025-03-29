import React, { useState } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageGallery from "../ImageGallery";

const ImageGalleryModal: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Open Image Manager
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
          <IconButton
            onClick={handleClose}
            color="primary"
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <ImageGallery />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGalleryModal;
