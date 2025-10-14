const passport = require('passport')
const authprovider = require('../../models/authProvider')
const logger = require('../../config/logger')

class PassportJs{
    constructor(authmanager,settings){
        this.authmanager = authmanager
        this.registeredProviders = {}
        this.providers = settings
        this.endpoint = "/api/auth"
    }

    async registerAuth(expressapp, userModel){
        logger.debug('PassportJs registerAuth initialized', {
            userModel: JSON.stringify(userModel),
            module: 'passportjs'
        });
        expressapp.use(passport.initialize());
        expressapp.use(passport.session());
        
        for(const p of this.providers){
            for(const [name,provider] of Object.entries(p)){
                const auth_id = `passportjs_${provider.type}_${name}`

                if(!(provider.type in this.registeredProviders)){
                    await this.registerProvider(provider.type,auth_id)
                }
                if(provider.type in this.registeredProviders){
                    try{
                        this.registeredProviders[provider.type].register(expressapp,passport,this.endpoint,name,provider,userModel)
                        authprovider.create(auth_id)
                    } catch(error){
                        logger.error(`La connexion ${name} de type ${provider.type} n'as pu être chargé.`, {
                            connectionName: name,
                            providerType: provider.type,
                            error: error.message,
                            stack: error.stack,
                            module: 'passportjs'
                        });
                    }
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
            if(require('fs').existsSync(providerPath)){
                const Provider = require(providerPath);
                this.registeredProviders[providerType]= new Provider(this,auth_id)
                logger.info(`Le type de connexion '${providerType}' a été ajouté dans passportjs.`, {
                    providerType: providerType,
                    authId: auth_id,
                    module: 'passportjs'
                })
            } else {
                logger.error(`Provider file not found: ${providerPath}`, {
                    providerType: providerType,
                    providerPath: providerPath,
                    message: 'Available provider types should have corresponding files in auth/modules/passport-providers/',
                    module: 'passportjs'
                });
                return; // Return early instead of throwing to prevent cascading errors
            }
        } catch(error){
            logger.error(`Le type de connexion '${providerType}' n'as pas pu être chargé dans passportjs.`, {
                providerType: providerType,
                authId: auth_id,
                error: error.message,
                stack: error.stack,
                module: 'passportjs'
            });
        }
    }


    register(userInfos){
        return this.authmanager.register(userInfos)
    }

    authenticate(userInfo,req,res,next){
        return this.authmanager.login(userInfo,req,res,next)
    }
    
}

module.exports = PassportJs;
