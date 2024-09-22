var passport = require('passport')
var OAuthStrategy = require('passport-oauth').OAuth2Strategy;

class PassportJs{
    constructor(authmanager,settings){
        this.authmanager = authmanager
        this.providers = Object.entries(settings)
    }

    registerAuth(expressapp){
        for(const [name,provider] of this.providers){
            switch(provider.type){
                case "oauth": this.registerOAuth(expressapp,name,provider)
            }
        }
    }

    registerOAuth(app,name,provider){
        passport.use(name, new OAuthStrategy({
            authorizationURL: provider.authorization_url,
            tokenURL: provider.token_url,
            clientID: provider.client_id,
            clientSecret: provider.client_secret,
            callbackURL: `http://localhost:4400/api/auth/gmatte/callback`
          },
          function(accessToken, refreshToken, profile, done) {
            //TODO do something with token + register/login
            console.debug([accessToken,refreshToken,profile])
          }
        ));

        app.use(`/api/auth/${name}`, passport.authenticate(name));
        app.use(`/api/auth/${name}/callback`,
            passport.authenticate(name, { 
                successRedirect: '/', 
                failureRedirect: '/login' 
            })
        );
    }
}

module.exports = PassportJs;