const fs = require('fs');
const AuthConfig = require('../config/auth.js');
const jwt = require('../middleware/jwtToken.js');
const emailer = require('../config/email.js');
const { MISSING_REQUIRED_PARAMETER } = require('../constants/errorCodes.js');
const AppError = require('../middleware/AppError.js');

class AuthManager{
    constructor(expressapp,configs=null,userModel){
        console.log(`AuthManager: constructor: configs: ${JSON.stringify(configs)}`);
        console.log(`AuthManager: constructor: userModel: ${JSON.stringify(userModel)}`);
        this.modules = []
        this.app = expressapp

        this.configs = configs ?? (new AuthConfig()).loadConfig()
        this.addModules()
        this.simpleregister = userModel;
        this.registerAuths()
        console.log(`AuthManager: constructor: this.configs: ${JSON.stringify(this.configs)}`);
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
            console.info(`Module d'authentification '${name}' ajouté`)
        } else{
            console.error(`Le module d'authentification ${name} n'as pas été chargé car il est introuvable`);
        }
    }

    async registerAuths(){
        console.log(``);
        for(const module of this.modules){
            try{
                module.registerAuth(this.app, this.simpleregister);
            } catch(error){
                console.error(`L'enregistrement du module ${module} a échoué.`);
                console.error(`Error: ${error} `);
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async login(userInfo,req,res,next){ //passport and simpleauth use next
        const tokenToSave = jwt.create(userInfo.email, userInfo._id, userInfo.roles);
        res.redirect(`/auth/callback?user=${tokenToSave}&username=${userInfo.name}`);
        console.info(`L'utilisateur '${userInfo.name}' vient de se connecter`)
    }

    // eslint-disable-next-line no-unused-vars
    async loginSimple(email,pswd,req,res,next){ //passport and simpleauth use next
        console.log(`auth-manager: loginSimple: email: ${email}, pswd: ${pswd}`);
        const userInfo = await this.simpleregister.login(email, pswd);
        console.log(`auth-manager: loginSimple: userInfo: ${JSON.stringify(userInfo)}`);
        userInfo.roles = ['teacher']; // hard coded role
        const tokenToSave = jwt.create(userInfo.email, userInfo._id, userInfo.roles);
        console.log(`auth-manager: loginSimple: tokenToSave: ${tokenToSave}`);
        //res.redirect(`/auth/callback?user=${tokenToSave}&username=${userInfo.email}`);
        res.status(200).json({token: tokenToSave});
        console.info(`L'utilisateur '${userInfo.email}' vient de se connecter`)
    }

    async register(userInfos, sendEmail=false){
        console.log(userInfos);
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
