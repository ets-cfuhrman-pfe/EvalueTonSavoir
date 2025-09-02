import validationService from '../../services/ValidationService';

describe('Room Input Length Validation (Frontend)', () => {

  describe('Room Name Length Validation (minLength: 1, maxLength: 50)', () => {
    it('should accept room names with valid lengths', () => {
      const validNames = [
        'A',                          // minimum length (1 character)
        'Valid Room Name',            // normal length
        'A'.repeat(25),              // mid-range length
        'A'.repeat(50)               // maximum length (50 characters)
      ];

      validNames.forEach(name => {
        const result = validationService.validateField('room.name', name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject room names that are too short (empty)', () => {
      const emptyName = '';
      
      const result = validationService.validateField('room.name', emptyName, { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ce champ est requis');
    });

    it('should reject room names that are too long', () => {
      const longName = 'A'.repeat(51); // 51 characters (exceeds maximum of 50)
      
      const result = validationService.validateField('room.name', longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces'
      );
    });

    it('should handle boundary values correctly', () => {
      const testCases = [
        { value: 'A', shouldPass: true },
        { value: 'A'.repeat(50), shouldPass: true },
        { value: 'A'.repeat(51), shouldPass: false }
      ];

      testCases.forEach(({ value, shouldPass }) => {
        const result = validationService.validateField('room.name', value);
        expect(result.isValid).toBe(shouldPass);
        
        if (!shouldPass) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Room Description Length Validation (maxLength: 500)', () => {
    it('should accept descriptions with valid lengths', () => {
      const validDescriptions = [
        '',                          // empty description (no minimum required)
        'Short description',         // normal length
        'A'.repeat(250),            // mid-range length
        'A'.repeat(500)             // maximum length (500 characters)
      ];

      validDescriptions.forEach(description => {
        const result = validationService.validateField('room.description', description);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject descriptions that are too long', () => {
      const longDescription = 'A'.repeat(501); // 501 characters (exceeds maximum of 500)
      
      const result = validationService.validateField('room.description', longDescription);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'La description ne peut pas dépasser 500 caractères'
      );
    });

    it('should handle boundary values correctly', () => {
      const testCases = [
        { value: '', shouldPass: true },
        { value: 'A'.repeat(500), shouldPass: true },
        { value: 'A'.repeat(501), shouldPass: false }
      ];

      testCases.forEach(({ value, shouldPass }) => {
        const result = validationService.validateField('room.description', value);
        expect(result.isValid).toBe(shouldPass);
        
        if (!shouldPass) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Room Password Length Validation (minLength: 4, maxLength: 50)', () => {
    it('should accept passwords with valid lengths', () => {
      const validPasswords = [
        '1234',                      // minimum length (4 characters)
        'password123',               // normal length
        'A'.repeat(25),             // mid-range length
        'A'.repeat(50)              // maximum length (50 characters)
      ];

      validPasswords.forEach(password => {
        const result = validationService.validateField('room.password', password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = [
        '1',      // 1 character
        '12',     // 2 characters
        '123'     // 3 characters (all below minimum of 4)
      ];

      shortPasswords.forEach(password => {
        const result = validationService.validateField('room.password', password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Le mot de passe doit contenir entre 4 et 50 caractères'
        );
      });
    });

    it('should treat empty password as valid when not required', () => {
      const result = validationService.validateField('room.password', '');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty password when explicitly required', () => {
      const result = validationService.validateField('room.password', '', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ce champ est requis');
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'A'.repeat(51); // 51 characters (exceeds maximum of 50)
      
      const result = validationService.validateField('room.password', longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Le mot de passe doit contenir entre 4 et 50 caractères'
      );
    });

    it('should handle boundary values correctly', () => {
      const testCases = [
        { value: '1234', shouldPass: true },
        { value: 'A'.repeat(50), shouldPass: true },
        { value: '123', shouldPass: false },
        { value: 'A'.repeat(51), shouldPass: false }
      ];

      testCases.forEach(({ value, shouldPass }) => {
        const result = validationService.validateField('room.password', value);
        expect(result.isValid).toBe(shouldPass);
        
        if (!shouldPass) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });

    it('should allow empty password when not required', () => {
      const result = validationService.validateField('room.password', '', { required: false });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty password when required', () => {
      const result = validationService.validateField('room.password', '', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ce champ est requis');
    });
  });

  describe('Room Max Participants Validation (min: 1, max: 100)', () => {
    it('should accept valid participant counts', () => {
      const validCounts = [1, 10, 50, 100]; // Within range 1-100

      validCounts.forEach(count => {
        const result = validationService.validateField('room.maxParticipants', count);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject participant counts that are too low', () => {
      const invalidCounts = [0, -1, -10];

      invalidCounts.forEach(count => {
        const result = validationService.validateField('room.maxParticipants', count);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Le nombre maximum de participants doit être entre 1 et 100'
        );
      });
    });

    it('should reject participant counts that are too high', () => {
      const invalidCounts = [101, 200, 1000];

      invalidCounts.forEach(count => {
        const result = validationService.validateField('room.maxParticipants', count);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Le nombre maximum de participants doit être entre 1 et 100'
        );
      });
    });

    it('should handle boundary values correctly', () => {
      const testCases = [
        { value: 1, shouldPass: true },
        { value: 100, shouldPass: true },
        { value: 0, shouldPass: false },
        { value: 101, shouldPass: false }
      ];

      testCases.forEach(({ value, shouldPass }) => {
        const result = validationService.validateField('room.maxParticipants', value);
        expect(result.isValid).toBe(shouldPass);
        
        if (!shouldPass) {
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });

    it('should reject non-numeric values', () => {
      const nonNumericValues = [
        'abc',     // clearly non-numeric
        'ten',     // text number
        '5.5',     // decimal string (if only integers allowed)
        'null',    // string 'null'
        'NaN'      // string 'NaN'
      ];

      nonNumericValues.forEach(value => {
        const result = validationService.validateField('room.maxParticipants', value);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle undefined and null values', () => {
      // Undefined should be treated as empty and potentially valid if not required
      const undefinedResult = validationService.validateField('room.maxParticipants', undefined);
      expect(undefinedResult.isValid).toBe(true); // Empty value, not required
      
      // Null should be treated similarly
      const nullResult = validationService.validateField('room.maxParticipants', null);
      expect(nullResult.isValid).toBe(true); // Empty value, not required
      
      // Empty string should also be treated as empty
      const emptyResult = validationService.validateField('room.maxParticipants', '');
      expect(emptyResult.isValid).toBe(true); // Empty value, not required
    });
  });

  describe('Integration Tests - Complete Room Validation', () => {
    it('should validate a complete valid room object', () => {
      const validRoomData = {
        name: 'Valid Room Name',
        description: 'This is a valid room description',
        password: 'validpass123',
        maxParticipants: 25
      };

      const nameResult = validationService.validateField('room.name', validRoomData.name);
      const descResult = validationService.validateField('room.description', validRoomData.description);
      const passResult = validationService.validateField('room.password', validRoomData.password);
      const maxResult = validationService.validateField('room.maxParticipants', validRoomData.maxParticipants);

      expect(nameResult.isValid).toBe(true);
      expect(descResult.isValid).toBe(true);
      expect(passResult.isValid).toBe(true);
      expect(maxResult.isValid).toBe(true);
    });

    it('should collect multiple validation errors for invalid room data', () => {
      const invalidRoomData = {
        name: 'A'.repeat(51),        // Too long
        description: 'A'.repeat(501), // Too long
        password: '123',             // Too short
        maxParticipants: 0           // Too low
      };

      const nameResult = validationService.validateField('room.name', invalidRoomData.name);
      const descResult = validationService.validateField('room.description', invalidRoomData.description);
      const passResult = validationService.validateField('room.password', invalidRoomData.password);
      const maxResult = validationService.validateField('room.maxParticipants', invalidRoomData.maxParticipants);

      expect(nameResult.isValid).toBe(false);
      expect(descResult.isValid).toBe(false);
      expect(passResult.isValid).toBe(false);
      expect(maxResult.isValid).toBe(false);

      expect(nameResult.errors).toContain(
        'Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces'
      );
      expect(descResult.errors).toContain(
        'La description ne peut pas dépasser 500 caractères'
      );
      expect(passResult.errors).toContain(
        'Le mot de passe doit contenir entre 4 et 50 caractères'
      );
      expect(maxResult.errors).toContain(
        'Le nombre maximum de participants doit être entre 1 et 100'
      );
    });

    it('should handle edge cases with special characters and unicode', () => {
      const testCases = [
        { field: 'room.name', value: 'Salle Étudiants', shouldPass: false }, // Accented chars not allowed
        { field: 'room.name', value: 'Room-123_Test', shouldPass: true },    // Valid special chars
        { field: 'room.description', value: '🎓 Learning room with émojis', shouldPass: true }, // Unicode in description
        { field: 'room.password', value: 'pàss123', shouldPass: true }       // Any chars allowed in password
      ];

      testCases.forEach(({ field, value, shouldPass }) => {
        const result = validationService.validateField(field, value);
        expect(result.isValid).toBe(shouldPass);
      });
    });
  });
});
