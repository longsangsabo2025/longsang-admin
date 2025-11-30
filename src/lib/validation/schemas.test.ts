import { describe, it, expect } from 'vitest';
import {
  AgentInputSchema,
  EmailSchema,
  FileUploadSchema,
  validate,
  validateOrThrow,
  formatValidationErrors,
} from '../schemas';

describe('Validation schemas', () => {
  describe('AgentInputSchema', () => {
    it('should validate correct agent input', () => {
      const validInput = {
        agentId: '123e4567-e89b-12d3-a456-426614174000',
        task: 'Test task',
      };

      const result = validate(AgentInputSchema, validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidInput = {
        agentId: 'not-a-uuid',
        task: 'Test task',
      };

      const result = validate(AgentInputSchema, invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty task', () => {
      const invalidInput = {
        agentId: '123e4567-e89b-12d3-a456-426614174000',
        task: '',
      };

      const result = validate(AgentInputSchema, invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('EmailSchema', () => {
    it('should validate correct email', () => {
      const result = validate(EmailSchema, 'test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validate(EmailSchema, 'notanemail');
      expect(result.success).toBe(false);
    });
  });

  describe('FileUploadSchema', () => {
    it('should validate correct file', () => {
      const validFile = {
        name: 'test.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
      };

      const result = validate(FileUploadSchema, validFile);
      expect(result.success).toBe(true);
    });

    it('should reject file too large', () => {
      const largeFile = {
        name: 'large.pdf',
        size: 20 * 1024 * 1024, // 20MB
        type: 'application/pdf',
      };

      const result = validate(FileUploadSchema, largeFile);
      expect(result.success).toBe(false);
    });
  });

  describe('validateOrThrow', () => {
    it('should return valid data', () => {
      const validEmail = 'test@example.com';
      const result = validateOrThrow(EmailSchema, validEmail);
      expect(result).toBe(validEmail);
    });

    it('should throw on invalid data', () => {
      expect(() => {
        validateOrThrow(EmailSchema, 'notanemail');
      }).toThrow();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors nicely', () => {
      const result = validate(AgentInputSchema, {
        agentId: 'invalid',
        task: '',
      });

      if (!result.success) {
        const formatted = formatValidationErrors(result.errors);
        expect(formatted.length).toBeGreaterThan(0);
        expect(formatted[0]).toContain(':');
      }
    });
  });
});
