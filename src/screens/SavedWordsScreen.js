import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDefaultList, removeWordFromList } from '../services/storageService';

export default function SavedWordsScreen() {
  const [savedWords, setSavedWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedWords = async () => {
    try {
      const defaultList = await getDefaultList();
      if (defaultList && defaultList.words) {
        // Ordenar por fecha de agregado (más recientes primero)
        const sortedWords = defaultList.words.sort((a, b) => 
          new Date(b.addedAt) - new Date(a.addedAt)
        );
        setSavedWords(sortedWords);
        setFilteredWords(sortedWords);
      } else {
        setSavedWords([]);
        setFilteredWords([]);
      }
    } catch (error) {
      console.error('Error cargando palabras guardadas:', error);
      Alert.alert('Error', 'No se pudieron cargar las palabras guardadas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadSavedWords();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedWords();
  };

  const filterWords = (text) => {
    setSearchFilter(text);
    if (text.trim() === '') {
      setFilteredWords(savedWords);
    } else {
      const filtered = savedWords.filter(wordData =>
        wordData.word.toLowerCase().includes(text.toLowerCase()) ||
        wordData.definitions.some(def => 
          def.definition.toLowerCase().includes(text.toLowerCase())
        )
      );
      setFilteredWords(filtered);
    }
  };

  const confirmDeleteWord = (wordData) => {
    Alert.alert(
      'Eliminar palabra',
      `¿Estás seguro de que quieres eliminar "${wordData.word}" de tu lista?`,
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
      const success = await removeWordFromList('default', wordData.id);
      if (success) {
        loadSavedWords(); // Recargar la lista
        Alert.alert('Éxito', 'Palabra eliminada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo eliminar la palabra');
      }
    } catch (error) {
      console.error('Error eliminando palabra:', error);
      Alert.alert('Error', 'Ocurrió un error al eliminar la palabra');
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDeleteWord(wordData)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
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
        <Text style={styles.loadingText}>Cargando palabras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Palabras</Text>
        <Text style={styles.subtitle}>
          {filteredWords.length} palabra{filteredWords.length !== 1 ? 's' : ''} guardada{filteredWords.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {savedWords.length > 0 && (
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en mis palabras..."
          value={searchFilter}
          onChangeText={filterWords}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>
              {savedWords.length === 0 
                ? 'No tienes palabras guardadas' 
                : 'No se encontraron palabras'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {savedWords.length === 0 
                ? 'Busca palabras en el diccionario y guárdalas para crear tu lista personal'
                : 'Intenta con otros términos de búsqueda'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.wordsContainer}>
            {filteredWords.map((wordData, index) => renderWordItem(wordData, index))}
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
    paddingTop: 60,
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
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  searchInput: {
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  wordsContainer: {
    padding: 20,
    paddingTop: 10,
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
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  deleteButtonText: {
    fontSize: 16,
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