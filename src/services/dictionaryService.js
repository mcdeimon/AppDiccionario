const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.EXPO_PUBLIC_DEEPSEEK_API_URL;

export const searchWord = async (word) => {
  try {
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.includes('tu-api-key')) {
      return {
        success: false,
        message: 'Error de configuración del diccionario.'
      };
    }

    const cleanWord = word.trim().toLowerCase();
    
   const prompt = `Define la palabra "${cleanWord}" como un diccionario educativo. 

IMPORTANTE: 
- Primero identifica el idioma de la palabra
- Si la palabra NO es española, indícalo claramente en la respuesta
- Si es una palabra extranjera (inglés, griego, latín, etc.), proporciona su definición y significado en español
- Si es una palabra española, procede normalmente

Responde ÚNICAMENTE en este formato JSON válido (sin markdown ni texto adicional):
{
  "word": "${cleanWord}",
  "language": "idioma detectado (español, inglés, griego, latín, etc.)",
  "isSpanish": true/false,
  "definitions": [
    {
      "definition": "explicación clara de la palabra en español",
      "category": "sustantivo/verbo/adjetivo/etc",
      "usage": null,
      "synonyms": ["sinónimo1", "sinónimo2"],
      "antonyms": []
    }
  ],
  "etymology": "origen de la palabra o null",
  "source": "Diccionario Español"
}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          message: 'Error de autenticación del diccionario.'
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          message: 'Demasiadas consultas. Intenta de nuevo en unos segundos.'
        };
      }
      
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // --- INICIO DE LA MODIFICACIÓN ---
    // Búsqueda robusta del objeto JSON en la respuesta
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new SyntaxError("No se encontró un objeto JSON válido en la respuesta.");
    }

    const jsonString = content.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonString);
    // --- FIN DE LA MODIFICACIÓN ---
    
    return {
      word: parsedData.word,
      language: parsedData.language,
      isSpanish: parsedData.isSpanish,
      definitions: parsedData.definitions,
      etymology: parsedData.etymology,
      source: parsedData.source,
      success: true
    };
    
  } catch (error) {
    console.error('Error al consultar diccionario:', error);
    
    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        message: 'Error de conexión. Verifica tu internet y intenta de nuevo.'
      };
    }
    
    if (error instanceof SyntaxError) {
      return {
        success: false,
        message: 'Error procesando la respuesta del diccionario.'
      };
    }
    
    return {
      success: false,
      message: 'Error al consultar el diccionario. Intenta de nuevo.'
    };
  }
};