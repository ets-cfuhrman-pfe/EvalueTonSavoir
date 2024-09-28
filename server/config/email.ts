import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class Emailer {
    private senderEmail: string;
    private psw: string;
    private transporter: Transporter;

    constructor() {
        this.senderEmail = process.env.SENDER_EMAIL || '';
        this.psw = process.env.EMAIL_PSW || '';
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || '',
            auth: {
                user: this.senderEmail,
                pass: this.psw
            }
        });
    }

    private handleEmailResult(error: Error | null, info: SentMessageInfo): void {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    }

    registerConfirmation(email: string): void {
        const mailOptions: SendMailOptions = {
            from: this.senderEmail,
            to: email,
            subject: 'Confirmation de compte',
            // Add other email options here if needed
        };
        this.transporter.sendMail(mailOptions, this.handleEmailResult);
    }

    newPasswordConfirmation(email: string, newPassword: string): void {
        const mailOptions: SendMailOptions = {
            from: this.senderEmail,
            to: email,
            subject: 'Mot de passe temporaire',
            text: 'Votre nouveau mot de passe temporaire est : ' +  newPassword
        };
        this.transporter.sendMail(mailOptions, this.handleEmailResult);
    }

    quizShare(email: string, link: string): void {
        const mailOptions: SendMailOptions = {
            from: this.senderEmail,
            to: email,
            subject: 'Un quiz vous a été transféré !',
            text: 'Veuillez suivre ce lien pour ajouter ce quiz à votre compte. '+ link 
        };
        this.transporter.sendMail(mailOptions, this.handleEmailResult);
    }

}

export default Emailer;
