import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWordLists } from '../services/storageService';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = TestIds.BANNER;
//const adUnitId = 'ca-app-pub-4376664870286648/1025398284';

export default function GameScreen({ navigation }) {
  const [allLists, setAllLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      resetGame();
      loadAllLists();
    }, [])
  );

  const resetGame = () => {
    setScore(0);
    setQuestionsAnswered(0);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStarted(false);
  };

  const loadAllLists = async () => {
    setLoading(true);
    try {
      const lists = await getWordLists();
      const validLists = lists.filter(list => list.words && list.words.length >= 2);
      setAllLists(validLists);
      
      const defaultList = validLists.find(list => list.id === 'default');
      if (defaultList) {
        setSelectedList(defaultList);
      } else if (validLists.length > 0) {
        setSelectedList(validLists[0]);
      }
    } catch (error) {
      console.error('Error cargando listas:', error);
      Alert.alert('Error', 'No se pudieron cargar las listas');
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    if (!selectedList || selectedList.words.length < 2) {
      Alert.alert(
        'Palabras insuficientes', 
        'Necesitas al menos 2 palabras en la lista seleccionada para jugar',
        [
          { text: 'Ir a búsqueda', onPress: () => navigation.navigate('Search') },
          { text: 'Ver mis listas', onPress: () => navigation.navigate('SavedWords') }
        ]
      );
      return;
    }
    
    setGameStarted(true);
    generateQuestion(selectedList.words);
  };

  const generateQuestion = (wordsList) => {
    const correctWord = wordsList[Math.floor(Math.random() * wordsList.length)];
    const wrongOptions = wordsList
      .filter(w => w.word !== correctWord.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.definitions[0].definition);

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
  };

  const nextQuestion = () => {
    setQuestionsAnswered(questionsAnswered + 1);
    if (selectedList && selectedList.words.length > 0) {
      generateQuestion(selectedList.words);
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

  const renderListSelector = () => (
    <View style={styles.selectorContainer}>
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
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Preparando juego...</Text>
      </View>
    );
  }

  if (allLists.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>😔 No hay listas disponibles</Text>
        <Text style={styles.emptySubtitle}>
          Necesitas al menos una lista con 2 o más palabras para jugar
        </Text>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.actionButtonText}>Buscar palabras</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz de Definiciones</Text>
          <Text style={styles.subtitle}>Elige una lista y demuestra tu conocimiento</Text>
          
          <View style={styles.selectorInHeader}>
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
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.startGameContainer}>
          <TouchableOpacity
            style={[
              styles.startGameButton,
              (!selectedList || selectedList.words.length < 2) && styles.startGameButtonDisabled
            ]}
            onPress={startGame}
            disabled={!selectedList || selectedList.words.length < 2}
          >
            <Text style={styles.startGameButtonText}>🚀 Comenzar Juego</Text>
          </TouchableOpacity>
          
          {selectedList && selectedList.words.length < 2 && (
            <Text style={styles.warningText}>
              Se necesitan al menos 2 palabras para jugar
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.gameHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setGameStarted(false)}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.gameInfo}>
              <Text style={styles.gameListName}>{selectedList.name}</Text>
              <Text style={styles.gameProgress}>Pregunta {questionsAnswered + 1}</Text>
            </View>
            <View style={styles.spacer} />
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>Puntos: {score}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
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
    paddingTop: 20, // Reducido de 30 a 20
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  // ... resto de tus estilos sin cambios
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  selectorInHeader: {
  marginTop: 25,
  marginHorizontal: 0,
},
selectorScroll: {
  paddingHorizontal: 5,
},
warningText: {
  textAlign: 'center',
  color: '#e74c3c',
  fontSize: 14,
  marginTop: 10,
  fontStyle: 'italic',
},
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectorContent: {
    paddingRight: 20,
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
    marginTop: 3,
  },
  listOptionCountSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  listOptionContainer: {
  marginRight: 10,
  alignItems: 'center',
},
  selectedListInfo: {
    backgroundColor: '#f0f8ff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    alignItems: 'center',
  },
  selectedListTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  selectedListName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  selectedListDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  startGameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
   startGameButton: {
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
  startGameButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startGameButtonOld: {
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startGameButtonDisabledOld: {
    backgroundColor: '#95a5a6',
  },
  startGameButtonTextOld: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
  backgroundColor: '#3498db',
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},
backButtonText: {
  color: 'white',
  fontSize: 28,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: -10,
},
gameInfo: {
  position: 'absolute',
  left: 0,
  right: 0,
  alignItems: 'center',
},
spacer: {
  width: 40,
},
  gameListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  gameProgress: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statsContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
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