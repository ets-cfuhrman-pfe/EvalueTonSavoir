import React, { useState, useEffect, useCallback } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import ValidationService from '../../services/ValidationService';
import VALIDATION_CONSTANTS from '@shared/validationConstants.json';

interface ValidatedTextFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'error'> {
    fieldPath: string; // e.g., 'room.name', 'user.email', 'quiz.title'
    initialValue?: any;
    onValueChange?: (value: any, isValid: boolean) => void;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
    required?: boolean;
}

/**
 * A simplified TextField component that validates input using ValidationService 
 */
const ValidatedTextField: React.FC<ValidatedTextFieldProps> = ({
    fieldPath,
    initialValue = '',
    onValueChange,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    required,
    helperText,
    ...textFieldProps
}) => {
    // Simple state management - no hook needed
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isTouched, setIsTouched] = useState(false);

    // Get maxLength from validation constants
    const getMaxLength = useCallback((): number | undefined => {
        const parts = fieldPath.split('.');
        let current: any = VALIDATION_CONSTANTS;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current && typeof current === 'object' && 'maxLength' in current ? current.maxLength : undefined;
    }, [fieldPath]);

    const maxLength = getMaxLength();

    // Get pattern from validation constants for real-time input blocking
    const getPattern = useCallback((): string | undefined => {
        const parts = fieldPath.split('.');
        let current: any = VALIDATION_CONSTANTS;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current && typeof current === 'object' && 'pattern' in current ? current.pattern : undefined;
    }, [fieldPath]);

    const pattern = getPattern();

    // Direct validation function with specific error messages
    const validateValue = useCallback((val: any) => {
        const errors: string[] = [];
        
        // Get validation rule
        const parts = fieldPath.split('.');
        let rule: any = VALIDATION_CONSTANTS;
        for (const part of parts) {
            if (rule && typeof rule === 'object' && part in rule) {
                rule = rule[part];
            } else {
                rule = null;
                break;
            }
        }

        if (!rule || typeof rule !== 'object' || !('errorMessage' in rule)) {
            // No rule found, use ValidationService as fallback
            const result = ValidationService.validateField(fieldPath, val, { required });
            setIsValid(result.isValid);
            setError(result.isValid ? '' : result.errors[0] || '');
            return result;
        }

        // Check if field is required
        const isRequired = required ?? rule.required ?? (rule.minLength > 0);
        
        // Handle empty values
        if (val === null || val === undefined || val === '') {
            if (isRequired) {
                errors.push('Ce champ est requis');
            }
            const result = { isValid: errors.length === 0, errors };
            setIsValid(result.isValid);
            setError(result.isValid ? '' : result.errors[0] || '');
            return result;
        }

        const stringValue = String(val);

        // Validate constraints with specific error messages
        if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
            if (rule.minLength === 1) {
                errors.push('Ce champ est requis');
            } else {
                errors.push(`Ce champ doit contenir au moins ${rule.minLength} caractères`);
            }
        }

        if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
            const errorMessage = rule.maxLengthErrorMessage || `Ce champ ne peut pas dépasser ${rule.maxLength} caractères`;
            errors.push(errorMessage);
        }

        if (rule.pattern && !new RegExp(rule.pattern).test(stringValue)) {
            // Use the generic error message for pattern validation
            errors.push(rule.errorMessage);
        }

        // Check numeric constraints
        if (rule.min !== undefined || rule.max !== undefined) {
            const numValue = Number(val);
            if (isNaN(numValue)) {
                errors.push('La valeur doit être un nombre');
            } else {
                // Check if integer is required
                if (rule.integer && !Number.isInteger(numValue)) {
                    errors.push('La valeur doit être un nombre entier');
                }
                
                if (rule.min !== undefined && numValue < rule.min) {
                    errors.push(`La valeur doit être supérieure ou égale à ${rule.min}`);
                }
                if (rule.max !== undefined && numValue > rule.max) {
                    errors.push(`La valeur doit être inférieure ou égale à ${rule.max}`);
                }
            }
        }

        const result = { isValid: errors.length === 0, errors };
        setIsValid(result.isValid);
        setError(result.isValid ? '' : result.errors[0] || '');
        
        return result;
    }, [fieldPath, required]);

    // Debounced validation for onChange
    useEffect(() => {
        if (!validateOnChange || !isTouched) return;

        const timer = setTimeout(() => validateValue(value), debounceMs);
        return () => clearTimeout(timer);
    }, [value, validateOnChange, isTouched, debounceMs, validateValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = event.target.value;
        
        // Truncate input if it exceeds maxLength (for character length protection)
        if (maxLength && newValue.length > maxLength) {
            newValue = newValue.substring(0, maxLength);
        }
        
        // For numerical fields only, block obviously invalid patterns but allow partial valid inputs
        if (pattern && newValue !== '' && (fieldPath.includes('numerical') || pattern.includes('e') || pattern.includes('E'))) {
            // Special handling for scientific notation to prevent overly long exponents
            // Check if there's an 'e' or 'E' in the input
            const eIndex = newValue.toLowerCase().indexOf('e');
            if (eIndex !== -1) {
                // Extract the exponent part after 'e'
                const exponentPart = newValue.substring(eIndex + 1);
                
                // Remove optional sign from exponent
                const exponentDigits = exponentPart.replace(/^[+\-]/, '');
                
                // Block if exponent has more than 2 digits
                if (exponentDigits.length > 2) {
                    console.log(`Blocking input: ${newValue}, exponent digits: ${exponentDigits}, length: ${exponentDigits.length}`);
                    return;
                }
                
                // Also check if exponent contains non-digits (except at the start for +/-)
                const exponentWithoutSign = exponentPart.replace(/^[+\-]/, '');
                if (exponentWithoutSign && !/^\d*$/.test(exponentWithoutSign)) {
                    console.log(`Blocking non-digit exponent: ${newValue}`);
                    return;
                }
            }
            
            // Also apply a basic numerical pattern check with limited exponent
            const basicPattern = '^[+\\-]?\\d*\\.?\\d*([eE][+\\-]?\\d{0,2})?$';
            const basicRegex = new RegExp(basicPattern);
            
            if (!basicRegex.test(newValue)) {
                console.log(`Blocking basic pattern: ${newValue}`);
                return;
            }
        }
        
        setValue(newValue);
        
        // Mark as touched on first change
        if (!isTouched) {
            setIsTouched(true);
        }
        
        // Notify parent immediately with current validity state
        if (onValueChange) {
            // For immediate feedback, do a quick validation
            const result = validateValue(newValue);
            onValueChange(newValue, result.isValid);
        }
    };

    const handleBlur = () => {
        setIsTouched(true);
        
        if (validateOnBlur) {
            const result = validateValue(value);
            // Force update of validation state
            setIsValid(result.isValid);
            setError(result.isValid ? '' : result.errors[0] || '');
        }
    };

    return (
        <TextField
            {...textFieldProps}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            error={isTouched && !isValid}
            helperText={isTouched && error ? error : helperText}
            required={required}
            inputProps={{
                ...textFieldProps.inputProps,
                maxLength: maxLength,
                ...(required && { required: true })
            }}
        />
    );
};

export default ValidatedTextField;
