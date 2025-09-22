import { marked, Renderer } from 'marked';

// Customized renderer to support image width and height
//   see https://github.com/markedjs/marked/issues/339#issuecomment-1146363560
const renderer = new Renderer();

renderer.image = ({href, title, text}) => {
    const [width, height] = title?.startsWith('=') ? title.slice(1).split('x').map(v => v.trim()).filter(Boolean) : [];
    // Default to smaller size so zoom effect is more noticeable
    const defaultWidth = width || '400px';
    let imgTag = `<img src="${href}" alt="${text}" class="markdown-image" style="cursor: zoom-in; max-width: min(${defaultWidth}, 100%); height: auto; display: block; margin: 10px auto;"`;
    if (width) imgTag += ` width="${width}"`;
    if (height) imgTag += ` height="${height}"`;
    imgTag += '>';
    return imgTag;
}

marked.use({
  renderer: renderer
});

export default marked;
