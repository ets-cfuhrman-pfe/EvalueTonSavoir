import React, { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { ZoomIn, ZoomOut } from '@mui/icons-material';

// Types for the lightbox
interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
}

interface LightboxState {
  images: LightboxImage[];
  currentIndex: number;
}

// React component for the lightbox
export const LightboxWrapper: React.FC = () => {
  const [lightboxState, setLightboxState] = useState<LightboxState | null>(null);

  // Global function to open lightbox from DOM
  useEffect(() => {
    (window as any).openLightboxFromDOM = (images: LightboxImage[], currentIndex: number) => {
      setLightboxState({ images, currentIndex });
    };

    return () => {
      delete (window as any).openLightboxFromDOM;
    };
  }, []);

  // Event listener for markdown images
  useEffect(() => {
    const handleImageClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('markdown-image')) {
        event.preventDefault();
        event.stopPropagation();
        
        const imgElement = target as HTMLImageElement;
     

        // Find all markdown images in the document
        const allImages = Array.from(document.querySelectorAll<HTMLImageElement>('.markdown-image'));
       
        // Find the index of the clicked image
        const currentIndex = allImages.findIndex(img => img === imgElement);

        if (currentIndex !== -1) {
          // Convert to lightbox format
          const lightboxImages: LightboxImage[] = allImages.map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title || img.alt,
            width: img.naturalWidth || undefined,
            height: img.naturalHeight || undefined
          }));

          // Open the lightbox
          setLightboxState({ images: lightboxImages, currentIndex });
        }
      }
    };

    document.addEventListener('click', handleImageClick, true); // Use capture phase

    return () => {
      document.removeEventListener('click', handleImageClick, true);
    };
  }, []);

  if (!lightboxState) return null;

  return (
    <Lightbox
      open={true}
      close={() => setLightboxState(null)}
      slides={lightboxState.images}
      index={lightboxState.currentIndex}
      className="custom-lightbox"
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 5, 
        zoomInMultiplier: 2.5,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 3,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 50,
        pinchZoomDistanceFactor: 50,
        scrollToZoom: true,
      }}
      controller={{ 
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: true,
      }}
      render={{
        iconZoomIn: () => <ZoomIn className="lightbox-zoom-icon" />,
        iconZoomOut: () => <ZoomOut className="lightbox-zoom-icon" />,
      }}
    />
  );
};