import type { AppErrorInfos } from "../middleware/app-error";
import { HttpStatusCode } from "../utils/http-status-codes";

export const UNAUTHORIZED_NO_TOKEN_GIVEN:AppErrorInfos = {
    message: 'Accès refusé. Aucun jeton fourni.',
    statusCode: HttpStatusCode.UNAUTHORIZED
};

export const UNAUTHORIZED_INVALID_TOKEN:AppErrorInfos = {
    message: 'Accès refusé. Jeton invalide.',
    statusCode: HttpStatusCode.UNAUTHORIZED
}

export const MISSING_REQUIRED_PARAMETER:AppErrorInfos = {
    message: 'Paramètre requis manquant.',
    statusCode: HttpStatusCode.BAD_REQUEST
}

export const USER_ALREADY_EXISTS:AppErrorInfos = {
    message: 'L\'utilisateur existe déjà.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const USER_NOT_FOUND:AppErrorInfos = {
    message: 'L\'utilisateur n\'existe pas.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const USER_CONTROLLER_NOT_INITIALIZED:AppErrorInfos = {
    message: "Le controlleur d'utilisateur n'est pas initialisé",
    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
}
export const LOGIN_CREDENTIALS_ERROR:AppErrorInfos = {
    message: 'L\'email et le mot de passe ne correspondent pas.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const GENERATE_PASSWORD_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la création d\'un nouveau mot de passe.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const UPDATE_PASSWORD_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la mise à jours du mot de passe.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const DELETE_USER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de supression de l\'utilisateur.',
    statusCode: HttpStatusCode.BAD_REQUEST
}

export const IMAGE_NOT_FOUND:AppErrorInfos = {
    message: 'Nous n\'avons pas trouvé l\'image.',
    statusCode: HttpStatusCode.NOT_FOUND
}

export const QUIZ_NOT_FOUND:AppErrorInfos = {
    message: 'Aucun quiz portant cet identifiant n\'a été trouvé.',
    statusCode: HttpStatusCode.NOT_FOUND
}
export const QUIZ_ALREADY_EXISTS:AppErrorInfos = {
    message: 'Le quiz existe déja.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const UPDATE_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la mise à jours du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const DELETE_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la supression du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const GETTING_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la récupération du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const MOVING_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors du déplacement du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const DUPLICATE_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la duplication du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const COPY_QUIZ_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la copie du quiz.',
    statusCode: HttpStatusCode.BAD_REQUEST
}

export const FOLDER_NOT_FOUND:AppErrorInfos = {
    message: 'Aucun dossier portant cet identifiant n\'a été trouvé.',
    statusCode: HttpStatusCode.NOT_FOUND
}
export const FOLDER_ALREADY_EXISTS:AppErrorInfos = {
    message: 'Le dossier existe déja.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const UPDATE_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la mise à jours du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const DELETE_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la supression du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const GETTING_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la récupération du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const MOVING_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors du déplacement du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const DUPLICATE_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la duplication du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}
export const COPY_FOLDER_ERROR:AppErrorInfos = {
    message: 'Une erreur s\'est produite lors de la copie du dossier.',
    statusCode: HttpStatusCode.BAD_REQUEST
}

export const NOT_IMPLEMENTED:AppErrorInfos = {
    message: 'Route not implemented yet!',
    statusCode: HttpStatusCode.BAD_REQUEST
}


// static ok(res, results) {200
// static badRequest(res, message) {HttpStatusCode.BAD_REQUEST
// static unauthorized(res, message) {HttpStatusCode.UNAUTHORIZED
// static notFound(res, message) {HttpStatusCode.NOT_FOUND
// static serverError(res, message) {505