import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WORD_LISTS: 'wordLists',
  DEFAULT_LIST: 'defaultList'
};

// Inicializar lista por defecto
// Inicializar lista por defecto
const initializeDefaultList = async () => {
  try {
    const existingLists = await getWordLists();
    const defaultList = existingLists.find(list => list.id === 'default');
    
    if (!defaultList) {
      // Si no existe la lista default, crearla
      const newDefaultList = {
        id: 'default',
        name: 'General',
        words: [],
        createdAt: new Date().toISOString()
      };
      await saveWordList(newDefaultList);
    } else {
      // Si existe pero tiene un nombre diferente, actualizarlo
      if (defaultList.name !== 'General') {
        defaultList.name = 'General';
        await saveWordList(defaultList);
        console.log('Nombre de lista default actualizado a "General"');
      }
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

// Nuevas funciones creacion de Listas

// Crear nueva lista
export const createWordList = async (listName) => {
  try {
    if (!listName || listName.trim() === '') {
      return { success: false, message: 'El nombre de la lista no puede estar vacío' };
    }

    const lists = await getWordLists();
    
    // Verificar si ya existe una lista con ese nombre
    const nameExists = lists.find(list => 
      list.name.toLowerCase() === listName.trim().toLowerCase()
    );
    
    if (nameExists) {
      return { success: false, message: 'Ya existe una lista con ese nombre' };
    }

    const newList = {
      id: Date.now().toString(),
      name: listName.trim(),
      words: [],
      createdAt: new Date().toISOString()
    };

    lists.push(newList);
    await AsyncStorage.setItem(STORAGE_KEYS.WORD_LISTS, JSON.stringify(lists));
    
    return { success: true, message: 'Lista creada exitosamente', list: newList };
  } catch (error) {
    console.error('Error creando lista:', error);
    return { success: false, message: 'Error al crear la lista' };
  }
};

// Eliminar lista
export const deleteWordList = async (listId) => {
  try {
    if (listId === 'default') {
      return { success: false, message: 'No puedes eliminar la lista principal' };
    }

    const lists = await getWordLists();
    const filteredLists = lists.filter(list => list.id !== listId);
    
    await AsyncStorage.setItem(STORAGE_KEYS.WORD_LISTS, JSON.stringify(filteredLists));
    return { success: true, message: 'Lista eliminada exitosamente' };
  } catch (error) {
    console.error('Error eliminando lista:', error);
    return { success: false, message: 'Error al eliminar la lista' };
  }
};

// Obtener lista por ID
export const getListById = async (listId) => {
  try {
    const lists = await getWordLists();
    return lists.find(list => list.id === listId) || null;
  } catch (error) {
    console.error('Error obteniendo lista:', error);
    return null;
  }
};

// Fin Nuevas funciones creacion de Listas