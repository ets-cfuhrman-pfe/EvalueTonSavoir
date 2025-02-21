let students = []; // Ceci agira comme notre base de données en mémoire

class Student {
    constructor(name, answers = []) {
        this.id = Student.generateId();
        this.name = name;
        this.answers = answers;
    }

    static generateId() {
        return students.length ? students[students.length - 1].id + 1 : 1;
    }

    static create(name, answers = []) {
        const student = new Student(name, answers);
        students.push(student);
        return student;
    }

    static findByName(name) {
        return students.find(student => student.name === name);
    }

    static get(id) {
        return students.find(student => student.id === id);
    }

    static getAll() {
        return students;
    }

    static delete(id) {
        const index = students.findIndex(student => student.id === id);
        if (index !== -1) {
            return students.splice(index, 1)[0];
        }
        return null;
    }
}

module.exports = Student;