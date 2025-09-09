I want to develop a specific application with the following requirements:

**Purpose:**
The app will generate two views to be exported as PDF documents. Both documents will include text and images sourced from a local data file (JSON) and local images.

**Views:**
1. **Word Cloud:**
   - Single page view.
   - Includes only the data from the "word" key.
   - Each word in the Word Cloud must have a different size, weight, and font family.

2. **Dossier:**
   - Multiple page view.
   - Includes all data in a paragraph format per item.
   - Text data will be rendered as text, and the "picture" key will be rendered as an image.

**Data Schema:**
```json
{
  "person": "string",
  "word": "string",
  "description": "text",
  "picture": "string"
}
```

**Tech Stack:**
- React
- Vite
- Tailwind CSS
- Google Fonts