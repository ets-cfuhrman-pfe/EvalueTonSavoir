var OpenIDConnectStrategy = require('passport-openidconnect');
var authUserAssoc = require('../../../models/authUserAssociation');
var { hasNestedValue } = require('../../../utils');
const { MISSING_OIDC_PARAMETER } = require('../../../constants/errorCodes.js');
const AppError = require('../../../middleware/AppError.js');
const expressListEndpoints = require('express-list-endpoints');

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
            console.error(`Error: ${error} `);
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
                console.log(`oidc.js: register: issuer: ${JSON.stringify(issuer)}`);
                console.log(`oidc.js: register: profile: ${JSON.stringify(profile)}`);
                try {
                    const received_user = {
                        auth_id: profile.id,
                        email: profile.emails[0].value.toLowerCase(),
                        name: profile.displayName,
                        roles: []
                    };

                    if (hasNestedValue(profile, provider.OIDC_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher')
                    if (hasNestedValue(profile, provider.OIDC_ROLE_STUDENT_VALUE)) received_user.roles.push('student')

                    console.log(`oidc.js: register: received_user: ${JSON.stringify(received_user)}`);
                    const user_association = await authUserAssoc.find_user_association(self.auth_name, received_user.auth_id);
                    console.log(`oidc.js: register: user_association: ${JSON.stringify(user_association)}`);

                    let user_account
                    if (user_association) {
                        console.log(`oidc.js: register: user_association: ${JSON.stringify(user_association)}`);
                        user_account = await userModel.getById(user_association.user_id)
                        console.log(`oidc.js: register: user_account: ${JSON.stringify(user_account)}`);
                    }
                    else {
                        console.log(`oidc.js: register: user_association: ${JSON.stringify(user_association)}`);
                        let user_id = await userModel.getId(received_user.email)
                        console.log(`oidc.js: register: user_id: ${JSON.stringify(user_id)}`);
                        if (user_id) {
                            user_account = await userModel.getById(user_id);
                            console.log(`oidc.js: register: user_account: ${JSON.stringify(user_account)}`);
                        } else {
                            received_user.password = userModel.generatePassword()
                            user_account = await self.passportjs.register(received_user)
                            console.log(`oidc.js: register: user_account: ${JSON.stringify(user_account)}`);
                        }
                        console.log(`oidc.js: register: authUserAssoc.ling.`);
                        await authUserAssoc.link(self.auth_name, received_user.auth_id, user_account._id)
                    }

                    user_account.name = received_user.name
                    user_account.roles = received_user.roles
                    console.log(`oidc.js: register: calling userModel.editUser: ${JSON.stringify(user_account)}`);
                    await userModel.editUser(user_account);

                    return done(null, user_account);
                } catch (error) {
                    console.error(`Error: ${error} `);
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
        console.info(`Ajout de la connexion : ${name}(OIDC)`);
        console.log(expressListEndpoints(app));
    }
}

module.exports = PassportOpenIDConnect;
