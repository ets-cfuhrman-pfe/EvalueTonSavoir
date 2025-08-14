import React from "react";
import ImageGallery from "../../components/ImageGallery/ImageGallery";

const Images: React.FC = () => {

  const handleCopy = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
  };

  return (
    <ImageGallery 
      handleCopy={handleCopy}
    />
  );
};

export default Images;
