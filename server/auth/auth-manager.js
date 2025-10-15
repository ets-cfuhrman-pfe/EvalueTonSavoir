const fs = require('fs');
const AuthConfig = require('../config/auth.js');
const jwt = require('../middleware/jwtToken.js');
const emailer = require('../config/email.js');
const { MISSING_REQUIRED_PARAMETER } = require('../constants/errorCodes.js');
const AppError = require('../middleware/AppError.js');
const logger = require('../config/logger');

class AuthManager{
    constructor(expressapp,configs=null,userModel){
        logger.debug('AuthManager constructor initialized', {
            configs: JSON.stringify(configs),
            userModel: JSON.stringify(userModel)
        });
        this.modules = []
        this.app = expressapp

        this.configs = configs ?? (new AuthConfig()).loadConfig()
        this.addModules()
        this.simpleregister = userModel;
        this.registerAuths()
        logger.debug('AuthManager constructor completed', {
            configs: JSON.stringify(this.configs)
        });
    }

    getUserModel(){
        return this.simpleregister;
    }

    async addModules(){
        for(const module in this.configs.auth){
            this.addModule(module)
        }
    }

    async addModule(name){
        const modulePath = `${process.cwd()}/auth/modules/${name}.js`

        if(fs.existsSync(modulePath)){
            const Module = require(modulePath);
            this.modules.push(new Module(this,this.configs.auth[name]));
            logger.info(`Module d'authentification '${name}' ajouté`, {
                moduleName: name,
                modulePath: modulePath
            })
        } else{
            logger.error(`Le module d'authentification ${name} n'as pas été chargé car il est introuvable`, {
                moduleName: name,
                modulePath: modulePath
            });
        }
    }

    async registerAuths(){
        logger.debug('Starting auth modules registration');
        for(const module of this.modules){
            try{
                module.registerAuth(this.app, this.simpleregister);
            } catch(error){
                logger.error(`L'enregistrement du module ${module} a échoué.`, {
                    module: module,
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async login(userInfo,req,res,next){ //passport and simpleauth use next
        const tokenToSave = jwt.create(userInfo.email, userInfo._id, userInfo.roles);
        res.redirect(`/auth/callback?user=${tokenToSave}&username=${userInfo.name}`);
        logger.info(`L'utilisateur '${userInfo.name}' vient de se connecter`, {
            userId: userInfo._id,
            userEmail: userInfo.email,
            userName: userInfo.name,
            roles: userInfo.roles
        })
    }

    // eslint-disable-next-line no-unused-vars
    async loginSimple(email,pswd,req,res,next){ //passport and simpleauth use next
        logger.debug('Starting simple login process', {
            email: email,
            passwordProvided: !!pswd
        });
        const userInfo = await this.simpleregister.login(email, pswd);
        logger.debug('User authentication successful', {
            userId: userInfo._id,
            userEmail: userInfo.email
        });
        userInfo.roles = ['teacher']; // hard coded role
        const tokenToSave = jwt.create(userInfo.email, userInfo._id, userInfo.roles);
        logger.debug('JWT token created successfully', {
            userId: userInfo._id,
            userEmail: userInfo.email
        });
        res.status(200).json({token: tokenToSave});
        logger.info(`L'utilisateur '${userInfo.email}' vient de se connecter`, {
            userId: userInfo._id,
            userEmail: userInfo.email,
            roles: userInfo.roles
        })
    }

    async register(userInfos, sendEmail=false){
        logger.debug('Starting user registration process', {
            email: userInfos.email,
            hasPassword: !!userInfos.password,
            sendEmail: sendEmail
        });
        if (!userInfos.email || !userInfos.password) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }
        const user = await this.simpleregister.register(userInfos);
        if(sendEmail){
            emailer.registerConfirmation(user.email);
        }
        return user
    }

    async close() {
        // Close the connection from simpleregister if available
        if (this.simpleregister && typeof this.simpleregister.close === 'function') {
            await this.simpleregister.close();
        }
        // If AuthProvider has a direct reference to DBConnection
        if (this.dbConnection && typeof this.dbConnection.close === 'function') {
            await this.dbConnection.close();
        }
    }

}

module.exports = AuthManager;
