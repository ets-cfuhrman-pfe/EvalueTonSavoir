var OAuth2Strategy = require('passport-oauth2')

class PassportOAuth {
    register(app, passport,endpoint, name, provider) {
        const cb_url =`${process.env['BACKEND_URL']}${endpoint}/${name}/callback`
        passport.use(name, new OAuth2Strategy({
            authorizationURL: provider.OAUTH_AUTHORIZATION_URL,
            tokenURL: provider.OAUTH_TOKEN_URL,
            clientID: provider.OAUTH_CLIENT_ID,
            clientSecret: provider.OAUTH_CLIENT_SECRET,
            callbackURL: cb_url,
            passReqToCallback: true
        },
        async function(req, accessToken, refreshToken, params, profile, done) {
            try {
                const userInfoResponse = await fetch(provider.OAUTH_USERINFO_URL, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const userInfo = await userInfoResponse.json();

                const user = {
                    id: userInfo.sub,
                    email: userInfo.email,
                    name: userInfo.name,
                    groups: userInfo.groups ?? [],
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    expiresIn: params.expires_in
                };

                // Store the tokens in the session
                req.session.oauth2Tokens = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    expiresIn: params.expires_in
                };

                return done(null, user);
            } catch (error) {
                console.error(`Erreur dans la strategie OAuth2 '${name}' : ${error}`);
                return done(error);
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
                    //const redirectUrl = `http://your-frontend-url.com/oauth/callback?user=${encodeURIComponent(req.user)}`;
                    //res.redirect(redirectUrl);
                    console.info(`L'utilisateur '${req.user.name}' vient de se connecter`)
                } else {
                    res.status(401).json({ error: "L'authentification a échoué" });
                }
            }
        );
    }
}

module.exports = PassportOAuth;
