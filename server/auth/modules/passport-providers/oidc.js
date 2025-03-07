var OpenIDConnectStrategy = require('passport-openidconnect');
var authUserAssoc = require('../../../models/authUserAssociation');
var { hasNestedValue } = require('../../../utils');
const { MISSING_OIDC_PARAMETER } = require('../../../constants/errorCodes.js');
const AppError = require('../../../middleware/AppError.js');

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

    async processOIDC(req, issuer, profile, times, tok, done, provider, userModel, self) {
        try {
            const received_user = {
                auth_id: profile.id,
                email: profile.emails[0].value.toLowerCase(),
                name: profile.name.displayName,
                roles: []
            };

            if (hasNestedValue(profile, provider.OIDC_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher');
            if (hasNestedValue(profile, provider.OIDC_ROLE_STUDENT_VALUE)) received_user.roles.push('student');
    
            const user_association = await authUserAssoc.find_user_association(self.auth_name, received_user.auth_id);

            let user_account;
            let newUser = true;
    
            if (user_association) {
                newUser = false;
                user_account = await userModel.getById(user_association.user_id);
            } else {
                let user_id = await userModel.getId(received_user.email);
                if (user_id) {
                    user_account = await userModel.getById(user_id);
                } else {
                    received_user.password = userModel.generatePassword();
                    user_account = await self.passportjs.register(received_user);
                }
                await authUserAssoc.link(self.auth_name, received_user.auth_id, user_account._id);
            }
    
            user_account.name = received_user.name;
            user_account.roles = received_user.roles;
            await userModel.editUser(user_account);
            req.session.requiresConsent = newUser;

            return done(null, user_account);
        } catch (error) {
            console.error(`Error: ${error} `);
        }
    } 

    async register(app, passport, endpoint, name, provider, userModel) {

        const config = await this.getConfigFromConfigURL(name, provider);
        const cb_url = `${process.env['OIDC_URL']}${endpoint}/${name}/callback`;
        const self = this;
        const scope = 'openid profile email ' + `${provider.OIDC_ADD_SCOPE}`;

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
        (req, issuer, profile, times, tok, done) => this.processOIDC(req, issuer, profile, times, tok, done, provider, userModel, self)));

        app.get(`${endpoint}/${name}`, (req, res, next) => {
            let promptConsent = req.session.requiresConsent || true; // Default to false
            let authObj = {
                scope: scope,
                prompt: 'none'
            };

            if(promptConsent){
                authObj.prompt = 'consent';
            }
            
            passport.authenticate(name, authObj)(req, res, next);
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
    }
}

module.exports = PassportOpenIDConnect;
