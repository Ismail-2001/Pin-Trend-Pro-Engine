// Example POST request to /api/generate
// Base URL: http://localhost:3000/api/generate

// Minimal request (uses defaults)
{
  "apiKey": "your-openai-api-key"
}

// Full request with custom parameters
{
  "apiKey": "your-openai-api-key",
  "count": 10,
  "seasonal": 3,
  "evergreen": 5,
  "trending": 2,
  "userQuery": "Create Mexican home decor keywords for May 2026 focusing on Cinco de Mayo themes",
  "blogUrls": [
    "https://example.com/talavera-tiles",
    "https://example.com/hacienda-style",
    "https://example.com/mexican-kitchen"
  ]
}

// cURL example:
// curl -X POST http://localhost:3000/api/generate \
//   -H "Content-Type: application/json" \
//   -d '{
//     "apiKey": "your-openai-api-key",
//     "count": 6,
//     "userQuery": "Generate 6 Mexican home decor Pinterest keywords"
//   }'

// Response (success):
{
  "keywords": [
    {
      "keyword": "talavera tile kitchen backsplash ideas",
      "type": "evergreen",
      "trend_score": 8,
      "pin_title_en": "Talavera Tile Backsplash Ideas That Transform Any Kitchen",
      "pin_title_es": "Ideas de Azulejos Talavera para Cocinas que Enamoran",
      "pin_description_en": "Transform your kitchen with the rich beauty of Talavera tile backsplash...",
      "pin_description_es": "Dale vida a tu cocina con la magia de los azulejos Talavera...",
      "image_prompt": "Styled room scene, rule of thirds composition. Mexican kitchen...",
      "suggested_blog_index": 0
    }
    // ... more keywords
  ]
}

// Response (error):
{
  "error": "OPENAI_API_KEY is required in env or request body."
}
