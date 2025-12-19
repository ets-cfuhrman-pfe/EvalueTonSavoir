const emailer = require('../config/email.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, NOT_IMPLEMENTED, QUIZ_NOT_FOUND, FOLDER_NOT_FOUND, QUIZ_ALREADY_EXISTS, GETTING_QUIZ_ERROR, DELETE_QUIZ_ERROR, UPDATE_QUIZ_ERROR, MOVING_QUIZ_ERROR } = require('../constants/errorCodes');

class QuizController {

    constructor(quizModel, foldersModel) {
        this.quizzes = quizModel;
        this.folders = foldersModel;
    }

    create = async (req, res, next) => {
        try {
            const { title, content, folderId } = req.body;
    
            if (!title || !content || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const ownerStartTime = Date.now();
            const owner = await this.folders.getOwner(folderId);
            
            if (owner != req.user.userId) {
                // Log unauthorized quiz creation attempt
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_quiz_creation_attempt', 'warn', {
                        folderId,
                        attemptedBy: req.user.userId,
                        folderOwner: owner,
                        quizTitle: title
                    });
                }
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const createStartTime = Date.now();
            const result = await this.quizzes.create(title, content, folderId, req.user.userId);
            const createTime = Date.now() - createStartTime;
            const totalTime = Date.now() - ownerStartTime;
    
            if (!result) {
                // Log quiz creation failure
                if (req.logAction) {
                    req.logAction('quiz_creation_failed', {
                        title,
                        folderId,
                        reason: 'quiz_already_exists',
                        totalTime: `${totalTime}ms`
                    });
                }
                throw new AppError(QUIZ_ALREADY_EXISTS);
            }
    
            // Log successful quiz creation with content backup
            if (req.logDbOperation) {
                const contentString = Array.isArray(content) ? content.join('\n\n') : content;
                req.logDbOperation('insert', 'quizzes', createTime, true, {
                    quizId: result,
                    title,
                    folderId,
                    contentLength: contentString.length,
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex')
                });
            }
            
            if (req.logAction) {
                const contentString = Array.isArray(content) ? content.join('\n\n') : content;
                req.logAction('quiz_created', {
                    quizId: result,
                    title,
                    folderId,
                    contentLength: contentString.length,
                    createTime: `${createTime}ms`,
                    totalTime: `${totalTime}ms`
                });
            }

            // Create backup of newly created quiz
            if (req.logger) {
                const contentString = Array.isArray(content) ? content.join('\n\n') : content;
                req.logger.info('Quiz created', {
                    quizId: result,
                    title,
                    folderId
                });
                req.logger.debug('Quiz created - content backup', {
                    quizId: result,
                    title,
                    folderId,
                    content: contentString, // Full GIFT text for recovery
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex'),
                    creationTimestamp: new Date().toISOString(),
                    operation: 'quiz_creation_backup'
                });
            }
    
            return res.status(200).json({
                message: 'Quiz créé avec succès.',
                quizId: result
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    get = async (req, res, next) => {
        try {
            const { quizId } = req.params;
    
            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const startTime = Date.now();
            const content = await this.quizzes.getContent(quizId);
            const retrievalTime = Date.now() - startTime;
    
            if (!content) {
                // Log quiz not found
                if (req.logDbOperation) {
                    req.logDbOperation('select', 'quizzes', retrievalTime, false, {
                        quizId,
                        reason: 'quiz_not_found'
                    });
                }
                throw new AppError(GETTING_QUIZ_ERROR);
            }
    
            // Is this quiz mine OR is the current user an admin?
            // Admin users should be able to view any quiz for auditing purposes.
            const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes('admin');

            if (content.userId != req.user.userId && !isAdmin) {
                // Log unauthorized quiz access attempt
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_quiz_access', 'warn', {
                        quizId,
                        attemptedBy: req.user.userId,
                        actualOwner: content.userId,
                        quizTitle: content.title
                    });
                }
                throw new AppError(QUIZ_NOT_FOUND);
            }
    
            // Log successful quiz retrieval
            if (req.logDbOperation) {
                req.logDbOperation('select', 'quizzes', retrievalTime, true, {
                    quizId,
                    quizTitle: content.title,
                    contentLength: content.content?.length || 0
                });
            }
            
            if (req.logAction) {
                req.logAction('quiz_accessed', {
                    quizId,
                    quizTitle: content.title,
                    contentLength: content.content?.length || 0,
                    retrievalTime: `${retrievalTime}ms`
                });
            }
    
            return res.status(200).json({
                data: content
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    delete = async (req, res, next) => {
        try {
            const { quizId } = req.params;
    
            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Get content before deletion for recovery backup
            const content = await this.quizzes.getContent(quizId);
    
            // Is this quiz mine
            const owner = await this.quizzes.getOwner(quizId);
    
            if (owner != req.user.userId) {
                // Log unauthorized deletion attempt
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_quiz_deletion_attempt', 'warn', {
                        quizId,
                        attemptedBy: req.user.userId,
                        actualOwner: owner,
                        quizTitle: content?.title || 'unknown'
                    });
                }
                throw new AppError(QUIZ_NOT_FOUND);
            }

            // Create pre-deletion backup with content for recovery
            if (req.logger && content) {
                const contentString = Array.isArray(content.content) ? content.content.join('\n\n') : String(content.content || '');
                req.logger.info('Quiz deletion backup - content preserved', {
                    quizId,
                    title: content.title,
                    content: contentString, // Full GIFT text preserved before deletion
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex'),
                    folderId: content.folderId,
                    deletionTimestamp: new Date().toISOString(),
                    operation: 'quiz_deletion_backup'
                });
            }
    
            const startTime = Date.now();
            const result = await this.quizzes.delete(quizId);
            const deleteTime = Date.now() - startTime;
    
            if (!result) {
                // Log deletion failure
                if (req.logAction) {
                    req.logAction('quiz_deletion_failed', {
                        quizId,
                        quizTitle: content?.title || 'unknown',
                        deleteTime: `${deleteTime}ms`
                    });
                }
                throw new AppError(DELETE_QUIZ_ERROR);
            }

            // Log successful deletion
            if (req.logDbOperation) {
                req.logDbOperation('delete', 'quizzes', deleteTime, true, {
                    quizId,
                    quizTitle: content?.title || 'unknown',
                    contentLength: content?.content?.length || 0
                });
            }
            
            if (req.logAction) {
                req.logAction('quiz_deleted', {
                    quizId,
                    quizTitle: content?.title || 'unknown',
                    contentLength: content?.content?.length || 0,
                    deleteTime: `${deleteTime}ms`
                });
            }
    
            return res.status(200).json({
                message: 'Quiz supprimé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    update = async (req, res, next) => {
        try {
            const { quizId, newTitle, newContent } = req.body;
    
            if (!newTitle || !newContent || !quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Get the original content for backup logging
            const originalContent = await this.quizzes.getContent(quizId);
            
            // Is this quiz mine
            const owner = await this.quizzes.getOwner(quizId);
    
            if (owner != req.user.userId) {
                // Log unauthorized quiz update attempt
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_quiz_update_attempt', 'warn', {
                        quizId,
                        attemptedBy: req.user.userId,
                        actualOwner: owner,
                        attemptedTitle: newTitle
                    });
                }
                throw new AppError(QUIZ_NOT_FOUND);
            }

            // Log quiz save attempt with  content for recovery
            if (req.logger) {
                // Handle both string and array formats for newContent
                const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                const originalContentString = Array.isArray(originalContent?.content) 
                    ? originalContent.content.join('\n\n') 
                    : (originalContent?.content || '');
                
                req.logger.info('Quiz save attempt initiated', {
                    quizId,
                    originalTitle: originalContent?.title || 'unknown',
                    newTitle,
                    originalContentLength: originalContentString.length,
                    newContentLength: contentString.length,
                    contentPreview: contentString.substring(0, 100) + (contentString.length > 100 ? '...' : ''),
                    operation: 'quiz_update_attempt'
                });
            }

            // Create backup log entry with  content
            if (req.logger) {
                // Handle both string and array formats for content
                const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                const originalContentString = Array.isArray(originalContent?.content) 
                    ? originalContent.content.join('\n\n') 
                    : (originalContent?.content || '');
                
                req.logger.info('Quiz content backup before update', {
                    quizId,
                    backupType: 'pre_update',
                    timestamp: new Date().toISOString(),
                    originalTitle: originalContent?.title || 'unknown',
                    originalContent: originalContentString,
                    newTitle,
                    newContent: contentString, // Full GIFT text for recovery
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex'),
                    operation: 'quiz_content_backup'
                });
            }
    
            const startTime = Date.now();
            const result = await this.quizzes.update(quizId, newTitle, newContent);
            const updateTime = Date.now() - startTime;
    
            if (!result) {
                // Log update failure with content for recovery
                if (req.logger) {
                    req.logger.error('Quiz update failed - content preserved for recovery', {
                        quizId,
                        newTitle,
                        newContent: newContent, // Full GIFT text preserved
                        updateTime: `${updateTime}ms`,
                        operation: 'quiz_update_failed'
                    });
                }
                
                if (req.logAction) {
                    const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                    req.logAction('quiz_update_failed', {
                        quizId,
                        newTitle,
                        contentLength: contentString.length,
                        updateTime: `${updateTime}ms`,
                        reason: 'database_operation_failed'
                    });
                }
                throw new AppError(UPDATE_QUIZ_ERROR);
            }

            // Log successful update with verification
            if (req.logDbOperation) {
                const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                const originalContentString = Array.isArray(originalContent?.content) 
                    ? originalContent.content.join('\n\n') 
                    : (originalContent?.content || '');
                
                req.logDbOperation('update', 'quizzes', updateTime, true, {
                    quizId,
                    titleChanged: originalContent?.title !== newTitle,
                    contentChanged: originalContentString !== contentString,
                    newTitle,
                    newContentLength: contentString.length,
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex')
                });
            }
            
            if (req.logAction) {
                const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                const originalContentString = Array.isArray(originalContent?.content) 
                    ? originalContent.content.join('\n\n') 
                    : (originalContent?.content || '');
                
                req.logAction('quiz_updated_successfully', {
                    quizId,
                    oldTitle: originalContent?.title || 'unknown',
                    newTitle,
                    oldContentLength: originalContentString.length,
                    newContentLength: contentString.length,
                    updateTime: `${updateTime}ms`
                });
            }

            // Create post-update verification log
            if (req.logger) {
                const contentString = Array.isArray(newContent) ? newContent.join('\n\n') : newContent;
                req.logger.info('Quiz update completed successfully', {
                    quizId,
                    newTitle,
                    newContent: contentString, // Full GIFT text saved
                    updateTime: `${updateTime}ms`,
                    contentHash: require('crypto').createHash('md5').update(contentString).digest('hex'),
                    operation: 'quiz_update_success',
                    verificationTimestamp: new Date().toISOString()
                });
            }
    
            return res.status(200).json({
                message: 'Quiz mis à jours avec succès.'
            });
    
        } catch (error) {
            // Log critical error with content preservation
            if (req.logger && req.body) {
                req.logger.error('Critical quiz update error - preserving content for recovery', {
                    quizId: req.body.quizId,
                    newTitle: req.body.newTitle,
                    newContent: req.body.newContent || '', // Preserve attempted content
                    error: error.message,
                    stack: error.stack,
                    operation: 'quiz_update_critical_error',
                    recoveryTimestamp: new Date().toISOString()
                });
            }
            return next(error);
        }
    };
    
    move = async (req, res, next) => {
        try {
            const { quizId, newFolderId } = req.body;
    
            if (!quizId || !newFolderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Get quiz details for logging
            const quizContent = await this.quizzes.getContent(quizId);
    
            // Is this quiz mine
            const quizOwner = await this.quizzes.getOwner(quizId);
    
            if (quizOwner != req.user.userId) {
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_quiz_move_attempt', 'warn', {
                        quizId,
                        newFolderId,
                        attemptedBy: req.user.userId,
                        actualOwner: quizOwner
                    });
                }
                throw new AppError(QUIZ_NOT_FOUND);
            }
    
            // Is this folder mine
            const folderOwner = await this.folders.getOwner(newFolderId);
    
            if (folderOwner != req.user.userId) {
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_folder_move_attempt', 'warn', {
                        quizId,
                        newFolderId,
                        attemptedBy: req.user.userId,
                        folderOwner
                    });
                }
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const startTime = Date.now();
            const result = await this.quizzes.move(quizId, newFolderId);
            const moveTime = Date.now() - startTime;
    
            if (!result) {
                if (req.logAction) {
                    req.logAction('quiz_move_failed', {
                        quizId,
                        quizTitle: quizContent?.title || 'unknown',
                        oldFolderId: quizContent?.folderId || 'unknown',
                        newFolderId,
                        moveTime: `${moveTime}ms`
                    });
                }
                throw new AppError(MOVING_QUIZ_ERROR);
            }

            // Log successful move
            if (req.logDbOperation) {
                req.logDbOperation('update', 'quizzes', moveTime, true, {
                    quizId,
                    operation: 'move_folder',
                    oldFolderId: quizContent?.folderId || 'unknown',
                    newFolderId
                });
            }
            
            if (req.logAction) {
                req.logAction('quiz_moved', {
                    quizId,
                    quizTitle: quizContent?.title || 'unknown',
                    oldFolderId: quizContent?.folderId || 'unknown',
                    newFolderId,
                    moveTime: `${moveTime}ms`
                });
            }
    
            return res.status(200).json({
                message: 'Quiz déplacé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    copy = async (req, _res, _next) => {
        const { quizId, newTitle, folderId } = req.body;
    
        if (!quizId || !newTitle || !folderId) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }
    
        throw new AppError(NOT_IMPLEMENTED);
        // const { quizId } = req.params;
        // const { newUserId } = req.body;
    
        // try {
        //     //Trouver le quiz a dupliquer 
        //     const conn = db.getConnection();
        //     const quiztoduplicate = await conn.collection('quiz').findOne({ _id: ObjectId.createFromHexString(quizId) });
        //     if (!quiztoduplicate) {
        //         throw new Error("Quiz non trouvé");
        //     }
        //     console.log(quiztoduplicate);
        //     //Suppression du id du quiz pour ne pas le répliquer 
        //     delete quiztoduplicate._id;
        //     //Ajout du duplicata
        //     await conn.collection('quiz').insertOne({ ...quiztoduplicate, userId: ObjectId.createFromHexString(newUserId) });
        //     res.json(Response.ok("Dossier dupliqué avec succès pour un autre utilisateur"));
    
        // } catch (error) {
        //     if (error.message.startsWith("Quiz non trouvé")) {
        //         return res.status(404).json(Response.badRequest(error.message));
        //     }
        //     res.status(500).json(Response.serverError(error.message));
        // }
    };
    
    deleteQuizzesByFolderId = async (req, res, next) => {
        try {
            const { folderId } = req.body;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Call the method from the Quiz model to delete quizzes by folder ID
            await this.quizzes.deleteQuizzesByFolderId(folderId);
    
            return res.status(200).json({
                message: 'Quizzes deleted successfully.'
            });
        } catch (error) {
            return next(error);
        }
    };
    
    duplicate = async (req, res, next) => {
        try {
            const { quizId } = req.body;
    
            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const newQuizId = await this.quizzes.duplicate(quizId, req.user.userId);
            res.status(200).json({ success: true, newQuizId });
        } catch (error) {
            return next(error);
        }
    };    quizExists = async (title, userId) => {
        try {
            const existingFile = await this.quizzes.quizExists(title, userId);
            return existingFile !== null;
        } catch (_error) {
            throw new AppError(GETTING_QUIZ_ERROR);
        }
    };
    
    share = async (req, res, next) => {
        try {
            const { quizId, email } = req.body;
    
            if (!quizId || !email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const link = `${process.env.FRONTEND_URL}/teacher/Share/${quizId}`;
    
            emailer.quizShare(email, link);
    
            return res.status(200).json({
                message: 'Quiz  partagé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    getShare = async (req, res, next) => {
        try {
            const { quizId } = req.params;
    
            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const content = await this.quizzes.getContent(quizId);
    
            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }
    
            return res.status(200).json({
                data: content.title
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    receiveShare = async (req, res, next) => {
        try {
            const { quizId, folderId } = req.body;
    
            if (!quizId || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const folderOwner = await this.folders.getOwner(folderId);
            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const content = await this.quizzes.getContent(quizId);
            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }
    
            const result = await this.quizzes.create(content.title, content.content, folderId, req.user.userId);
            if (!result) {
                throw new AppError(QUIZ_ALREADY_EXISTS);
            }
    
            return res.status(200).json({
                message: 'Quiz partagé reçu.'
            });
        } catch (error) {
            return next(error);
        }
    };

    // Auto-save method to be implemented
    // autoSave = async (req, res, next) => {
    //     try {
    //         const { quizId, title, content, isDraft = true } = req.body;

    //         if (!quizId || !title || !content) {
    //             throw new AppError(MISSING_REQUIRED_PARAMETER);
    //         }

    //         // Verify ownership
    //         const owner = await this.quizzes.getOwner(quizId);
    //         if (owner != req.user.userId) {
    //             if (req.logSecurity) {
    //                 req.logSecurity('unauthorized_quiz_autosave_attempt', 'warn', {
    //                     quizId,
    //                     attemptedBy: req.user.userId,
    //                     actualOwner: owner
    //                 });
    //             }
    //             throw new AppError(QUIZ_NOT_FOUND);
    //         }

    //         // Create comprehensive auto-save log with full content
    //         if (req.logger) {
    //             req.logger.info('Quiz auto-save checkpoint', {
    //                 quizId,
    //                 title,
    //                 content: content, // Full GIFT text for recovery
    //                 contentLength: content.length,
    //                 contentHash: require('crypto').createHash('md5').update(content).digest('hex'),
    //                 isDraft,
    //                 autoSaveTimestamp: new Date().toISOString(),
    //                 sessionId: req.sessionID || 'unknown',
    //                 operation: 'quiz_autosave',
    //                 // Additional recovery metadata
    //                 userAgent: req.get('User-Agent'),
    //                 clientIP: req.ip
    //             });
    //         }

    //         // Log user action for analytics
    //         if (req.logAction) {
    //             req.logAction('quiz_autosaved', {
    //                 quizId,
    //                 title,
    //                 contentLength: content.length,
    //                 isDraft,
    //                 sessionId: req.sessionID || 'unknown'
    //             });
    //         }

    //         // If this is not just a draft, update the actual quiz
    //         if (!isDraft) {
    //             const startTime = Date.now();
    //             const result = await this.quizzes.update(quizId, title, content);
    //             const updateTime = Date.now() - startTime;

    //             if (!result) {
    //                 // Log auto-save failure with content preservation
    //                 if (req.logger) {
    //                     req.logger.error('Auto-save failed - content preserved for recovery', {
    //                         quizId,
    //                         title,
    //                         content: content, // Full GIFT text preserved
    //                         contentHash: require('crypto').createHash('md5').update(content).digest('hex'),
    //                         updateTime: `${updateTime}ms`,
    //                         operation: 'quiz_autosave_failed',
    //                         failureTimestamp: new Date().toISOString()
    //                     });
    //                 }
    //                 throw new AppError(UPDATE_QUIZ_ERROR);
    //             }

    //             // Log successful auto-save
    //             if (req.logger) {
    //                 req.logger.info('Quiz auto-save completed successfully', {
    //                     quizId,
    //                     title,
    //                     content: content, // Full GIFT text saved
    //                     contentHash: require('crypto').createHash('md5').update(content).digest('hex'),
    //                     updateTime: `${updateTime}ms`,
    //                     operation: 'quiz_autosave_success',
    //                     completionTimestamp: new Date().toISOString()
    //                 });
    //             }
    //         }

    //         return res.status(200).json({
    //             message: isDraft ? 'Brouillon sauvegardé.' : 'Quiz sauvegardé automatiquement.',
    //             timestamp: new Date().toISOString(),
    //             contentHash: require('crypto').createHash('md5').update(content).digest('hex')
    //         });

    //     } catch (error) {
    //         // Critical error logging with content preservation
    //         if (req.logger && req.body) {
    //             req.logger.error('Critical auto-save error - preserving content for recovery', {
    //                 quizId: req.body.quizId,
    //                 title: req.body.title,
    //                 content: req.body.content || '', // Preserve attempted content
    //                 error: error.message,
    //                 stack: error.stack,
    //                 operation: 'quiz_autosave_critical_error',
    //                 errorTimestamp: new Date().toISOString()
    //             });
    //         }
    //         return next(error);
    //     }
    // };    

}

module.exports = QuizController;
