import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WORD_LISTS: 'wordLists',
  DEFAULT_LIST: 'defaultList'
};

// Inicializar lista por defecto
const initializeDefaultList = async () => {
  try {
    const existingLists = await getWordLists();
    if (!existingLists.find(list => list.id === 'default')) {
      const defaultList = {
        id: 'default',
        name: 'Mis Palabras',
        words: [],
        createdAt: new Date().toISOString()
      };
      await saveWordList(defaultList);
    }
  } catch (error) {
    console.error('Error inicializando lista por defecto:', error);
  }
};

// Obtener todas las listas
export const getWordLists = async () => {
  try {
    const listsJson = await AsyncStorage.getItem(STORAGE_KEYS.WORD_LISTS);
    return listsJson ? JSON.parse(listsJson) : [];
  } catch (error) {
    console.error('Error obteniendo listas:', error);
    return [];
  }
};

// Guardar una lista
export const saveWordList = async (list) => {
  try {
    const lists = await getWordLists();
    const existingIndex = lists.findIndex(l => l.id === list.id);
    
    if (existingIndex >= 0) {
      lists[existingIndex] = list;
    } else {
      lists.push(list);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.WORD_LISTS, JSON.stringify(lists));
    return true;
  } catch (error) {
    console.error('Error guardando lista:', error);
    return false;
  }
};

// Agregar palabra a una lista
export const addWordToList = async (listId, wordData) => {
  try {
    const lists = await getWordLists();
    const listIndex = lists.findIndex(list => list.id === listId);
    
    if (listIndex === -1) {
      throw new Error('Lista no encontrada');
    }
    
    const list = lists[listIndex];
    
    // Verificar si la palabra ya existe
    const wordExists = list.words.find(w => w.word === wordData.word);
    if (wordExists) {
      return { success: false, message: 'La palabra ya existe en esta lista' };
    }
    
    // Agregar palabra con timestamp
    const wordToSave = {
      ...wordData,
      addedAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    list.words.push(wordToSave);
    lists[listIndex] = list;
    
    await AsyncStorage.setItem(STORAGE_KEYS.WORD_LISTS, JSON.stringify(lists));
    
    return { success: true, message: 'Palabra guardada exitosamente' };
  } catch (error) {
    console.error('Error agregando palabra:', error);
    return { success: false, message: 'Error al guardar la palabra' };
  }
};

// Eliminar palabra de una lista
export const removeWordFromList = async (listId, wordId) => {
  try {
    const lists = await getWordLists();
    const listIndex = lists.findIndex(list => list.id === listId);
    
    if (listIndex === -1) {
      throw new Error('Lista no encontrada');
    }
    
    const list = lists[listIndex];
    list.words = list.words.filter(word => word.id !== wordId);
    lists[listIndex] = list;
    
    await AsyncStorage.setItem(STORAGE_KEYS.WORD_LISTS, JSON.stringify(lists));
    return true;
  } catch (error) {
    console.error('Error eliminando palabra:', error);
    return false;
  }
};

// Obtener lista por defecto
export const getDefaultList = async () => {
  try {
    await initializeDefaultList();
    const lists = await getWordLists();
    return lists.find(list => list.id === 'default') || null;
  } catch (error) {
    console.error('Error obteniendo lista por defecto:', error);
    return null;
  }
};

// Inicializar el almacenamiento
export const initializeStorage = async () => {
  await initializeDefaultList();
};