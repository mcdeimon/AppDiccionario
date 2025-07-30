import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { deleteAllUserData } from '../services/storageService';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const confirmDeleteAllData = () => {
    Alert.alert(
      'Eliminar Todos los Datos',
      '¿Estás seguro de que quieres eliminar TODAS tus listas y palabras guardadas? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar Todo', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAllUserData();
            if (result.success) {
              Alert.alert('Éxito', result.message, [
                { text: 'OK', onPress: () => navigation.navigate('Search') }
              ]);
            } else {
              Alert.alert('Error', result.message);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestión de Datos</Text>
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={confirmDeleteAllData}
          activeOpacity={0.7}
        >
          <Text style={styles.optionIcon}>🗑️</Text>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Eliminar todos los datos</Text>
            <Text style={styles.optionDescription}>
              Borra permanentemente todas tus listas y palabras guardadas.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Aquí podrás añadir más opciones en el futuro */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  section: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  optionDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 3,
  },
});