var OAuth2Strategy = require('passport-oauth2')
var authUserAssoc = require('../../../models/authUserAssociation')
var users = require('../../../models/users')
var { hasNestedValue } = require('../../../utils')
var jwt = require('../../../middleware/jwtToken')

class PassportOAuth {
    constructor(passportjs,auth_name){
        this.passportjs = passportjs
        this.auth_name = auth_name
    }

    register(app, passport,endpoint, name, provider) {
        const cb_url =`${process.env['BACKEND_URL']}${endpoint}/${name}/callback`
        const self = this

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

                let received_user = {
                    auth_id: userInfo.sub,
                    email: userInfo.email,
                    name: userInfo.name,
                    roles: []
                };
                
                if(hasNestedValue(userInfo,provider.OAUTH_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher')
                if(hasNestedValue(userInfo,provider.OAUTH_ROLE_STUDENT_VALUE)) received_user.roles.push('student')

                const user_association = await authUserAssoc.find_user_association(self.auth_name._id,received_user.auth_id)

                let user_account = null
                if(user_association){
                    user_account = await users.getById(user_association.user_id)
                } 
                else {
                    let user_id = await users.getId(received_user.email)
                    user_account = user_id ? await users.getById(user_id) : await users.register(received_user.email,"")
                    await authUserAssoc.link(self.auth_name,received_user.auth_id,user_account._id)
                }

                user_account.name = received_user.name
                user_account.roles = received_user.roles
                await users.editUser(user_account)
                self.passportjs.authenticate(user_account)

                // Store the tokens in the session
                req.session.oauth2Tokens = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    expiresIn: params.expires_in
                };

                return done(null, user_account);
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
                    // res.json(req.user)

                    //const redirectUrl = `http://your-frontend-url.com/oauth/callback?user=${encodeURIComponent(req.user)}`;
                    //res.redirect(redirectUrl);

                    const tokenToSave = jwt.create(req.user.email, req.user._id);
                    res.redirect('/oauth/callback?user=' + tokenToSave);

                    console.info(`L'utilisateur '${req.user.name}' vient de se connecter`)
                } else {
                    res.status(401).json({ error: "L'authentification a échoué" });
                }
            }
        );
    }
}

module.exports = PassportOAuth;
