var OpenIDConnectStrategy = require('passport-openidconnect')
var authUserAssoc = require('../../../models/authUserAssociation')
var users = require('../../../models/users')
var { hasNestedValue } = require('../../../utils')
var jwt = require('../../../middleware/jwtToken')

class PassportOpenIDConnect {
    constructor(passportjs,auth_name){
        this.passportjs = passportjs
        this.auth_name = auth_name
    }

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
        const self = this

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
                const received_user = {
                    auth_id: profile.id,
                    email: profile.emails[0].value,
                    name: profile.name.givenName,
                    roles: []
                };

                if(hasNestedValue(profile,provider.OIDC_ROLE_TEACHER_VALUE)) received_user.roles.push('teacher')
                if(hasNestedValue(profile,provider.OIDC_ROLE_STUDENT_VALUE)) received_user.roles.push('student')
    
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

                return done(null, user_account);
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
                    // res.json(req.user)

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

module.exports = PassportOpenIDConnect;
