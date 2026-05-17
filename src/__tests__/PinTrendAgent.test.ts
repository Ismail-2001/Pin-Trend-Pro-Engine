import { PinTrendProAgent } from '../PinTrendAgent';

describe('PinTrendProAgent', () => {
  describe('parseJson', () => {
    it('should extract and parse valid JSON from response text', () => {
      const agent = new PinTrendProAgent('dummy-key', 'dummy-prompt');
      
      const responseText = `
        Here's your JSON:
        {
          "keywords": [
            {
              "keyword": "talavera tile kitchen backsplash ideas",
              "type": "evergreen",
              "trend_score": 8,
              "pin_title_en": "Talavera Tile Backsplash Ideas",
              "pin_title_es": "Ideas de Azulejos Talavera",
              "pin_description_en": "Transform your kitchen",
              "pin_description_es": "Transforma tu cocina",
              "image_prompt": "Kitchen with tiles",
              "suggested_blog_index": 0
            }
          ]
        }
      `;

      // Access the private method via casting
      const keywords = (agent as any).parseJson(responseText);
      expect(keywords).toHaveLength(1);
      expect(keywords[0].keyword).toBe('talavera tile kitchen backsplash ideas');
      expect(keywords[0].type).toBe('evergreen');
      expect(keywords[0].trend_score).toBe(8);
    });

    it('should throw error if no JSON object found', () => {
      const agent = new PinTrendProAgent('dummy-key', 'dummy-prompt');
      
      const responseText = 'No JSON here, just plain text.';
      
      expect(() => {
        (agent as any).parseJson(responseText);
      }).toThrow('Unable to locate JSON object');
    });

    it('should throw error if keywords array is missing', () => {
      const agent = new PinTrendProAgent('dummy-key', 'dummy-prompt');
      
      const responseText = '{"notKeywords": []}';
      
      expect(() => {
        (agent as any).parseJson(responseText);
      }).toThrow('Validation failed');
    });

    it('should handle JSON with extra whitespace and formatting', () => {
      const agent = new PinTrendProAgent('dummy-key', 'dummy-prompt');
      
      const responseText = `
        Some preamble text
        
        \`\`\`json
        {
          "keywords": [
            {
              "keyword": "mexican hacienda living room decor",
              "type": "trending",
              "trend_score": 9,
              "pin_title_en": "Hacienda Living Room Decor",
              "pin_title_es": "Decoración Sala Estilo Hacienda",
              "pin_description_en": "Stunning hacienda style",
              "pin_description_es": "Estilo hacienda impresionante",
              "image_prompt": "Hacienda room",
              "suggested_blog_index": 2
            }
          ]
        }
        \`\`\`
      `;

      const keywords = (agent as any).parseJson(responseText);
      expect(keywords).toHaveLength(1);
      expect(keywords[0].keyword).toBe('mexican hacienda living room decor');
      expect(keywords[0].trend_score).toBe(9);
    });

    it('should validate parsed keywords against schema', () => {
      const agent = new PinTrendProAgent('dummy-key', 'dummy-prompt');
      
      // Invalid JSON: missing required field
      const responseText = `{
        "keywords": [
          {
            "keyword": "test",
            "type": "evergreen"
          }
        ]
      }`;

      expect(() => {
        (agent as any).parseJson(responseText);
      }).toThrow('Validation failed');
    });
  });
});
