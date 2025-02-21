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
        const expectedOutput = '<span class="katex-display"><span class="katex"><span class="katex-mathml"><math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>E=mc^2</math></span><span aria-hidden="true" class="katex-html"><span class="base"><span style="height:0.6833em;" class="strut"></span><span style="margin-right:0.05764em;" class="mord mathnormal">E</span><span style="margin-right:0.2778em;" class="mspace"></span><span class="mrel">=</span><span style="margin-right:0.2778em;" class="mspace"></span></span><span class="base"><span style="height:0.8641em;" class="strut"></span><span class="mord mathnormal">m</span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span style="height:0.8641em;" class="vlist"><span style="top:-3.113em;margin-right:0.05em;"><span style="height:2.7em;" class="pstrut"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>'; 
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with two equations (inline and separate) correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: '$a + b = c$ ? $$E=mc^2$$',
            format: 'moodle'
        };
        const expectedOutput = '<span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>a</mi><mo>+</mo><mi>b</mi><mo>=</mo><mi>c</mi></mrow>a + b = c</math></span><span aria-hidden="true" class="katex-html"><span class="base"><span style="height:0.6667em;vertical-align:-0.0833em;" class="strut"></span><span class="mord mathnormal">a</span><span style="margin-right:0.2222em;" class="mspace"></span><span class="mbin">+</span><span style="margin-right:0.2222em;" class="mspace"></span></span><span class="base"><span style="height:0.6944em;" class="strut"></span><span class="mord mathnormal">b</span><span style="margin-right:0.2778em;" class="mspace"></span><span class="mrel">=</span><span style="margin-right:0.2778em;" class="mspace"></span></span><span class="base"><span style="height:0.4306em;" class="strut"></span><span class="mord mathnormal">c</span></span></span></span> ? <span class="katex-display"><span class="katex"><span class="katex-mathml"><math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>E=mc^2</math></span><span aria-hidden="true" class="katex-html"><span class="base"><span style="height:0.6833em;" class="strut"></span><span style="margin-right:0.05764em;" class="mord mathnormal">E</span><span style="margin-right:0.2778em;" class="mspace"></span><span class="mrel">=</span><span style="margin-right:0.2778em;" class="mspace"></span></span><span class="base"><span style="height:0.8641em;" class="strut"></span><span class="mord mathnormal">m</span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span style="height:0.8641em;" class="vlist"><span style="top:-3.113em;margin-right:0.05em;"><span style="height:2.7em;" class="pstrut"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>';
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with an inline katex matrix correctly', () => {
        const input: TextFormat = {
            // Text here would already be past the GIFT parsing stage, so we don't need to escape GIFT special characters
            text: `Inline matrix: \\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };

         
        // warning: there are zero-width spaces "​" in the expected output -- you must enable seeing them with an extension such as Gremlins tracker in VSCode

         
        const expectedOutput = `Inline matrix: <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo fence="true">(</mo><mtable rowspacing="0.16em"><mtr><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>a</mi></mstyle></mtd><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>b</mi></mstyle></mtd></mtr><mtr><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>c</mi></mstyle></mtd><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>d</mi></mstyle></mtd></mtr></mtable><mo fence="true">)</mo></mrow> \\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix} </math></span><span aria-hidden="true" class="katex-html"><span class="base"><span style="height:2.4em;vertical-align:-0.95em;" class="strut"></span><span class="minner"><span style="top:0em;" class="mopen delimcenter"><span class="delimsizing size3">(</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span style="height:1.45em;" class="vlist"><span style="top:-3.61em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">a</span></span></span><span style="top:-2.41em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span style="height:0.95em;" class="vlist"><span></span></span></span></span></span><span style="width:0.5em;" class="arraycolsep"></span><span style="width:0.5em;" class="arraycolsep"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span style="height:1.45em;" class="vlist"><span style="top:-3.61em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">b</span></span></span><span style="top:-2.41em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span style="height:0.95em;" class="vlist"><span></span></span></span></span></span></span></span><span style="top:0em;" class="mclose delimcenter"><span class="delimsizing size3">)</span></span></span></span></span></span>`;
        expect(FormattedTextTemplate(input)).toContain(expectedOutput);
    });

    it('should format text with an inline katex matrix correctly, with \\( and \\) as inline delimiters.', () => {
        const input: TextFormat = {
            text: `Donnez le déterminant de la matrice suivante.\\( \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\)`,
            format: ''
        };
        const expectedOutput = 'Donnez le déterminant de la matrice suivante.<span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo fence="true">(</mo><mtable rowspacing="0.16em"><mtr><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>a</mi></mstyle></mtd><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>b</mi></mstyle></mtd></mtr><mtr><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>c</mi></mstyle></mtd><mtd><mstyle displaystyle="false" scriptlevel="0"><mi>d</mi></mstyle></mtd></mtr></mtable><mo fence="true">)</mo></mrow> \\begin{pmatrix} a &amp; b \\\\ c &amp; d \\end{pmatrix} </math></span><span aria-hidden="true" class="katex-html"><span class="base"><span style="height:2.4em;vertical-align:-0.95em;" class="strut"></span><span class="minner"><span style="top:0em;" class="mopen delimcenter"><span class="delimsizing size3">(</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span style="height:1.45em;" class="vlist"><span style="top:-3.61em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">a</span></span></span><span style="top:-2.41em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">c</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span style="height:0.95em;" class="vlist"><span></span></span></span></span></span><span style="width:0.5em;" class="arraycolsep"></span><span style="width:0.5em;" class="arraycolsep"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span style="height:1.45em;" class="vlist"><span style="top:-3.61em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">b</span></span></span><span style="top:-2.41em;"><span style="height:3em;" class="pstrut"></span><span class="mord"><span class="mord mathnormal">d</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span style="height:0.95em;" class="vlist"><span></span></span></span></span></span></span></span><span style="top:0em;" class="mclose delimcenter"><span class="delimsizing size3">)</span></span></span></span></span></span>';
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
        const expectedOutput = '<img width="50p" alt="" src="https://www.etsmtl.ca/assets/img/ets.svg">\n';
        expect(FormattedTextTemplate(input)).toBe(expectedOutput);
    });
});
