var OAuth2Strategy = require('passport-oauth2')
var authUserAssoc = require('../../../models/authUserAssociation')
var { hasNestedValue } = require('../../../utils')

class PassportOAuth {
    constructor(passportjs, auth_name) {
        this.passportjs = passportjs
        this.auth_name = auth_name
    }

    register(app, passport, endpoint, name, provider, userModel) {
        const cb_url = `${process.env['OIDC_URL']}${endpoint}/${name}/callback`
        const self = this
        const scope = 'openid profile email offline_access' + ` ${provider.OAUTH_ADD_SCOPE}`;

        passport.use(name, new OAuth2Strategy({
            authorizationURL: provider.OAUTH_AUTHORIZATION_URL,
            tokenURL: provider.OAUTH_TOKEN_URL,
            clientID: provider.OAUTH_CLIENT_ID,
            clientSecret: provider.OAUTH_CLIENT_SECRET,
            callbackURL: cb_url,
            passReqToCallback: true
        },
            async function (req, accessToken, refreshToken, params, profile, done) {
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

                    if (hasNestedValue(userInfo, provider.OAUTH_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher')
                    if (hasNestedValue(userInfo, provider.OAUTH_ROLE_STUDENT_VALUE)) received_user.roles.push('student')

                    const user_association = await authUserAssoc.find_user_association(self.auth_name, received_user.auth_id)

                    let user_account
                    if (user_association) {
                        user_account = await userModel.getById(user_association.user_id)
                    }
                    else {
                        let user_id = await userModel.getId(received_user.email)
                        if (user_id) {
                            user_account = await userModel.getById(user_id);
                        } else {
                            received_user.password = userModel.generatePassword()
                            user_account = await self.passportjs.register(received_user)
                        }
                        await authUserAssoc.link(self.auth_name, received_user.auth_id, user_account._id)
                    }

                    user_account.name = received_user.name
                    user_account.roles = received_user.roles
                    await userModel.editUser(user_account)

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
                scope: scope
            })(req, res, next);
        });

        app.get(`${endpoint}/${name}/callback`,
            (req, res, next) => {
                passport.authenticate(name, { failureRedirect: '/login' })(req, res, next);
            },
            (req, res) => {
                if (req.user) {
                    self.passportjs.authenticate(req.user, req, res)
                } else {
                    res.status(401).json({ error: "L'authentification a échoué" });
                }
            }
        );
        console.info(`Ajout de la connexion : ${name}(OAuth)`)
    }
}

module.exports = PassportOAuth;
