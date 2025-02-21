let answers = []; // Ceci agira comme notre base de données en mémoire

class Answer {
    constructor(answerText, showFeedback, points, goodAnswer) {
        this.id = Answer.generateId();
        this.answerText = answerText;
        this.showFeedback = showFeedback;
        this.points = points;
        this.goodAnswer = goodAnswer;
    }

    static generateId() {
        return answers.length ? answers[answers.length - 1].id + 1 : 1;
    }

    static create(answerText, showFeedback, points, goodAnswer) {
        const answer = new Answer(answerText, showFeedback, points, goodAnswer);
        answers.push(answer);
        return answer;
    }

    static get(id) {
        return answers.find(answer => answer.id === id);
    }

    static getAll() {
        return answers;
    }

    static delete(id) {
        const index = answers.findIndex(answer => answer.id === id);
        if (index !== -1) {
            return answers.splice(index, 1)[0];
        }
        return null;
    }
}

module.exports = Answer;