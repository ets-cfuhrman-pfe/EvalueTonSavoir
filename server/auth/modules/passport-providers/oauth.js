const OAuth2Strategy = require('passport-oauth2')
const authUserAssoc = require('../../../models/authUserAssociation')
const { hasNestedValue } = require('../../../utils')
const logger = require('../../../config/logger')
const health = require('../../../config/health')

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
                    logger.error(`Erreur dans la strategie OAuth2 '${name}'`, {
                        providerName: name,
                        error: error.message,
                        stack: error.stack,
                        module: 'passport-oauth'
                    });
                    return done(error);
                }
            }));

        app.get(`${endpoint}/${name}`, (req, res, next) => {
            passport.authenticate(name, {
                scope: scope
            })(req, res, next);
        });

        app.get(`${endpoint}/${name}/callback`,
            // Forward failures as errors instead of auto-redirect
            (req, res, next) => passport.authenticate(name, { failWithError: true })(req, res, next),

            // Success handler: clear health flag and proceed
            (req, res) => {
                if (req.user) {
                    health.clearOAuthTokenFailure()
                    self.passportjs.authenticate(req.user, req, res)
                } else {
                    res.status(401).json({ error: "L'authentification a échoué" });
                }
            },

            // Error handler: mark health failure on token errors
            (err, req, res, _next) => {
                const isInternalError =
                    err?.name === 'InternalOAuthError' &&
                    /Failed to obtain access token/i.test(err.message);

                // Exclude client errors like expired code, reused code, invalid grant
                // only want to restart on server errors or network errors 
                const isClientSideError = err?.oauthError?.statusCode >= 400 && err?.oauthError?.statusCode < 500;
                
                if (isInternalError && !isClientSideError) {
                    health.markOAuthTokenFailure({
                        provider: name,
                        message: err.message,
                        statusCode: err.statusCode,
                        oauthErrorData: err?.oauthError?.data
                    })
                }

                logger.error(`Erreur OAuth2 dans le callback '${name}'`, {
                    providerName: name,
                    message: err.message,
                    stack: err.stack,
                    statusCode: err.statusCode,
                    oauthErrorData: err?.oauthError?.data,
                    module: 'passport-oauth'
                })
                return res.redirect('/login');
            }
        );
        logger.info(`Ajout de la connexion : ${name}(OAuth)`, {
            providerName: name,
            authType: 'OAuth',
            module: 'passport-oauth'
        })
    }
}

module.exports = PassportOAuth;
