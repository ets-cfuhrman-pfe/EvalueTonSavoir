export function applyHideAnswersMask(previewHtml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, 'text/html');

    doc.querySelectorAll<HTMLElement>('.choice-button').forEach((choiceButton) => {
        choiceButton.classList.remove('bg-success', 'bg-danger', 'text-white');
        choiceButton.classList.add('bg-light', 'text-dark');
    });

    doc.querySelectorAll<HTMLElement>('.choice-letter, .choice-marker').forEach((choiceMarker) => {
        choiceMarker.classList.remove('text-success', 'text-danger', 'border-success', 'border-danger');
        choiceMarker.classList.add('text-dark');
    });

    doc.querySelectorAll('.alert.alert-info.small, .true-feedback, .false-feedback, .gift-preview-feedback, .feedback-container').forEach((feedbackNode) => {
        feedbackNode.remove();
    });

    doc.querySelectorAll<HTMLInputElement>('input.gift-preview-input').forEach((answerInput) => {
        answerInput.setAttribute('placeholder', '');
    });

    return doc.body.innerHTML;
}
