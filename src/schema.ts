import * as AjvPkg from "ajv";

const AjvClass: any = (AjvPkg as any).default ?? AjvPkg;

export const pinKeywordsSchema = {
  type: "object",
  properties: {
    keywords: {
      type: "array",
      items: {
        type: "object",
        properties: {
          keyword: { type: "string" },
          type: { type: "string", enum: ["seasonal", "evergreen", "trending"] },
          trend_score: { type: "integer", minimum: 1, maximum: 10 },
          pin_title_en: { type: "string" },
          pin_title_es: { type: "string" },
          pin_description_en: { type: "string" },
          pin_description_es: { type: "string" },
          image_prompt: { type: "string" },
          suggested_blog_index: { type: "integer" }
        },
        required: ["keyword","type","trend_score","pin_title_en","pin_title_es","pin_description_en","pin_description_es","image_prompt","suggested_blog_index"],
        additionalProperties: false
      }
    }
  },
  required: ["keywords"],
  additionalProperties: false
};

const ajv = new (AjvClass as any)({ allErrors: true, strict: false });
const validate = ajv.compile(pinKeywordsSchema);

export function validatePinKeywords(obj: unknown): { valid: boolean; errors?: any } {
  const valid = validate(obj) as boolean;
  return { valid, errors: valid ? undefined : validate.errors };
}
