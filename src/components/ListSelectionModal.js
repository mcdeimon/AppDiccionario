import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { getWordLists, createWordList, deleteWordList } from '../services/storageService';

export default function ListSelectionModal({ 
  visible, 
  onClose, 
  onSelectList, 
  wordData 
}) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLists();
      setShowCreateForm(false);
      setNewListName('');
    }
  }, [visible]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const allLists = await getWordLists();
      setLists(allLists);
    } catch (error) {
      console.error('Error cargando listas:', error);
      Alert.alert('Error', 'No se pudieron cargar las listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la lista');
      return;
    }

    setCreating(true);
    try {
      const result = await createWordList(newListName);
      
      if (result.success) {
        setNewListName('');
        setShowCreateForm(false);
        await loadLists();
        Alert.alert('Éxito', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error creando lista:', error);
      Alert.alert('Error', 'No se pudo crear la lista');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectList = (list) => {
    onSelectList(list);
    onClose();
  };

  const confirmDeleteList = (list) => {
    Alert.alert(
      'Eliminar lista',
      `¿Estás seguro de que quieres eliminar "${list.name}"?`,
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
        await loadLists();
        Alert.alert('Éxito', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error eliminando lista:', error);
      Alert.alert('Error', 'No se pudo eliminar la lista');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar lista</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Palabra a guardar */}
          {wordData && (
            <View style={styles.wordInfo}>
              <Text style={styles.wordInfoText}>
                Guardando: <Text style={styles.wordName}>"{wordData.word}"</Text>
              </Text>
            </View>
          )}

          {/* Contenido */}
          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : (
              <>
                {/* Listas existentes */}
                {lists.map((list) => (
                  <View key={list.id} style={styles.listRow}>
                    <TouchableOpacity
                      style={styles.listButton}
                      onPress={() => handleSelectList(list)}
                    >
                      <View>
                        <Text style={styles.listName}>{list.name}</Text>
                        <Text style={styles.listCount}>
                          {list.words.length} palabras
                        </Text>
                      </View>
                      <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>
                    
                    {list.id !== 'default' && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDeleteList(list)}
                      >
                        <Text style={styles.deleteText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Formulario crear nueva lista */}
                {showCreateForm ? (
                  <View style={styles.createForm}>
                    <Text style={styles.createTitle}>Nueva lista</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre de la lista..."
                      value={newListName}
                      onChangeText={setNewListName}
                      autoFocus={true}
                    />
                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowCreateForm(false);
                          setNewListName('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateList}
                        disabled={creating}
                      >
                        {creating ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text style={styles.createButtonText}>Crear</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.newListButton}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Text style={styles.newListText}>+ Crear nueva lista</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  wordInfo: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    margin: 20,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  wordInfoText: {
    fontSize: 14,
    color: '#666',
  },
  wordName: {
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  loading: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  listButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 8,
    padding: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
  },
  createForm: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  createTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  newListButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#27ae60',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  newListText: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 16,
  },
});