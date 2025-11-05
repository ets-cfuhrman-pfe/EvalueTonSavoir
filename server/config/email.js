const nodemailer = require('nodemailer');
const logger = require('./logger');
const envConfig = require('./environment');

class Emailer {

    constructor() {
        this.senderEmail = envConfig.get('SENDER_EMAIL');
        this.psw = envConfig.get('EMAIL_PSW');
        
        // Only create transporter if email is configured
        if (this.senderEmail && this.psw) {
            this.transporter = nodemailer.createTransporter({
                service: envConfig.get('EMAIL_SERVICE'),
                auth: {
                    user: this.senderEmail,
                    pass: this.psw
                }
            });
        } else {
            logger.warn('Email service not configured - email features will be disabled');
            this.transporter = null;
        }
    }

    registerConfirmation(email) {
        if (!this.transporter) {
            logger.warn('Email service not configured - skipping registration confirmation', {
                recipient: email,
                emailType: 'registration_confirmation'
            });
            return;
        }

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
        if (!this.transporter) {
            logger.warn('Email service not configured - skipping password reset email', {
                recipient: email,
                emailType: 'password_reset'
            });
            return;
        }

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
        if (!this.transporter) {
            logger.warn('Email service not configured - skipping quiz share email', {
                recipient: email,
                emailType: 'quiz_share'
            });
            return;
        }

        this.transporter.sendMail({
            from: this.senderEmail,
            to: email,
            subject: 'Un quiz vous a été transféré !',
            text: 'Veuillez suivre ce lien pour ajouter ce quiz à votre compte. '+ link 
        });
    }

}

module.exports = new Emailer();