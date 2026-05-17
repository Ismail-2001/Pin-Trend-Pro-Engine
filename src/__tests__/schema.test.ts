import { validatePinKeywords } from '../schema';

describe('validatePinKeywords', () => {
  it('should validate a correct keyword object', () => {
    const validData = {
      keywords: [
        {
          keyword: 'talavera tile kitchen backsplash ideas',
          type: 'evergreen',
          trend_score: 8,
          pin_title_en: 'Talavera Tile Backsplash Ideas That Transform Any Kitchen',
          pin_title_es: 'Ideas de Azulejos Talavera para Cocinas',
          pin_description_en: 'Transform your kitchen with Talavera tiles. Explore beautiful hand-painted designs. #MexicanKitchen',
          pin_description_es: 'Transforma tu cocina con azulejos Talavera. Descubre diseños hermosos. #DecoracionMexicana',
          image_prompt: 'Room scene of kitchen with Talavera tiles, warm lighting, Mexican elements',
          suggested_blog_index: 0
        }
      ]
    };

    const result = validatePinKeywords(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject an object without keywords array', () => {
    const invalidData = { notKeywords: [] };
    const result = validatePinKeywords(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject a keyword with invalid type', () => {
    const invalidData = {
      keywords: [
        {
          keyword: 'test',
          type: 'invalid_type',
          trend_score: 5,
          pin_title_en: 'Test',
          pin_title_es: 'Prueba',
          pin_description_en: 'Test description',
          pin_description_es: 'Descripción de prueba',
          image_prompt: 'Test prompt',
          suggested_blog_index: 0
        }
      ]
    };

    const result = validatePinKeywords(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject a keyword with trend_score out of range', () => {
    const invalidData = {
      keywords: [
        {
          keyword: 'test',
          type: 'evergreen',
          trend_score: 15,
          pin_title_en: 'Test',
          pin_title_es: 'Prueba',
          pin_description_en: 'Test description',
          pin_description_es: 'Descripción de prueba',
          image_prompt: 'Test prompt',
          suggested_blog_index: 0
        }
      ]
    };

    const result = validatePinKeywords(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject a keyword with missing required fields', () => {
    const invalidData = {
      keywords: [
        {
          keyword: 'test',
          type: 'evergreen'
        }
      ]
    };

    const result = validatePinKeywords(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should validate multiple keywords in array', () => {
    const validData = {
      keywords: [
        {
          keyword: 'keyword 1',
          type: 'evergreen',
          trend_score: 8,
          pin_title_en: 'Title 1',
          pin_title_es: 'Título 1',
          pin_description_en: 'Description 1',
          pin_description_es: 'Descripción 1',
          image_prompt: 'Prompt 1',
          suggested_blog_index: 0
        },
        {
          keyword: 'keyword 2',
          type: 'seasonal',
          trend_score: 9,
          pin_title_en: 'Title 2',
          pin_title_es: 'Título 2',
          pin_description_en: 'Description 2',
          pin_description_es: 'Descripción 2',
          image_prompt: 'Prompt 2',
          suggested_blog_index: 1
        }
      ]
    };

    const result = validatePinKeywords(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});
