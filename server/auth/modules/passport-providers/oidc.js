var OpenIDConnectStrategy = require('passport-openidconnect');
var authUserAssoc = require('../../../models/authUserAssociation');
var { hasNestedValue } = require('../../../utils');
const { MISSING_OIDC_PARAMETER } = require('../../../constants/errorCodes.js');
const AppError = require('../../../middleware/AppError.js');
const expressListEndpoints = require('express-list-endpoints');
const logger = require('../../../config/logger');

class PassportOpenIDConnect {
    constructor(passportjs, auth_name) {
        this.passportjs = passportjs
        this.auth_name = auth_name
    }

    async getConfigFromConfigURL(name, provider) {
        try {
            const config = await fetch(provider.OIDC_CONFIG_URL)
            return await config.json()
        } catch (error) {
            logger.error('Failed to fetch OIDC configuration', {
                providerName: name,
                configUrl: provider.OIDC_CONFIG_URL,
                error: error.message,
                stack: error.stack,
                module: 'passport-oidc'
            });
            throw new AppError(MISSING_OIDC_PARAMETER(name));
        }
    }

    async register(app, passport, endpoint, name, provider, userModel) {

        // console.log(`oidc.js: register: endpoint: ${endpoint}`);
        // console.log(`oidc.js: register: name: ${name}`);
        // console.log(`oidc.js: register: provider: ${JSON.stringify(provider)}`);
        // console.log(`oidc.js: register: userModel: ${JSON.stringify(userModel)}`);

        const config = await this.getConfigFromConfigURL(name, provider);
        const cb_url = `${process.env['OIDC_URL']}${endpoint}/${name}/callback`;
        const self = this;
        const scope = 'openid profile email ' + `${provider.OIDC_ADD_SCOPE}`;

        // console.log(`oidc.js: register: config: ${JSON.stringify(config)}`);
        // console.log(`oidc.js: register: cb_url: ${cb_url}`);
        // console.log(`oidc.js: register: scope: ${scope}`);

        passport.use(name, new OpenIDConnectStrategy({
            issuer: config.issuer,
            authorizationURL: config.authorization_endpoint,
            tokenURL: config.token_endpoint,
            userInfoURL: config.userinfo_endpoint,
            clientID: provider.OIDC_CLIENT_ID,
            clientSecret: provider.OIDC_CLIENT_SECRET,
            callbackURL: cb_url,
            passReqToCallback: true,
            scope: scope,
        },
            // patch pour la librairie permet d'obtenir les groupes, PR en cours mais "morte" : https://github.com/jaredhanson/passport-openidconnect/pull/101
            async function (req, issuer, profile, times, tok, done) {
                logger.debug('OIDC authentication callback received', {
                    issuer: JSON.stringify(issuer),
                    profile: JSON.stringify(profile),
                    module: 'passport-oidc',
                    providerName: name
                });
                try {
                    const received_user = {
                        auth_id: profile.id,
                        email: profile.emails[0].value.toLowerCase(),
                        name: profile.displayName,
                        roles: []
                    };

                    if (hasNestedValue(profile, provider.OIDC_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher')
                    if (hasNestedValue(profile, provider.OIDC_ROLE_STUDENT_VALUE)) received_user.roles.push('student')

                    logger.debug('OIDC user data processed', {
                        receivedUser: JSON.stringify(received_user),
                        module: 'passport-oidc',
                        providerName: name
                    });
                    const user_association = await authUserAssoc.find_user_association(self.auth_name, received_user.auth_id);
                    logger.debug('OIDC user association lookup result', {
                        userAssociation: JSON.stringify(user_association),
                        authName: self.auth_name,
                        authId: received_user.auth_id,
                        module: 'passport-oidc'
                    });

                    let user_account
                    if (user_association) {
                        logger.debug('OIDC existing user association found', {
                            userAssociation: JSON.stringify(user_association),
                            module: 'passport-oidc'
                        });
                        user_account = await userModel.getById(user_association.user_id)
                        logger.debug('OIDC user account retrieved from association', {
                            userAccount: JSON.stringify(user_account),
                            module: 'passport-oidc'
                        });
                    }
                    else {
                        logger.debug('OIDC no existing user association, creating new or linking', {
                            userAssociation: JSON.stringify(user_association),
                            module: 'passport-oidc'
                        });
                        let user_id = await userModel.getId(received_user.email)
                        logger.debug('OIDC user ID lookup by email', {
                            userId: JSON.stringify(user_id),
                            email: received_user.email,
                            module: 'passport-oidc'
                        });
                        if (user_id) {
                            user_account = await userModel.getById(user_id);
                            logger.debug('OIDC existing user account found by email', {
                                userAccount: JSON.stringify(user_account),
                                module: 'passport-oidc'
                            });
                        } else {
                            received_user.password = userModel.generatePassword()
                            user_account = await self.passportjs.register(received_user)
                            logger.debug('OIDC new user account created', {
                                userAccount: JSON.stringify(user_account),
                                module: 'passport-oidc'
                            });
                        }
                        logger.debug('OIDC linking user association', {
                            authName: self.auth_name,
                            authId: received_user.auth_id,
                            userId: user_account._id,
                            module: 'passport-oidc'
                        });
                        await authUserAssoc.link(self.auth_name, received_user.auth_id, user_account._id)
                    }

                    user_account.name = received_user.name
                    user_account.roles = received_user.roles
                    logger.debug('OIDC updating user account with new data', {
                        userAccount: JSON.stringify(user_account),
                        module: 'passport-oidc'
                    });
                    await userModel.editUser(user_account);

                    return done(null, user_account);
                } catch (error) {
                    logger.error('OIDC authentication callback error', {
                        error: error.message,
                        stack: error.stack,
                        module: 'passport-oidc',
                        providerName: name
                    });
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
                    res.status(401).json({ error: "Authentication failed" });
                }
            }
        );
        logger.info(`OIDC provider registered: ${name}`, {
            providerName: name,
            authType: 'OIDC',
            module: 'passport-oidc'
        });
        logger.debug('Express endpoints registered', {
            endpoints: expressListEndpoints(app),
            module: 'passport-oidc'
        });
    }
}

module.exports = PassportOpenIDConnect;
