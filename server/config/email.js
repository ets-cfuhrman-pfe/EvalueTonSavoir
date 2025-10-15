const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

class Emailer {

    constructor() {
        this.senderEmail = process.env.SENDER_EMAIL;
        this.psw = process.env.EMAIL_PSW;
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: this.senderEmail,
                pass: this.psw
            }
        });
    }

    registerConfirmation(email) {
        const startTime = Date.now();
        logger.debug('Sending registration confirmation email', {
            recipient: email,
            emailType: 'registration_confirmation',
            module: 'email-service'
        });

        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Confirmation de compte',
            text: 'Votre compte a été créé avec succès.'
        }, (error, info) => {
            const sendTime = Date.now() - startTime;
            
            if (error) {
                logger.error('Registration confirmation email failed', {
                    recipient: email,
                    emailType: 'registration_confirmation',
                    error: error.message,
                    sendTime: `${sendTime}ms`,
                    module: 'email-service'
                });
            } else {
                logger.info('Registration confirmation email sent successfully', {
                    recipient: email,
                    emailType: 'registration_confirmation',
                    messageId: info.messageId,
                    sendTime: `${sendTime}ms`,
                    module: 'email-service'
                });
            }
        });
    }

    newPasswordConfirmation(email, newPassword) {
        const startTime = Date.now();
        logger.debug('Sending password reset email', {
            recipient: email,
            emailType: 'password_reset',
            hasNewPassword: !!newPassword,
            module: 'email-service'
        });

        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Mot de passe temporaire',
            text: 'Votre nouveau mot de passe temporaire est : ' + newPassword
        }, (error, info) => {
            const sendTime = Date.now() - startTime;
            
            if (error) {
                logger.error('Password reset email failed', {
                    recipient: email,
                    emailType: 'password_reset',
                    error: error.message,
                    sendTime: `${sendTime}ms`,
                    module: 'email-service'
                });
            } else {
                logger.info('Password reset email sent successfully', {
                    recipient: email,
                    emailType: 'password_reset',
                    messageId: info.messageId,
                    sendTime: `${sendTime}ms`,
                    module: 'email-service'
                });
            }
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

module.exports = new Emailer();