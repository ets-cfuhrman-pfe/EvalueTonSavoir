import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  IconButton,
  Paper,
  Box,
  CircularProgress,
  Button
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ImageType } from "../../Types/ImageType";
import ApiService from '../../services/ApiService';

const Images: React.FC = () => {
  const [images, setImages] = useState<ImageType[]>([]);
  const [totalImg, setTotalImg] = useState(0);
  const [imgPage, setImgPage] = useState(1);
  const [imgLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchImages = async (page: number, limit: number) => {
    setLoading(true);
    const data = await ApiService.getImages(page, limit);
    setImages(data.images);
    setTotalImg(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages(imgPage, imgLimit);
  }, [imgPage]);


  const handleDelete = async (id: string) => {
    setLoading(true);
    const isDeleted = await ApiService.deleteImage(id);
    setLoading(false);
    if (isDeleted) {
      setImages(images.filter(image => image.id !== id));
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
    <Box p={3}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Image ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images.map((obj: ImageType) => (
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
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(obj.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Box display="flex" justifyContent="center" mt={2}>
        <Button onClick={handlePrevPage} disabled={imgPage === 1} color="primary">
          Précédent
        </Button>
        <Button onClick={handleNextPage} disabled={(imgPage * imgLimit) >= totalImg} color="primary">
          Suivant
        </Button>
      </Box>
    </Box>
  );
};

export default Images;
