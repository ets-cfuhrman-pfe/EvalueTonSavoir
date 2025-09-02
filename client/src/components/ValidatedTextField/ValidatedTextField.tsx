import React, { useState, useEffect, useCallback } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import ValidationService from '../../services/ValidationService';

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
 * A simplified TextField component that validates input using ValidationService directly
 * No custom hook needed - all validation logic is contained within the component
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

    // Direct validation function using ValidationService
    const validateValue = useCallback((val: any) => {
        const result = ValidationService.validateField(fieldPath, val, { required });
        
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
        const newValue = event.target.value;
        setValue(newValue);
        
        // Mark as touched on first change
        if (!isTouched) {
            setIsTouched(true);
        }
        
        // Notify parent immediately with current validity state
        if (onValueChange) {
            // For immediate feedback, do a quick validation
            const result = ValidationService.validateField(fieldPath, newValue, { required });
            onValueChange(newValue, result.isValid);
        }
    };

    const handleBlur = () => {
        setIsTouched(true);
        
        if (validateOnBlur) {
            validateValue(value);
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
        />
    );
};

export default ValidatedTextField;
