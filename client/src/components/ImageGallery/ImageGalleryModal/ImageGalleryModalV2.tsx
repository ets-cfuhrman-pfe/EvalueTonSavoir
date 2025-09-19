import React, { useState } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageGallery from "../ImageGallery";
import { ImageSearch } from "@mui/icons-material";


interface ImageGalleryModalV2Props {
  handleCopy?: (id: string) => void;
}


const ImageGalleryModalV2: React.FC<ImageGalleryModalV2Props> = ({ handleCopy }) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button
        variant="outlined"
        aria-label='images-open'
        onClick={() => handleOpen()}
        className="btn btn-outline-primary d-flex align-items-center gap-2"
        startIcon={<ImageSearch />}
      >
        Images
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded"
        }}
      >
        <DialogContent className="d-flex flex-column align-items-center py-4">
          <IconButton
            onClick={handleClose}
            color="primary"
            aria-label="close"
            className="position-absolute"
            sx={{
              right: 8,
              top: 8,
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <ImageGallery handleCopy={handleCopy}/>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGalleryModalV2;