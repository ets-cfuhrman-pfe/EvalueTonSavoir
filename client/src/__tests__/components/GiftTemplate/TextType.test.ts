// TextType.test.ts

import { TextFormat } from "gift-pegjs";
import textType from "../../../components/GiftTemplate/templates/TextType";

describe('TextType', () => {
    it('should format text with basic characters correctly', () => {
        const input: TextFormat = {
            text: 'Hello, world! 5 > 3, right?',
            format: 'plain'
        };
        const expectedOutput = 'Hello, world! 5 > 3, right?';
        expect(textType({ text: input })).toBe(expectedOutput);
    });

    it('should format text with newlines correctly', () => {
        const input: TextFormat = {
            text: 'Hello,\nworld!\n5 > 3, right?',
            format: 'plain'
        };
        const expectedOutput = 'Hello,<br>world!<br>5 > 3, right?';
        expect(textType({ text: input })).toBe(expectedOutput);
    });
  
    it('should format text with LaTeX correctly', () => {
        const input: TextFormat = {
            text: '$$E=mc^2$$',
            format: 'plain'
        };
        // the following expected output is a bit long, but it's a good way to test the output.
        // You could do a "snapshot" test if you prefer, but it's less readable.
        // Hint -- if the output changes because of a change in the code or library, you can update
        //   by running the test and copying the "Received string:" in jest output 
        //   when it fails (assuming the output is correct)
        const expectedOutput = '<span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">E=mc^2</annotation></semantics></math></span><span class=\"katex-html\" aria-hidden=\"true\"><span class=\"base\"><span class=\"strut\" style=\"height:0.6833em;\"></span><span class=\"mord mathnormal\" style=\"margin-right:0.05764em;\">E</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span><span class=\"mrel\">=</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span></span><span class=\"base\"><span class=\"strut\" style=\"height:0.8641em;\"></span><span class=\"mord mathnormal\">m</span><span class=\"mord\"><span class=\"mord mathnormal\">c</span><span class=\"msupsub\"><span class=\"vlist-t\"><span class=\"vlist-r\"><span class=\"vlist\" style=\"height:0.8641em;\"><span style=\"top:-3.113em;margin-right:0.05em;\"><span class=\"pstrut\" style=\"height:2.7em;\"></span><span class=\"sizing reset-size6 size3 mtight\"><span class=\"mord mtight\">2</span></span></span></span></span></span></span></span></span></span></span></span>'; 
        expect(textType({ text: input })).toContain(expectedOutput);
    });

    it('should format text with two equations (inline and separate) correctly', () => {
        const input: TextFormat = {
            text: '$a + b = c$ ? $$E=mc^2$$',
            format: 'plain'
        };
        // hint: katex-display is the class that indicates a separate equation
        const expectedOutput = '<span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow><mi>a</mi><mo>+</mo><mi>b</mi><mo>=</mo><mi>c</mi></mrow><annotation encoding=\"application/x-tex\">a + b = c</annotation></semantics></math></span><span class=\"katex-html\" aria-hidden=\"true\"><span class=\"base\"><span class=\"strut\" style=\"height:0.6667em;vertical-align:-0.0833em;\"></span><span class=\"mord mathnormal\">a</span><span class=\"mspace\" style=\"margin-right:0.2222em;\"></span><span class=\"mbin\">+</span><span class=\"mspace\" style=\"margin-right:0.2222em;\"></span></span><span class=\"base\"><span class=\"strut\" style=\"height:0.6944em;\"></span><span class=\"mord mathnormal\">b</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span><span class=\"mrel\">=</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span></span><span class=\"base\"><span class=\"strut\" style=\"height:0.4306em;\"></span><span class=\"mord mathnormal\">c</span></span></span></span> ? <span class=\"katex-display\"><span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">E=mc^2</annotation></semantics></math></span><span class=\"katex-html\" aria-hidden=\"true\"><span class=\"base\"><span class=\"strut\" style=\"height:0.6833em;\"></span><span class=\"mord mathnormal\" style=\"margin-right:0.05764em;\">E</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span><span class=\"mrel\">=</span><span class=\"mspace\" style=\"margin-right:0.2778em;\"></span></span><span class=\"base\"><span class=\"strut\" style=\"height:0.8641em;\"></span><span class=\"mord mathnormal\">m</span><span class=\"mord\"><span class=\"mord mathnormal\">c</span><span class=\"msupsub\"><span class=\"vlist-t\"><span class=\"vlist-r\"><span class=\"vlist\" style=\"height:0.8641em;\"><span style=\"top:-3.113em;margin-right:0.05em;\"><span class=\"pstrut\" style=\"height:2.7em;\"></span><span class=\"sizing reset-size6 size3 mtight\"><span class=\"mord mtight\">2</span></span></span></span></span></span></span></span></span></span></span></span>';
        expect(textType({ text: input })).toContain(expectedOutput);
    });

    it('should format text with a katex matrix correctly', () => {
        const input: TextFormat = {
            text: `Donnez le déterminant de la matrice suivante.$$\\begin\{pmatrix\}
   a&b \\\\
   c&d
\\end\{pmatrix\}`,
            format: 'plain'
        };
        const expectedOutput = 'Donnez le déterminant de la matrice suivante.<span class=\"katex\"><span class=\"katex-mathml\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\"><semantics><mrow></mrow><annotation encoding=\"application/x-tex\"></annotation></semantics></math></span><span class=\"katex-html\" aria-hidden=\"true\"></span></span>\\begin{pmatrix}<br>   a&b \\\\<br>   c&d<br>\\end{pmatrix}';
        expect(textType({ text: input })).toContain(expectedOutput);
    });

    it('should format text with Markdown correctly', () => {
        const input: TextFormat = {
            text: '**Bold**',
            format: 'markdown'
        };
        // TODO: investigate why the output has an extra newline
        const expectedOutput = '<strong>Bold</strong>\n';
        expect(textType({ text: input })).toBe(expectedOutput);
    });

    it('should format text with HTML correctly', () => {
        const input: TextFormat = {
            text: '<em>yes</em>',
            format: 'html'
        };
        const expectedOutput = '<em>yes</em>';
        expect(textType({ text: input })).toBe(expectedOutput);
    });

    it('should format plain text correctly', () => {
        const input: TextFormat = {
            text: 'Just plain text',
            format: 'plain'
        };
        const expectedOutput = 'Just plain text';
        expect(textType({ text: input })).toBe(expectedOutput);
    });

    // Add more tests for other formats if needed
});
