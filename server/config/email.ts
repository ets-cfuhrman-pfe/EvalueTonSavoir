import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class Emailer {
    senderEmail = process.env.SENDER_EMAIL;
    psw = process.env.EMAIL_PSW;
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: this.senderEmail,
            pass: this.psw
        }
    });
    
    registerConfirmation(email) {
        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Confirmation de compte',
            text: 'Votre compte a été créé avec succès.'
        });
    }

    newPasswordConfirmation(email,newPassword) {
        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Mot de passe temporaire',
            text: 'Votre nouveau mot de passe temporaire est : ' +  newPassword
        });
    }

    quizShare(email, link) {
        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Un quiz vous a été transféré !',
            text: 'Veuillez suivre ce lien pour ajouter ce quiz à votre compte. '+ link 
        });
    }

}

export default new Emailer()