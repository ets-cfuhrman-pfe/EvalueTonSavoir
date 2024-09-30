const fs = require('fs');
const AuthConfig = require('../config/auth.js');

class AuthManager{
    constructor(expressapp,configs=null){
        this.modules = []
        this.app = expressapp

        this.configs = configs ?? (new AuthConfig()).loadConfig()
        this.addModules()
        this.registerAuths()
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
            console.error(`Le module d'authentification ${name} n'as pas été chargé car il est introuvable`)
        }
    }

    async registerAuths(){
        for(const module of this.modules){
            try{
                module.registerAuth(this.app)
            } catch(error){
                console.error(`L'enregistrement du module ${module} a échoué.`)
            }
        }
    }

    async login(userInfos){
        // TODO global user login method
        console.log(userInfos)
    }

    async register(userInfos){
        // TODO global user register method
        console.log(userInfos)
    }

    async logout(){
        // TODO global user logout method
    }
}

module.exports = AuthManager;