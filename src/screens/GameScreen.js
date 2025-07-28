import React, { useState, useCallback } from 'react'; // MODIFICAR ESTA LÍNEA
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // AÑADIR ESTA LÍNEA
import { getDefaultList } from '../services/storageService';

export default function GameScreen({ navigation }) {
  const [savedWords, setSavedWords] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);

  // REEMPLAZAR useEffect con useFocusEffect
  useFocusEffect(
    useCallback(() => {
      // Resetear estado cuando la pantalla obtiene el foco
      setScore(0);
      setQuestionsAnswered(0);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setShowResult(false);
      setLoading(true);
      
      loadWordsAndStartGame();
    }, [])
  );

  const loadWordsAndStartGame = async () => {
    try {
      const defaultList = await getDefaultList();
      if (defaultList && defaultList.words && defaultList.words.length >= 2) {
        setSavedWords(defaultList.words);
        generateQuestion(defaultList.words);
      } else {
        Alert.alert(
          'Palabras insuficientes', 
          'Necesitas al menos 2 palabras guardadas para jugar',
          [
            { text: 'Ir a búsqueda', onPress: () => navigation.navigate('Search') },
            { text: 'Ver mis palabras', onPress: () => navigation.navigate('SavedWords') }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las palabras');
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = (wordsList) => {
    // Seleccionar palabra correcta aleatoriamente
    const correctWord = wordsList[Math.floor(Math.random() * wordsList.length)];
    
    // Crear opciones incorrectas (3 definiciones de otras palabras)
    const wrongOptions = wordsList
      .filter(w => w.word !== correctWord.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.definitions[0].definition);

    // Mezclar todas las opciones
    const allOptions = [
      correctWord.definitions[0].definition,
      ...wrongOptions
    ].sort(() => 0.5 - Math.random());

    setCurrentQuestion({
      word: correctWord.word,
      correctAnswer: correctWord.definitions[0].definition,
      options: allOptions,
      etymology: correctWord.etymology
    });

    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (selectedOption) => {
    setSelectedAnswer(selectedOption);
    setShowResult(true);
    
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 10);
    }
    
    setQuestionsAnswered(questionsAnswered + 1);
  };

  const nextQuestion = () => {
    if (savedWords.length > 0) {
      generateQuestion(savedWords);
    }
  };

  const getOptionStyle = (option) => {
    if (!showResult) {
      return styles.optionButton;
    }
    
    if (option === currentQuestion.correctAnswer) {
      return [styles.optionButton, styles.correctOption];
    }
    
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
      return [styles.optionButton, styles.wrongOption];
    }
    
    return [styles.optionButton, styles.disabledOption];
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Preparando juego...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>😔 No se pudo iniciar el juego</Text>
        <Text style={styles.emptySubtitle}>Necesitas al menos 2 palabras guardadas</Text>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.actionButtonText}>Buscar palabras</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Quiz de Definiciones</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.score}>Puntos: {score}</Text>
          <Text style={styles.progress}>Pregunta {questionsAnswered + 1}</Text>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          ¿Cuál es la definición de:
        </Text>
        <Text style={styles.wordText}>"{currentQuestion.word}"</Text>
        
        {currentQuestion.etymology && showResult && (
          <Text style={styles.etymologyText}>
            📚 {currentQuestion.etymology}
          </Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(option)}
            onPress={() => handleAnswer(option)}
            disabled={showResult}
            activeOpacity={0.8}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {selectedAnswer === currentQuestion.correctAnswer ? '🎉 ¡Correcto!' : '❌ Incorrecto'}
          </Text>
          {selectedAnswer === currentQuestion.correctAnswer ? (
            <Text style={styles.resultSubtext}>+10 puntos</Text>
          ) : (
            <Text style={styles.resultSubtext}>
              La respuesta correcta era la opción marcada en verde
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextQuestion}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>➡️ Siguiente pregunta</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  questionContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  questionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
  },
  wordText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  etymologyText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  correctOption: {
    backgroundColor: '#d4edda',
    borderColor: '#27ae60',
  },
  wrongOption: {
    backgroundColor: '#f8d7da',
    borderColor: '#e74c3c',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 15,
  },
  nextButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});