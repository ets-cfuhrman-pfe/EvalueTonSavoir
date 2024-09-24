const fs = require('fs');
var passport = require('passport')

class PassportJs{
    constructor(authmanager,settings){
        this.authmanager = authmanager
        this.registeredProviders = {}
        this.providers = Object.entries(settings)
    }

    registerAuth(expressapp){
        expressapp.use(passport.initialize());
        expressapp.use(passport.session());

        for(const [name,provider] of this.providers){
            if(!(provider.type in this.registeredProviders)){
                this.registerProvider(provider.type)
            }
            this.registeredProviders[provider.type].register(expressapp,passport,name,provider)
        }
    }

    registerProvider(providerType){
        const providerPath = `${process.cwd()}/auth/modules/passport-providers/${providerType}.js`

        if(fs.existsSync(providerPath)){
            const Provider = require(providerPath);
            this.registeredProviders[providerType]= new Provider()
        }
    }
}

module.exports = PassportJs;