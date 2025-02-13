exports.UNAUTHORIZED_NO_TOKEN_GIVEN = {
    message: 'Accès refusé. Aucun jeton fourni.',
    code: 401
}
exports.UNAUTHORIZED_INVALID_TOKEN = {
    message: 'Accès refusé. Jeton invalide.',
    code: 401
}

exports.MISSING_REQUIRED_PARAMETER = {
    message: 'Paramètre requis manquant.',
    code: 400
}

exports.USER_ALREADY_EXISTS = {
    message: 'L\'utilisateur existe déjà.',
    code: 400
}
exports.LOGIN_CREDENTIALS_ERROR = {
    message: 'L\'email et le mot de passe ne correspondent pas.',
    code: 401
}
exports.GENERATE_PASSWORD_ERROR = {
    message: 'Une erreur s\'est produite lors de la création d\'un nouveau mot de passe.',
    code: 400
}
exports.UPDATE_PASSWORD_ERROR = {
    message: 'Une erreur s\'est produite lors de la mise à jours du mot de passe.',
    code: 400
}
exports.DELETE_USER_ERROR = {
    message: 'Une erreur s\'est produite lors de suppression de l\'utilisateur.',
    code: 400
}

exports.IMAGE_NOT_FOUND = {
    message: 'Nous n\'avons pas trouvé l\'image.',
    code: 404
}

exports.QUESTIONNAIRE_NOT_FOUND = {
    message: 'Aucun questionnaire portant cet identifiant n\'a été trouvé.',
    code: 404
}
exports.QUESTIONNAIRE_ALREADY_EXISTS = {
    message: 'Le questionnaire existe déjà.',
    code: 400
}
exports.UPDATE_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors de la mise à jour du questionnaire.',
    code: 400
}
exports.DELETE_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors de la suppression du questionnaire.',
    code: 400
}
exports.GETTING_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors de la récupération du questionnaire.',
    code: 400
}
exports.MOVING_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors du déplacement du questionnaire.',
    code: 400
}
exports.DUPLICATE_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors de la duplication du questionnaire.',
    code: 400
}
exports.COPY_QUESTIONNAIRE_ERROR = {
    message: 'Une erreur s\'est produite lors de la copie du questionnaire.',
    code: 400
}

exports.FOLDER_NOT_FOUND = {
    message: 'Aucun dossier portant cet identifiant n\'a été trouvé.',
    code: 404
}
exports.FOLDER_ALREADY_EXISTS = {
    message: 'Le dossier existe déjà.',
    code: 409
}
exports.UPDATE_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors de la mise à jour du dossier.',
    code: 400
}
exports.DELETE_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors de la suppression du dossier.',
    code: 400
}
exports.GETTING_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors de la récupération du dossier.',
    code: 400
}
exports.MOVING_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors du déplacement du dossier.',
    code: 400
}
exports.DUPLICATE_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors de la duplication du dossier.',
    code: 400
}
exports.COPY_FOLDER_ERROR = {
    message: 'Une erreur s\'est produite lors de la copie du dossier.',
    code: 400
}

















exports.NOT_IMPLEMENTED = {
    message: 'Route not implemented yet!',
    code: 400
}


// static ok(res, results) {200
// static badRequest(res, message) {400
// static unauthorized(res, message) {401
// static notFound(res, message) {404
// static serverError(res, message) {505
