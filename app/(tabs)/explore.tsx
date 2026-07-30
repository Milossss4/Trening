import Ionicons from '@expo/vector-icons/Ionicons';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Grupa {
  id: number;
  nazwa: string;
}

export default function History() {
  const db = useSQLiteContext();
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nazwaGrupy, setNazwaGrupy] = useState('');

  const fetchGrupy = async () => {
    const wynik = await db.getAllAsync<Grupa>('SELECT * FROM grupy_treningowe');
    setGrupy(wynik);
  }

  const addGrupa = async (nazwa: string) => {
    await db.runAsync('INSERT INTO grupy_treningowe (nazwa) VALUES (?)', nazwa);
    await fetchGrupy();
  }

  const handleSave = async () => {
    if (nazwaGrupy.trim() === '') return; 
    
    await addGrupa(nazwaGrupy);
    setNazwaGrupy(''); 
    setModalVisible(false);
  }

  useEffect(() => {
    fetchGrupy();
  }, []);


  return (
    <View style={styles.container}>
      <View style={styles.tittleView}>
        <Text style={styles.tittleText}>Lista grup ćwiczeniowych:</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Przechodzimy pętlą po wszystkich grupach */}
        {grupy.map((grupa) => (
          <TouchableOpacity 
            key={grupa.id} 
            style={styles.groupCard}
            activeOpacity={0.7}
            // W przyszłości dodasz tu nawigację do ćwiczeń w tej grupie
            onPress={() => console.log('Kliknięto grupę:', grupa.nazwa)} 
          >
            <Text style={styles.groupNameText}>{grupa.nazwa}</Text>
            
            {/* Strzałka sugerująca, że w środku jest coś więcej */}
            <Ionicons name="chevron-forward" size={24} color="#89CFF0" />
          </TouchableOpacity>
        ))}
        
        {/* Komunikat, gdy lista jest pusta */}
        {grupy.length === 0 && (
          <Text style={styles.emptyListText}>
            Brak grup treningowych. Dodaj pierwszą klikając +
          </Text>
        )}
      </ScrollView>

      <View style={styles.addButtonView}>
        <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="black" />
        </TouchableOpacity>
      </View>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setNazwaGrupy(''); 
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nazwa nowej grupy</Text>
            <TextInput
              style={styles.textInput}
              value={nazwaGrupy}
              onChangeText={setNazwaGrupy}
              autoFocus={true} 
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setNazwaGrupy('');
                }}
              >
                <Text style={styles.closeButtonText}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Zapisz</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121417', // Ciemne tło główne
    paddingTop: 60,
  },
  
  tittleView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Zmienione z center, żeby tytuł był z lewej strony
    paddingHorizontal: 20, // Wyrównanie do lewej krawędzi kafelków
    marginBottom: 20, // Odstęp od listy
  },

  tittleText: {
    fontSize: 28, // Lekko powiększony, żeby wyglądał jak główny nagłówek
    fontWeight: 'bold',
    color: 'white',
  },

  addButtonView: {
    paddingHorizontal: 20,
    paddingTop: 20, // Zmniejszyłem trochę górny padding
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  addButton: {
    backgroundColor: '#89CFF0',
    width: 60, // Lekko powiększony przycisk
    height: 60,
    borderRadius: 30, // Idealne koło
    alignItems: 'center',
    justifyContent: 'center',
    // Dodanie lekkiego cienia do przycisku dodawania (dla głębi)
    elevation: 5, 
    shadowColor: '#89CFF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  scrollView: {
    flex: 1, // BARDZO WAŻNE: pozwala liście zająć całe wolne miejsce
    backgroundColor: 'transparent', // Zmienione z 'white', żeby nie psuło ciemnego tła
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },

  modalContent: {
    width: '85%', 
    backgroundColor: '#2A2E35', 
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },

  modalTitle: {
    marginBottom: 20,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  textInput: {
    width: '100%',
    backgroundColor: '#1E2126', 
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3F444D', 
    marginBottom: 25, 
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  closeButton: {
    flex: 1, 
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E63946',
  },

  closeButtonText: {
    color: '#E63946',
    fontWeight: 'bold',
  },

  saveButton: {
    flex: 1, 
    backgroundColor: '#89CFF0',
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#121417',
    fontWeight: 'bold',
  },

  groupCard: {
    backgroundColor: '#2A2E35', 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15, 
    borderRadius: 15,
  },

  groupNameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  emptyListText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});
