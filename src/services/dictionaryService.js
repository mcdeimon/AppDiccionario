// RUTA: AppDiccionario/src/services/dictionaryService.js

// URL de tu función en Vercel. Esta es la única configuración necesaria.
const MY_PROXY_URL = 'https://diccionario-proxy-ttq9rrz00-davids-projects-e7e5e2f9.vercel.app/api/define';

export const searchWord = async (word) => {
  try {
    const cleanWord = word.trim().toLowerCase();
    
    // Llamamos a nuestro proxy seguro.
    // encodeURIComponent es importante para manejar caracteres especiales como espacios o acentos.
    const response = await fetch(`${MY_PROXY_URL}?word=${encodeURIComponent(cleanWord)}`);

    // Obtenemos la respuesta JSON de nuestro proxy
    const data = await response.json();

    // Si la respuesta de nuestro proxy no fue exitosa (status 4xx o 5xx)
    if (!response.ok) {
      // Usamos el mensaje de error que nuestro propio proxy nos envió
      return {
        success: false,
        message: data.error || `Error del servidor: ${response.status}`
      };
    }

    // Si todo fue bien, la data ya es el objeto que esperamos
    return {
      ...data,
      success: true
    };
    
  } catch (error) {
    // Este 'catch' ahora solo se activará si hay un problema de red
    // (ej. el usuario no tiene internet) y no se puede conectar a Vercel.
    console.error('Error al contactar el proxy:', error);
    
    return {
      success: false,
      message: 'Error de conexión. Verifica tu internet y intenta de nuevo.'
    };
  }
};