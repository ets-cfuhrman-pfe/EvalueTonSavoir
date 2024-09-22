const fs = require('fs');

const settings = {
    "passport-js":{
        "gmatte" : {
            type: "oauth",
            authorization_url: process.env['OAUTH_AuthorizeUrl'],
            client_id : process.env['OAUTH_ClientID'],
            client_secret: process.env['OAUTH_ClientSecret'],
            config_url: process.env['OAUTH_ConfigUrl'],
            authorization_url: process.env['OAUTH_AuthorizeUrl'],
            userinfo_url: process.env['OAUTH_UserinfoUrl'],
            token_url: process.env['OAUTH_TokenUrl'],
            logout_url: process.env['OAUTH_LogoutUrl'],
            jwks : process.env['OAUTH_JWKS']
        }
    }
}

class AuthManager{
    constructor(expressapp){
        this.modules = []
    }

    async setExpressApp(expressapp){
        this.app = expressapp
    }

    async addModule(name){
        const modulePath = `${process.cwd()}/auth/modules/${name}.js`

        if(fs.existsSync(modulePath)){
            const Module = require(modulePath);
            this.modules.push(new Module(this,settings[name]));
            console.debug(`Auth module ${name} added`)
        }
    }

    async registerAuths(){
        for(const module of this.modules){
            module.registerAuth(this.app)
        }
    }

    async showAuths(){
        let authsData = []
        for(const module in this.modules){
            authsData.push(module.showAuth())
        }
        return authsData;
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

const authManager = new AuthManager();
module.exports = authManager;