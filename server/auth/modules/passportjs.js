const fs = require('fs');
var passport = require('passport')
var authprovider = require('../../models/authProvider')

class PassportJs{
    constructor(authmanager,settings){
        this.authmanager = authmanager
        this.registeredProviders = {}
        this.providers = settings
        this.endpoint = "/api/auth"
    }

    async registerAuth(expressapp){
        expressapp.use(passport.initialize());
        expressapp.use(passport.session());
        
        for(const p of this.providers){
            for(const [name,provider] of Object.entries(p)){
                const auth_id = `passportjs_${provider.type}_${name}`

                if(!(provider.type in this.registeredProviders)){
                    this.registerProvider(provider.typename,auth_id)
                }
                try{
                    this.registeredProviders[provider.type].register(expressapp,passport,this.endpoint,name,provider)
                    authprovider.create(auth_id)
                } catch(error){
                    console.error(`La connexion ${name} de type ${provider.type} n'as pu être chargé.`)
                }
            }
        }

        passport.serializeUser(function(user, done) {
            done(null, user);
          });
          
          passport.deserializeUser(function(user, done) {
            done(null, user);
          });
    }

    async registerProvider(providerType,auth_id){
        try{
            const providerPath = `${process.cwd()}/auth/modules/passport-providers/${providerType}.js`
            const Provider = require(providerPath);
            this.registeredProviders[providerType]= new Provider(this,auth_id)
            console.info(`Le type de connexion '${providerType}' a été ajouté dans passportjs.`)
        } catch(error){
            console.error(`Le type de connexion '${providerType}' n'as pas pu être chargé dans passportjs.`)
        }
    }


    register(userinfos){
        this.authmanager.register(userinfos)
    }

    authenticate(userinfos){
        this.authenticate(userinfos)
    }
    
}

module.exports = PassportJs;