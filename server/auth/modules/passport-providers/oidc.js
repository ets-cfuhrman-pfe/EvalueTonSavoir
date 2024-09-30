var OpenIDConnectStrategy = require('passport-openidconnect')

class PassportOpenIDConnect {

    async getConfigFromConfigURL(name,provider){
        try{
            const config = await fetch(provider.OIDC_CONFIG_URL)
            return await config.json()
        } catch (error) {
            console.error(`Les informations de connexions de la connexion OIDC ${name} n'ont pu être chargées.`)
        }
    }

    async register(app, passport,endpoint, name, provider) {

        const config = await this.getConfigFromConfigURL(name,provider)
        const cb_url =`${process.env['BACKEND_URL']}${endpoint}/${name}/callback`

        passport.use(name, new OpenIDConnectStrategy({
            issuer: config.issuer,
            authorizationURL: config.authorization_endpoint,
            tokenURL: config.token_endpoint,
            userInfoURL: config.userinfo_endpoint,
            clientID: provider.OIDC_CLIENT_ID,
            clientSecret: provider.OIDC_CLIENT_SECRET,
            callbackURL: cb_url,
            passReqToCallback: true,
            scope: 'openid profile email ' + `${provider.OIDC_ADD_SCOPE}`,
        },
        // patch pour la librairie permet d'obtenir les groupes, PR en cours mais "morte" : https://github.com/jaredhanson/passport-openidconnect/pull/101
        async function(req, issuer, profile, times, tok, done) {
            try {
                const user = {
                    id: profile.id,
                    email: profile.emails[0].value,
                    name: profile.name.givenName,
                };
                return done(null, user);
            } catch (error) {
                
            }
        }));

        app.get(`${endpoint}/${name}`, (req, res, next) => {
            passport.authenticate(name, {
                scope: 'openid profile email offline_access'+ ` ${provider.OAUTH_ADD_SCOPE}`,
                prompt: 'consent'
            })(req, res, next);
        });

        app.get(`${endpoint}/${name}/callback`, 
            (req, res, next) => {
                passport.authenticate(name, { failureRedirect: '/login' })(req, res, next);
            },
            (req, res) => {
                if (req.user) {
                    res.json(req.user)
                    console.info(`L'utilisateur '${req.user.name}' vient de se connecter`)
                } else {
                    res.status(401).json({ error: "L'authentification a échoué" });
                }
            }
        );
    }
}

module.exports = PassportOpenIDConnect;
