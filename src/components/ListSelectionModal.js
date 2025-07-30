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
    }
  }, [visible]);

 const loadLists = async () => {
  setLoading(true);
  try {
    const allLists = await getWordLists();
    // CAMBIAR ESTA LÍNEA: Remover el filtro que excluye la lista default
    // const filteredLists = allLists.filter(list => list.id !== 'default');
    // POR ESTA LÍNEA: Mostrar todas las listas incluyendo la default
    const filteredLists = allLists;
    setLists(filteredLists);
  } catch (error) {
    console.error('Error cargando listas:', error);
  } finally {
    setLoading(false);
  }
};

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Escribe un nombre para la lista');
      return;
    }

    setCreating(true);
    try {
      const result = await createWordList(newListName);
      if (result.success) {
        setNewListName('');
        setShowCreateForm(false);
        await loadLists(); // Recargar listas después de crear
        Alert.alert('Éxito', 'Lista creada correctamente');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la lista');
    } finally {
      setCreating(false);
    }
  };

  // MODIFICAR ESTA FUNCIÓN para recargar las listas después de seleccionar
  const handleSelectList = async (list) => {
    // Llamar a la función original
    await onSelectList(list);
    
    // Recargar las listas después de un breve delay
    setTimeout(() => {
      if (visible) {
        loadLists();
      }
    }, 500);
  };

  const handleDeleteList = (list) => {
    Alert.alert(
      'Eliminar lista',
      `¿Eliminar "${list.name}"?`,
      [
        { text: 'Cancelar' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            const result = await deleteWordList(list.id);
            if (result.success) {
              await loadLists(); // Recargar listas después de eliminar
              Alert.alert('Éxito', 'Lista eliminada correctamente');
            } else {
              Alert.alert('Error', result.message);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar lista</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* PALABRA */}
          <View style={styles.wordSection}>
            <Text style={styles.wordText}>
              Guardando: "{wordData?.word}"
            </Text>
          </View>

          {/* CONTENIDO */}
          {loading ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text>Cargando...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollSection}>
              
              {/* LISTAS */}
              {lists.map((list) => (
                <View key={list.id} style={styles.listContainer}>
                  <TouchableOpacity
                    style={styles.listButton}
                    onPress={() => handleSelectList(list)}
                  >
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listCount}>
                      {list.words.length} palabra{list.words.length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                  
                  {list.id !== 'default' && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteList(list)}
                    >
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* CREAR NUEVA LISTA */}
              {showCreateForm ? (
                <View style={styles.createSection}>
                  <Text style={styles.createTitle}>Nueva lista:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre..."
                    value={newListName}
                    onChangeText={setNewListName}
                  />
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowCreateForm(false);
                        setNewListName('');
                      }}
                    >
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleCreateList}
                      disabled={creating}
                    >
                      <Text style={styles.buttonText}>
                        {creating ? 'Creando...' : 'Crear'}
                      </Text>
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
              
              {/* ESPACIO EXTRA */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Los estilos permanecen igual...
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 15,
    maxHeight: '80%',
    elevation: 5,
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
    fontSize: 20,
    color: '#666',
    padding: 5,
  },
  wordSection: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  wordText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    padding: 40,
  },
  scrollSection: {
    maxHeight: 400,
    padding: 15,
  },
  listContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  listButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  deleteButton: {
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  createSection: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  buttonRow: {
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
  confirmButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  newListButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#27ae60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  newListText: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 16,
  },
});