const fs = require('fs');
const AuthConfig = require('../config/auth.js');
const jwt = require('../middleware/jwtToken.js');
const emailer = require('../config/email.js');
const MISSING_REQUIRED_PARAMETER = {
    message: 'Paramètre requis manquant.',
    code: 400
};
class AuthManager{
    constructor(expressapp,configs=null,userModel){
        this.modules = []
        this.app = expressapp

        this.configs = configs ?? (new AuthConfig()).loadConfig()
        this.addModules()
        this.registerAuths()
        this.simpleregister = userModel;
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
        for(const module of this.modules){
            try{
                module.registerAuth(this.app)
            } catch(error){
                console.error(`L'enregistrement du module ${module} a échoué.`);
                console.error(`Error: ${error} `);
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async login(userInfo,req,res,next){ //passport and simpleauth use next
        const tokenToSave = jwt.create(userInfo.email, userInfo._id,userInfo.roles);
        res.redirect(`/auth/callback?user=${tokenToSave}&username=${userInfo.name}`);
        console.info(`L'utilisateur '${userInfo.name}' vient de se connecter`)
    }

    async register(userInfos){
        if (!userInfos.email || !userInfos.password) {
            throw MISSING_REQUIRED_PARAMETER;
        }
        const user = await this.simpleregister.register(userInfos);
        emailer.registerConfirmation(user.email)
        return user
    }
}

module.exports = AuthManager;