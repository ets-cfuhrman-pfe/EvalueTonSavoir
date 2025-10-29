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
        // the following expected output is a bit long, but it's a good way to test the output.
        // You could do a "snapshot" test if you prefer, but it's less readable.
        // Hint -- if the output changes because of a change in the code or library, you can update
        //   by running the test and copying the "Received string:" in jest output 
        //   when it fails (assuming the output is correct)
        const expectedOutput = '<span class="katex-display"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>E=mc^2</math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.05764em;">E</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.8641em;"></span><span class="mord mathnormal">m</span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>'; 
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with two equations (inline and separate) correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: '$a + b = c$ ? $$E=mc^2$$',
            format: 'moodle'
        };
        const expectedOutput = '<span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>a</mi><mo>+</mo><mi>b</mi><mo>=</mo><mi>c</mi></mrow>a + b = c</math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6667em;vertical-align:-0.0833em;"></span><span class="mord mathnormal">a</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="base"><span class="strut" style="height:0.6944em;"></span><span class="mord mathnormal">b</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal">c</span></span></span></span> ? <span class="katex-display"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>E=mc^2</math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.05764em;">E</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.8641em;"></span><span class="mord mathnormal">m</span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8641em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>';
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with an inline katex matrix correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: `Inline matrix: \\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };

         
        // warning: there are zero-width spaces "​" in the expected output -- you must enable seeing them with an extension such as Gremlins tracker in VSCode

         
        const expectedOutput = `Inline matrix: <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo fence="true">(</mo><mtable rowspacing="0.16em"><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>a</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>b</mi></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>c</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>d</mi></mstyle></mtd></mtr></mtable><mo fence="true">)</mo></mrow> \\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix} </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:2.4em;vertical-align:-0.95em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">(</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">a</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">b</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">)</span></span></span></span></span></span>`;
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with an inline katex matrix correctly, with \\( and \\) as inline delimiters.', () => {
        const input: TextFormat = {
            text: `Donnez le déterminant de la matrice suivante.\\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };
        const expectedOutput = 'Donnez le déterminant de la matrice suivante.<span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo fence="true">(</mo><mtable rowspacing="0.16em"><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>a</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>b</mi></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>c</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>d</mi></mstyle></mtd></mtr></mtable><mo fence="true">)</mo></mrow> \\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix} </math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:2.4em;vertical-align:-0.95em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">(</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">a</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">b</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">)</span></span></span></span></span></span>';
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
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
        const expectedOutput = '<img src="https://www.etsmtl.ca/assets/img/ets.svg" alt="" class="markdown-image" style="--image-max-width: 50p" width="50p">\n';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });
});
