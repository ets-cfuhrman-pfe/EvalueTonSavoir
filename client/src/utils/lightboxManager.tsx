import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LightboxWrapper } from './enableLightbox';

// Global container for the lightbox
let lightboxContainer: HTMLElement | null = null;
let reactRoot: Root | null = null;

// Function to initialize the lightbox container and component
export const initializeLightbox = () => {
  // Create container if it doesn't exist
  if (!lightboxContainer) {
    lightboxContainer = document.createElement('div');
    lightboxContainer.id = 'react-lightbox-container';
    document.body.appendChild(lightboxContainer);

    // Create React root
    reactRoot = createRoot(lightboxContainer);
    reactRoot.render(<LightboxWrapper />);
  }
};

// Function to cleanup the lightbox
export const cleanupLightbox = () => {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  if (lightboxContainer) {
    document.body.removeChild(lightboxContainer);
    lightboxContainer = null;
  }
};

// Auto-initialize when this module is imported
initializeLightbox();