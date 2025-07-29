import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard // <-- AÑADE ESTA LÍNEA
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchWord } from '../services/dictionaryService';
import { addWordToList, initializeStorage } from '../services/storageService';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const insets = useSafeAreaInsets();
  
  const bottomPadding = Math.max(insets.bottom, 20) + 80;

  useEffect(() => {
    initializeStorage();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setWordData(null);
      setSearchTerm('');
      setLoading(false);
      setSaving(false);
    }, [])
  );

  const handleSearch = async () => {
    Keyboard.dismiss(); // <-- AÑADE ESTA LÍNEA
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Por favor escribe una palabra');
      return;
    }

    setLoading(true);
    setWordData(null);
    
    try {
      const result = await searchWord(searchTerm);
      
      if (result.success) {
        setWordData(result);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
    
    setLoading(false);
  };

  const saveWord = async () => {
    if (!wordData) {
      Alert.alert('Error', 'Primero busca una palabra');
      return;
    }

    setSaving(true);
    
    try {
      const result = await addWordToList('default', wordData);
      
      if (result.success) {
        Alert.alert(
          'Éxito', 
          result.message,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Aviso', result.message);
      }
    } catch (error) {
      console.error('Error guardando palabra:', error);
      Alert.alert('Error', 'No se pudo guardar la palabra');
    }
    
    setSaving(false);
  };

  const renderDefinitions = () => {
    if (!wordData || !wordData.definitions || wordData.definitions.length === 0) return null;

    return wordData.definitions.map((defData, index) => (
      <View key={index} style={styles.definitionItem}>
        <Text style={styles.definitionNumber}>{index + 1}.</Text>
        <View style={styles.definitionContent}>
          <Text style={styles.definitionText}>{defData.definition}</Text>
          {defData.category && (
            <Text style={styles.categoryText}>({defData.category})</Text>
          )}
          {defData.usage && (
            <Text style={styles.usageText}>Uso: {defData.usage}</Text>
          )}
          {defData.synonyms && defData.synonyms.length > 0 && (
            <Text style={styles.synonymsText}>
              Sinónimos: {defData.synonyms.join(', ')}
            </Text>
          )}
        </View>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" 
        contentContainerStyle={{
          paddingBottom: bottomPadding,
        }}
      >
        <Text style={styles.title}>Diccionario Español</Text>
        <Text style={styles.subtitle}>Tu compañero de aprendizaje</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>Buscando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔍 Buscar</Text>
          )}
        </TouchableOpacity>
        
        {wordData && (
          <View style={styles.resultContainer}>
            <Text style={styles.wordTitle}>{wordData.word}</Text>

            {wordData.language && !wordData.isSpanish && (
            <View style={styles.languageContainer}>
                <Text style={styles.languageText}>
                🌍 Idioma: {wordData.language}
                </Text>
            </View>
            )}
            
            {wordData.etymology && (
              <Text style={styles.etymology}>
                📚 Etimología: {wordData.etymology}
              </Text>
            )}
            
            <View style={styles.definitionsContainer}>
              <Text style={styles.definitionsTitle}>Definiciones:</Text>
              {renderDefinitions()}
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={saveWord}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>
                    Guardando...
                  </Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>💾 Guardar palabra</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 2,
    borderColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  etymology: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
  },
  definitionsContainer: {
    marginBottom: 20,
  },
  definitionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  definitionItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingLeft: 10,
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
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  categoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8e44ad',
    marginTop: 2,
  },
  usageText: {
    fontSize: 12,
    color: '#e67e22',
    marginTop: 2,
  },
  synonymsText: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 2,
  },
  languageContainer: {
  backgroundColor: '#e8f4fd',
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
  borderLeftWidth: 4,
  borderLeftColor: '#3498db',
},
languageText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2980b9',
  textAlign: 'center',
},
});