import { marked, Renderer } from 'marked';

declare global {
  interface Window {
    openLightboxFromDOM: (src: string, all: string[], index: number) => void;
  }
}

const renderer = new Renderer();

renderer.image = ({ href, text }) => {
  return `
    <img
      src="${href}"
      alt="${text}"
      class="markdown-image"
      data-src="${href}"
      style="
        display: block;
        margin: 1rem auto;
        cursor: zoom-in;
        max-height: 15rem;
        max-width: 100%;
      "
    />
  `;
};

marked.use({ renderer });

export default marked;
