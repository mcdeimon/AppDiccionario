import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWordLists, removeWordFromList, deleteWordList } from '../services/storageService';

export default function SavedWordsScreen() {
  const [allLists, setAllLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllLists = async () => {
  try {
    const lists = await getWordLists();
    setAllLists(lists);
    
    // Seleccionar "General" por defecto si está disponible
    const defaultList = lists.find(list => list.id === 'default');
    if (defaultList) {
      setSelectedList(defaultList);
    } else if (lists.length > 0) {
      setSelectedList(lists[0]);
    }
  } catch (error) {
    console.error('Error cargando listas:', error);
    Alert.alert('Error', 'No se pudieron cargar las listas');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  // Cargar datos cuando la pantalla obtiene el foco
 useFocusEffect(
  useCallback(() => {
    // Resetear todo el estado cuando la pantalla obtiene el foco (IGUAL QUE GAMESCREEN)
    resetState();
    loadAllLists();
  }, [])
);

// NUEVA FUNCIÓN - igual que resetGame en GameScreen
const resetState = () => {
  setSelectedList(null);
  setLoading(true);
};


  const onRefresh = () => {
    setRefreshing(true);
    loadAllLists();
  };

  const confirmDeleteWord = (wordData) => {
    Alert.alert(
      'Eliminar palabra',
      `¿Estás seguro de que quieres eliminar "${wordData.word}" de "${selectedList.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteWord(wordData)
        }
      ]
    );
  };

  const deleteWord = async (wordData) => {
    try {
      const success = await removeWordFromList(selectedList.id, wordData.id);
      if (success) {
        loadAllLists(); // Recargar todas las listas
        Alert.alert('Éxito', 'Palabra eliminada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo eliminar la palabra');
      }
    } catch (error) {
      console.error('Error eliminando palabra:', error);
      Alert.alert('Error', 'Ocurrió un error al eliminar la palabra');
    }
  };

  const confirmDeleteList = (list) => {
    Alert.alert(
      'Eliminar lista',
      `¿Estás seguro de que quieres eliminar la lista "${list.name}"?\n\nEsta acción eliminará todas las palabras de la lista y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => handleDeleteList(list)
        }
      ]
    );
  };

  const handleDeleteList = async (list) => {
    try {
      const result = await deleteWordList(list.id);
      if (result.success) {
        // Si eliminamos la lista seleccionada, cambiar a "General"
        if (selectedList.id === list.id) {
          const defaultList = allLists.find(l => l.id === 'default');
          setSelectedList(defaultList);
        }
        await loadAllLists();
        Alert.alert('Éxito', 'Lista eliminada correctamente');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error eliminando lista:', error);
      Alert.alert('Error', 'No se pudo eliminar la lista');
    }
  };

  //Funcion de compartir
  const handleShare = async (wordData) => {
    if (!wordData) return;

    try {
      let message = `📖 *${wordData.word}*\n`;
      if (wordData.etymology) {
        message += `_${wordData.etymology}_\n`;
      }
      message += '\n';
      wordData.definitions.forEach((def, index) => {
        message += `*${index + 1}.* ${def.definition}`;
        if (def.category) {
          message += ` _(${def.category})_`;
        }
        message += '\n';
        if (def.synonyms && def.synonyms.length > 0) {
          message += `*Sinónimos:* ${def.synonyms.join(', ')}\n`;
        }
        if (def.antonyms && def.antonyms.length > 0) {
            message += `*Antónimos:* ${def.antonyms.join(', ')}\n`;
        }
        message += '\n';
      });
      message += '---\nCompartido desde Glosario Universal';

      await Share.share({
        message: message,
        title: `Definición de ${wordData.word}`
      });
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al intentar compartir.');
    }
  };

  const renderWordItem = (wordData, index) => {
    const addedDate = new Date(wordData.addedAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return (
      <View key={wordData.id || index} style={styles.wordItem}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordTitle}>{wordData.word}</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleShare(wordData)}
            >
              <Text style={styles.deleteButtonText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => confirmDeleteWord(wordData)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.addedDate}>Agregada el {addedDate}</Text>

        {wordData.etymology && (
          <Text style={styles.etymology}>
            📚 {wordData.etymology}
          </Text>
        )}

        <View style={styles.definitionsContainer}>
          {wordData.definitions && wordData.definitions.map((def, defIndex) => (
            <View key={defIndex} style={styles.definitionItem}>
              <Text style={styles.definitionNumber}>{defIndex + 1}.</Text>
              <View style={styles.definitionContent}>
                <Text style={styles.definitionText}>{def.definition}</Text>
                {def.category && (
                  <Text style={styles.categoryText}>({def.category})</Text>
                )}
                {def.synonyms && def.synonyms.length > 0 && (
                  <Text style={styles.synonymsText}>
                    Sinónimos: {def.synonyms.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Cargando listas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Búsquedas Guardadas</Text>
      
        <Text style={styles.subtitle}>
          {allLists.length} lista{allLists.length !== 1 ? 's' : ''} creada{allLists.length !== 1 ? 's' : ''}
        </Text>
       
        
        {/* SELECTOR DE LISTAS DENTRO DEL HEADER */}
        <View style={styles.selectorInHeader}>
          {/* <Text style={styles.selectorTitle}>Seleccionar lista:</Text> */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.selectorScroll}
            contentContainerStyle={styles.selectorContent}
          >
            {allLists.map((list) => (
              <View key={list.id} style={styles.listOptionContainer}>
                <TouchableOpacity
                  style={[
                    styles.listOption,
                    selectedList?.id === list.id && styles.listOptionSelected
                  ]}
                  onPress={() => setSelectedList(list)}
                >
                  <Text style={[
                    styles.listOptionText,
                    selectedList?.id === list.id && styles.listOptionTextSelected
                  ]}>
                    {list.name}
                  </Text>
                  <Text style={[
                    styles.listOptionCount,
                    selectedList?.id === list.id && styles.listOptionCountSelected
                  ]}>
                    {list.words.length} palabras
                  </Text>
                </TouchableOpacity>
                
                {/* Botón eliminar lista (solo si no es la default) */}
                {list.id !== 'default' && (
                  <TouchableOpacity
                    style={styles.deleteListButtonSmall}
                    onPress={() => confirmDeleteList(list)}
                  >
                    <Text style={styles.deleteListButtonText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* PALABRAS DE LA LISTA SELECCIONADA */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!selectedList || selectedList.words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>
              {!selectedList ? 'Selecciona una lista' : 'Lista vacía'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {!selectedList 
                ? 'Elige una lista para ver sus palabras'
                : 'Esta lista no tiene palabras guardadas'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.wordsContainer}>
            {selectedList.words
              .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
              .map((wordData, index) => renderWordItem(wordData, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
  
  
  // NUEVO ESTILO PARA EL SELECTOR DENTRO DEL HEADER
  selectorInHeader: {
    marginTop: 25,
    marginHorizontal: -5,
  },
  
  // ESTILOS DEL SELECTOR
  /* COMENTADO - YA NO SE USA
  selectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  */
  selectorScroll: {
    paddingHorizontal: 5,
  },
  selectorContent: {
    paddingRight: 10,
  },
  listOptionContainer: {
    marginRight: 10,
    alignItems: 'center',
  },
  listOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 120,
    alignItems: 'center',
  },
  listOptionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  listOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  listOptionTextSelected: {
    color: 'white',
  },
  listOptionCount: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
  },
  listOptionCountSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  deleteListButtonSmall: {
    backgroundColor: '#ffe6e6',
    borderRadius: 12,
    padding: 4,
    marginTop: 5,
  },
  deleteListButtonText: {
    fontSize: 12,
  },

  scrollContainer: {
    flex: 1,
  },
  wordsContainer: {
    padding: 20,
    paddingTop: 20,
  },
  wordItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  // AÑADE ESTOS ESTILOS NUEVOS
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10, // Espacio entre el título y los botones
  },
  iconButton: {
    padding: 8,
    marginLeft: 8, // Espacio entre los dos botones
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  deleteButtonText: {
    fontSize: 18, // Un poco más grande para que se vea bien
  },
  addedDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  etymology: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  definitionsContainer: {
    marginTop: 10,
  },
  definitionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  definitionNumber: {
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 8,
    minWidth: 20,
  },
  definitionContent: {
    flex: 1,
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#2c3e50',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8e44ad',
    marginBottom: 2,
  },
  synonymsText: {
    fontSize: 12,
    color: '#27ae60',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
});