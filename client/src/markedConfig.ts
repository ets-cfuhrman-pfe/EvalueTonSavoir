import { marked, Renderer } from 'marked';

// Customized renderer to support image width and height
//   see https://github.com/markedjs/marked/issues/339#issuecomment-1146363560
declare global {
  interface Window {
    showImageInModal: (src: string, alt: string) => void;
  }
}

const renderer = new Renderer();

renderer.image = ({ href, title, text }) => {
  const [width, height] = title?.startsWith('=') ? title.slice(1).split('x').map(v => v.trim()).filter(Boolean) : [];
  const maxHeight = '15rem'; // Limite maximale de hauteur

  return `
 <div style="max-height: ${maxHeight}; width: ${width || 'auto'}; height: ${height || 'auto'}; text-align: center; display: flex; justify-content: center; align-items: center">
      <img 
          src="${href}" 
          alt="${text}" 
          class="modal-image" 
          style="max-height: ${maxHeight}; width: ${width || 'auto'}; height: ${height || 'auto'}; cursor: zoom-in;" 
      />
  </div>
  `;
};
marked.use({
  renderer: renderer
});


if (typeof window !== 'undefined') {
  window.showImageInModal = (src, alt) => {
    console.log('showImageInModal called with:', src, alt);

    // Check if a modal already exists
    const existingModal = document.querySelector('.image-modal');
    if (existingModal) {
      // If the modal exists, remove it (close the modal)
      document.body.removeChild(existingModal);
      return;
    }

    // Create the modal container
    const modal = document.createElement('div');
    modal.className = 'image-modal'; // Add a class to identify the modal
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // Close the modal when the modal itself is clicked
    modal.onclick = () => {
      document.body.removeChild(modal);
    };
    
    // Create the image element
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    
    img.style.minWidth = '40%';
    img.style.minHeight = '40%';
    
    img.style.cursor = 'zoom-out';
    
    // Allow the modal to close when clicking on the image
    img.onclick = () => {
      document.body.removeChild(modal);
    };
    
    // Append the image to the modal and the modal to the body
    modal.appendChild(img);
    document.body.appendChild(modal);
  };
}

export const attachImageModalListeners = () => {
  const images = document.querySelectorAll('.modal-image');

  images.forEach((image) => {
    // Remove any existing event listeners by cloning the element
    const newImage = image.cloneNode(true) as HTMLElement;
    image.parentNode?.replaceChild(newImage, image);

    // Attach a new event listener
    newImage.addEventListener('click', (event) => {
      const target = event.target as HTMLImageElement;
      const src = target.getAttribute('src');
      const alt = target.getAttribute('alt');
      if (src) {
        window.showImageInModal(src, alt || '');
      }
    });
  });
};

marked.use({
  renderer: renderer,
});

export default marked;
