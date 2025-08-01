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
  Keyboard,
  Share
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchWord } from '../services/dictionaryService';
import { addWordToList, initializeStorage } from '../services/storageService';
import ListSelectionModal from '../components/ListSelectionModal';

// <-- 1. IMPORTS Anuncios
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// <-- 2. DEFINIMOS EL ID DEL ANUNCIO
const adUnitId = TestIds.BANNER;

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

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
    Keyboard.dismiss();
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
    setShowListModal(true);
  };

  const handleSaveToList = async (selectedList) => {
    setSaving(true);
    try {
      const defaultResult = await addWordToList('default', wordData);
      let customResult = { success: true };
      if (selectedList.id !== 'default') {
        customResult = await addWordToList(selectedList.id, wordData);
      }
      if (defaultResult.success && customResult.success) {
        if (selectedList.id === 'default') {
          Alert.alert('Éxito', 'Palabra guardada en "General"');
        } else {
          Alert.alert(
            'Éxito',
            `Palabra guardada en "General" y en "${selectedList.name}"`
          );
        }
      } else {
        if (!defaultResult.success && defaultResult.message.includes('ya existe')) {
          Alert.alert('Aviso', 'La palabra ya estaba en tu biblioteca');
        } else {
          Alert.alert('Error', 'No se pudo guardar la palabra');
        }
      }
    } catch (error) {
      console.error('Error guardando palabra:', error);
      Alert.alert('Error', 'No se pudo guardar la palabra');
    }
    setSaving(false);
  };

  const handleShare = async () => {
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

  const renderDefinitions = () => {
    if (!wordData || !wordData.definitions || wordData.definitions.length === 0) return null;
    return wordData.definitions.map((defData, index) => (
      <View key={index} style={styles.definitionItem}>
        <Text style={styles.definitionNumber}>{index + 1}.</Text>
        <View style={styles.definitionContent}>
          <Text style={styles.definitionText}>{defData.definition}</Text>
          {defData.category && (<Text style={styles.categoryText}>({defData.category})</Text>)}
          {defData.usage && (<Text style={styles.usageText}>Uso: {defData.usage}</Text>)}
          {defData.synonyms && defData.synonyms.length > 0 && (<Text style={styles.synonymsText}>Sinónimos: {defData.synonyms.join(', ')}</Text>)}
        </View>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* <-- INICIO CAMBIO: BANNER MOVIDO A LA PARTE SUPERIOR --> */}
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
      {/* <-- FIN CAMBIO --> */}
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <Text style={styles.title}>Glosario Universal</Text>
        <Text style={styles.subtitle}>Más que un diccionario</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra, expresión..."
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
            <View style={styles.wordHeader}>
              <Text style={styles.wordTitle}>{wordData.word}</Text>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <Text style={styles.shareButtonIcon}>📤</Text>
              </TouchableOpacity>
            </View>
            
            {wordData.language && !wordData.isSpanish && (
              <View style={styles.languageContainer}>
                <Text style={styles.languageText}>🌍 Idioma: {wordData.language}</Text>
              </View>
            )}
            
            {wordData.etymology && (
              <Text style={styles.etymology}>📚 Etimología: {wordData.etymology}</Text>
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
                  <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>Guardando...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>💾 Guardar palabra</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ListSelectionModal
        visible={showListModal}
        onClose={() => setShowListModal(false)}
        onSelectList={handleSaveToList}
        wordData={wordData}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    // paddingTop: 30, // <-- CAMBIO: Eliminado para evitar doble padding
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  shareButton: {
    padding: 8,
  },
  shareButtonIcon: {
    fontSize: 24,
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
  // <-- CAMBIO: Estilo del contenedor del banner modificado -->
 adContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
});