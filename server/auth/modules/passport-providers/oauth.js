var OAuthStrategy = require('passport-oauth').OAuth2Strategy;

class PassportOAuth{
    register(app,passport,name,provider){
        passport.use(name, new OAuthStrategy({
            authorizationURL: provider.authorization_url,
            tokenURL: provider.token_url,
            clientID: provider.client_id,
            clientSecret: provider.client_secret,
            callbackURL: `http://gti700.gmatte.xyz:4400/api/auth/gmatte/callback`
          },
          function(accessToken, refreshToken, profile, done) {
              done(null,{profile,accessToken,refreshToken});
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
module.exports = PassportOAuth;