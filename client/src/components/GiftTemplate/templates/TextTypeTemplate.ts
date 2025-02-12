import marked from 'src/markedConfig';

import katex from 'katex';
import { TextFormat } from 'gift-pegjs';
import DOMPurify from 'dompurify';  // cleans HTML to prevent XSS attacks, etc.

function formatLatex(text: string): string {
    let renderedText = '';

    try {
    renderedText = text
        .replace(/\$\$(.*?)\$\$/g, (_, inner) => katex.renderToString(inner, { displayMode: true }))
        .replace(/\$(.*?)\$/g, (_, inner) => katex.renderToString(inner, { displayMode: false }))
        .replace(/\\\[(.*?)\\\]/g, (_, inner) => katex.renderToString(inner, { displayMode: true }))
        .replace(/\\\((.*?)\\\)/g, (_, inner) =>
            katex.renderToString(inner, { displayMode: false })
        );
    } catch (error) {
        renderedText = text;
    }

    return renderedText;
}

/**
 * Formats text based on the format specified in the text object
 * @param text Text object to format
 * @returns Formatted text
 * @throws Error if the text format is not supported
 * @see TextFormat
 * @see TextTypeOptions
 * @see TemplateOptions
 * @see formatLatex
 * @see marked
 * @see katex
 */
export function FormattedTextTemplate(formattedText: TextFormat): string {
    const formatText = formatLatex(formattedText.text.trim());  // latex needs pure "&", ">", etc. Must not be escaped
    let parsedText = ''; 
    let result = '';
    switch (formattedText.format) {
        case '':
        case 'moodle':
        case 'plain':
            // Replace newlines with <br> tags
            result = replaceNewlinesOutsideSVG(formatText);
            break;
        case 'html':
            // Strip outer paragraph tags (not a great approach with regex)
            result = formatText.replace(/(^<p>)(.*?)(<\/p>)$/gm, '$2');
            break;
        case 'markdown':
            parsedText = marked.parse(formatText, { breaks: true, gfm: true }) as string; // <br> for newlines
            result = parsedText.replace(/(^<p>)(.*?)(<\/p>)$/gm, '$2');
            break;
        default:
            throw new Error(`Unsupported text format: ${formattedText.format}`);
    }
    return DOMPurify.sanitize(result);
}

// Function to replace \n outside of SVG paths
function replaceNewlinesOutsideSVG(text: string): string {
    const svgPathRegex = /<path[^>]*d="([^"]*)"[^>]*>/g;
    let result = '';
    let lastIndex = 0;

    // Iterate over all SVG paths
    text.replace(svgPathRegex, (match, _p1, offset) => {
        // Append text before the SVG path, replacing \n with <br>
        result += text.slice(lastIndex, offset).replace(/(?:\r\n|\r|\n)/g, '<br>');
        // Append the SVG path without replacing \n
        result += match;
        // Update the last index
        lastIndex = offset + match.length;
        return match;
    });

    // Append the remaining text, replacing \n with <br>
    result += text.slice(lastIndex).replace(/(?:\r\n|\r|\n)/g, '<br>');
    return result;
}
