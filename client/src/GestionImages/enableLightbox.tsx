import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'react-lightbox-container';
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  }
}

function LightboxWrapper({ images, index }: { images: string[]; index: number }) {
  const [open, setOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(index);

  if (!open) return null;

  return (
    <Lightbox
      open={open}
      close={() => setOpen(false)}
      slides={images.map((src) => ({ src }))}
      index={currentIndex}
      on={{ view: ({ index }) => setCurrentIndex(index) }}
    />
  );
}

// Appelée depuis le DOM
window.openLightboxFromDOM = (src: string, all: string[], index: number) => {
  console.log("Opening lightbox for:", src);
  ensureContainer();
  root?.render(<LightboxWrapper images={all} index={index} />);
};

// Auto-attach au chargement, exactement comme ton ancienne version
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG' && target.classList.contains('markdown-image')) {
    const clickedSrc = target.getAttribute('src');
    const allImgs = Array.from(document.querySelectorAll('img.markdown-image')) as HTMLImageElement[];
    const allSrcs = allImgs.map((img) => img.src);
    const index = allSrcs.indexOf(clickedSrc || '');
    if (index !== -1) {
      window.openLightboxFromDOM(clickedSrc!, allSrcs, index);
    }
  }
});
