const AppError = require('../middleware/AppError');
const { UNAUTHORIZED_ACCESS_DENIED } = require('../constants/errorCodes');

module.exports = (req, res, next) => {
  try {
    if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
      throw new AppError(UNAUTHORIZED_ACCESS_DENIED);
    }
    next();
  } catch (err) {
    next(err);
  }
};
