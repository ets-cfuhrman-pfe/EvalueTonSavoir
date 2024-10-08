const jwt = require('../../middleware/jwtToken.js');
const emailer = require('../../config/email.js');

const model = require('../../models/users.js');
const AppError = require('../../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, LOGIN_CREDENTIALS_ERROR, GENERATE_PASSWORD_ERROR, UPDATE_PASSWORD_ERROR } = require('../../constants/errorCodes');
const { name } = require('../../models/authProvider.js');

class SimpleAuth{
    constructor(authmanager,settings){
        this.authmanager = authmanager
        this.providers = settings
        this.endpoint = "/api/auth/simple-auth"
    }

    async registerAuth(expressapp){
        try{
            expressapp.post(`${this.endpoint}/register`, (req,res,next)=>this.register(this,req,res));
            expressapp.post(`${this.endpoint}/login`, (req,res,next)=>this.authenticate(this,req,res));
            expressapp.post(`${this.endpoint}/reset-password`, (req,res,next)=>this.resetPassword(this,req,res));
            expressapp.post(`${this.endpoint}/change-password`, jwt.authenticate, (req,res,next)=>this.changePassword(this,req,res));
        } catch(error){
            console.error(`La connexion ${name} de type ${provider.type} n'as pu être chargé.`)
        }
    }

    async register(self,req, res) {
        let userInfos = {
            name: req.body.email,
            email: req.body.email,
            password: req.body.password,
        }
        let user = await self.authmanager.register(userInfos)
        if(user) res.redirect("/")
        else res.redirect("/login")
    }

    async authenticate(self,req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const user = await model.login(email, password);

            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }
        
            user.name = user.name ?? user.email
            self.authmanager.login(user,req,res,next)
        }
        catch (error) {
            return next(error);
        }
    }

    async resetPassword(self,req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const newPassword = await model.resetPassword(email);

            if (!newPassword) {
                throw new AppError(GENERATE_PASSWORD_ERROR);
            }

            emailer.newPasswordConfirmation(email, newPassword);

            return res.status(200).json({
                message: 'Nouveau mot de passe envoyé par courriel.'
            });
        }
        catch (error) {
            return next(error);
        }
    }

    async changePassword(self,req, res, next) {
        try {
            const { email, oldPassword, newPassword } = req.body;

            if (!email || !oldPassword || !newPassword) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // verify creds first
            const user = await model.login(email, oldPassword);

            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }

            const password = await model.changePassword(email, newPassword)

            if (!password) {
                throw new AppError(UPDATE_PASSWORD_ERROR);
            }

            return res.status(200).json({
                message: 'Mot de passe changé avec succès.'
            });
        }
        catch (error) {
            return next(error);
        }
    }
    
}

module.exports = SimpleAuth;