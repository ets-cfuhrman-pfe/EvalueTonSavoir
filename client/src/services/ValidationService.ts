import VALIDATION_CONSTANTS from '@shared/validationConstants.json';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Form data interfaces
export interface RoomFormData {
    name: string;
    description?: string;
    isPrivate: boolean;
    maxParticipants: number;
    password?: string;
}

export interface JoinRoomFormData {
    roomId: string;
    password?: string;
}

class ValidationService {
    private static instance: ValidationService;

    private constructor() {}

    public static getInstance(): ValidationService {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }

    /**
     * Generic field validation using dot notation (e.g., 'room.name', 'user.email')
     */
    validateField(fieldPath: string, value: any, options: { required?: boolean } = {}): ValidationResult {
        const errors: string[] = [];
        
        // Navigate to the validation rule using dot notation
        const rule = this.getValidationRule(fieldPath);
        if (!rule) {
            return { isValid: true, errors: [] }; // No rule found, consider valid
        }

        // Check if field is required
        const isRequired = options.required ?? rule.required;
        
        // Handle empty values
        if (value === null || value === undefined || value === '') {
            if (isRequired) {
                errors.push('Ce champ est requis');
            }
            return { isValid: errors.length === 0, errors };
        }

        const stringValue = String(value);

        // Validate constraints
        if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
            errors.push(rule.errorMessage);
        }

        if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
            errors.push(rule.errorMessage);
        }

        if (rule.pattern && !new RegExp(rule.pattern).test(stringValue)) {
            errors.push(rule.errorMessage);
        }

        // Check numeric constraints
        if (rule.min !== undefined || rule.max !== undefined) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
                errors.push('La valeur doit être un nombre');
            } else {
                // Check if integer is required
                if (rule.integer && !Number.isInteger(numValue)) {
                    errors.push('La valeur doit être un nombre entier');
                }
                
                if (rule.min !== undefined && numValue < rule.min) {
                    errors.push(rule.errorMessage);
                }
                if (rule.max !== undefined && numValue > rule.max) {
                    errors.push(rule.errorMessage);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get validation rule by path (e.g., 'room.name' -> VALIDATION_CONSTANTS.room.name)
     */
    private getValidationRule(fieldPath: string): any {
        const parts = fieldPath.split('.');
        let current: any = VALIDATION_CONSTANTS;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current && typeof current === 'object' && 'errorMessage' in current ? current : null;
    }

    // ===== CONVENIENCE METHODS =====

    // Room validation methods
    validateRoomName(name: string): ValidationResult {
        return this.validateField('room.name', name);
    }

    validateRoomDescription(description: string): ValidationResult {
        return this.validateField('room.description', description);
    }

    validateRoomPassword(password: string, isRequired: boolean = false): ValidationResult {
        return this.validateField('room.password', password, { required: isRequired });
    }

    validateRoomMaxParticipants(maxParticipants: number): ValidationResult {
        return this.validateField('room.maxParticipants', maxParticipants);
    }

    validateRoomCreation(data: RoomFormData): ValidationResult {
        const errors: string[] = [];

        // Validate name
        const nameResult = this.validateRoomName(data.name);
        if (!nameResult.isValid) errors.push(...nameResult.errors);

        // Validate description if provided
        if (data.description !== undefined && data.description !== '') {
            const descResult = this.validateRoomDescription(data.description);
            if (!descResult.isValid) errors.push(...descResult.errors);
        }

        // Validate max participants
        const maxParticipantsResult = this.validateRoomMaxParticipants(data.maxParticipants);
        if (!maxParticipantsResult.isValid) errors.push(...maxParticipantsResult.errors);

        // Validate password if private
        if (data.isPrivate) {
            const passwordResult = this.validateRoomPassword(data.password || '', true);
            if (!passwordResult.isValid) errors.push(...passwordResult.errors);
        }

        return { isValid: errors.length === 0, errors };
    }

    validateRoomJoin(data: JoinRoomFormData): ValidationResult {
        const errors: string[] = [];

        // Validate room ID (MongoDB ObjectId format)
        if (!data.roomId || !/^[0-9a-fA-F]{24}$/.test(data.roomId)) {
            errors.push('ID de salle invalide');
        }

        // Validate password if provided
        if (data.password) {
            const passwordResult = this.validateRoomPassword(data.password, false);
            if (!passwordResult.isValid) errors.push(...passwordResult.errors);
        }

        return { isValid: errors.length === 0, errors };
    }
}

// Export singleton instance
export default ValidationService.getInstance();
