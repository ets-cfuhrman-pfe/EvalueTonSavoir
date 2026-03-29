import { FormattedTextTemplate } from "src/components/GiftTemplate/templates/TextTypeTemplate";
import { TextFormat } from "gift-pegjs";

describe('TextType', () => {
    it('should format text with basic characters correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: 'Hello, world! 5 > 3, right?',
            format: 'moodle'
        };
        const expectedOutput = 'Hello, world! 5 > 3, right?';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });

    it('should format text with embedded newlines correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: 'Hello,\nworld!\n5 > 3, right?',
            format: 'moodle'
        };
        const expectedOutput = 'Hello,<br>world!<br>5 &gt; 3, right?';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });
  
    it('should format text with display-mode LaTeX correctly, with $$ delimiters', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: '$$E=mc^2$$',
            format: 'plain'
        };
        const output = FormattedTextTemplate(input);
        expect(output).toContain('class="katex-display"');
        expect(output).toContain('class="katex-mathml"');
        expect(output).toContain('E=mc^2');
    });

    it('should format text with two equations (inline and separate) correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: '$a + b = c$ ? $$E=mc^2$$',
            format: 'moodle'
        };
        const output = FormattedTextTemplate(input);
        expect(output).toContain('a + b = c');
        expect(output).toContain('class="katex-display"');
        expect(output).toContain('E=mc^2');
    });

    it('should format text with an inline katex matrix correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: `Inline matrix: \\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };

         
        const output = FormattedTextTemplate(input);
        expect(output).toContain('Inline matrix:');
        expect(output).toContain('class="katex"');
        expect(output).toContain('\\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix}');
    });

    it('should format text with an inline katex matrix correctly, with \\( and \\) as inline delimiters.', () => {
        const input: TextFormat = {
            text: `Donnez le déterminant de la matrice suivante.\\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };
        const output = FormattedTextTemplate(input);
        expect(output).toContain('Donnez le déterminant de la matrice suivante.');
        expect(output).toContain('class="katex"');
        expect(output).toContain('\\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix}');
    });

    it('should format text with Markdown correctly', () => {
        const input: TextFormat = {
            text: '**Bold**',
            format: 'markdown'
        };
        // TODO: investigate why the output has an extra newline
        const expectedOutput = '<strong>Bold</strong>\n';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });

    it('should format text with HTML correctly', () => {
        const input: TextFormat = {
            text: '<em>yes</em>',
            format: 'html'
        };
        const expectedOutput = '<em>yes</em>';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });

    it('should format plain text correctly', () => {
        const input: TextFormat = {
            text: 'Just plain text',
            format: 'plain'
        };
        const expectedOutput = 'Just plain text';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });

    // Add more tests for other formats if needed
    it('should format a resized image correctly', () => {
        const input: TextFormat = {
            text: '![](https\\://www.etsmtl.ca/assets/img/ets.svg "\\=50px")',
            format: 'markdown'
        };
        const output = FormattedTextTemplate(input);
        const doc = new DOMParser().parseFromString(output, 'text/html');
        const image = doc.querySelector('img');

        expect(image).not.toBeNull();
        expect(image?.getAttribute('src')).toBe('https://www.etsmtl.ca/assets/img/ets.svg');
        expect(image?.getAttribute('class')).toContain('markdown-image');
        expect(image?.getAttribute('style')).toContain('--image-max-width: 50p');
        expect(image?.getAttribute('width')).toBe('50p');
    });
});
