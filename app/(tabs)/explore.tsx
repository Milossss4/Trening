import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchGrupy = async () => {
    const wynik = await db.getAllAsync<Grupa>('SELECT * FROM grupy_treningowe');
    setGrupy(wynik);
  }

  const addGrupa = async (nazwa: string) => {
    await db.runAsync('INSERT INTO grupy_treningowe (nazwa) VALUES (?)', nazwa);
    await fetchGrupy();
  }

  const deleteGrupa = async (id: number) => {
    await db.runAsync('DELETE FROM grupy_treningowe WHERE id = ?', id);
    await fetchGrupy();
  }

  const handleSave = async () => {
    if (nazwaGrupy.trim() === '') return;

    await addGrupa(nazwaGrupy);
    setNazwaGrupy('');
    setModalVisible(false);
  }

  const handleLongPress = (id: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }
  }

  const handlePress = (grupa: Grupa) => {
    if (isSelectionMode) {
      if (selectedIds.includes(grupa.id)) {
        const newSelected = selectedIds.filter(itemId => itemId !== grupa.id);
        setSelectedIds(newSelected);

        if (newSelected.length === 0) {
          setIsSelectionMode(false);
        }
      } else {
        setSelectedIds([...selectedIds, grupa.id]);
      }
    } else {
      router.push({
        pathname: '/grupa/[id]',
        params: { id: grupa.id, nazwa: grupa.nazwa }
      } as any);
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length > 0) {
      const placeholders = selectedIds.map(() => '?').join(',');
      await db.runAsync(`DELETE FROM grupy_treningowe WHERE id IN (${placeholders})`, selectedIds);
      await fetchGrupy();
    }
    setIsSelectionMode(false);
    setSelectedIds([]);
  }

  useEffect(() => {
    fetchGrupy();
  }, []);


  return (
    <View style={styles.container}>
      <View style={styles.tittleView}>
        <Text style={styles.tittleText}>Lista grup ćwiczeniowych:</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={grupy.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 20 }}
      >
        {grupy.map((grupa) => {
          const isSelected = selectedIds.includes(grupa.id);

          return (
            <TouchableOpacity
              key={grupa.id}
              style={[styles.groupCard, isSelected && styles.groupCardSelected]}
              activeOpacity={0.7}
              onPress={() => handlePress(grupa)}
              onLongPress={() => handleLongPress(grupa.id)}
            >
              <Text style={styles.groupNameText}>{grupa.nazwa}</Text>

              {isSelectionMode ? (
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isSelected ? "#E63946" : "#888"}
                />
              ) : (
                <Ionicons name="chevron-forward" size={24} color="#89CFF0" />
              )}
            </TouchableOpacity>
          );
        })}

        {grupy.length === 0 && (
          <Text style={styles.emptyListText}>
            Dodaj grupę klikając +
          </Text>
        )}
      </ScrollView>

      {isSelectionMode ? (
        <View style={styles.selectionActionsView}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedIds([]);
            }}
          >
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteMultiButton}
            onPress={handleDeleteSelected}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.deleteMultiButtonText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.addButtonView}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={30} color="black" />
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: '#121417',
    paddingTop: 60,
  },
  tittleView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tittleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  groupCardSelected: {
    borderColor: '#E63946',
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
  },
  groupNameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyListText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 20,
  },

  addButtonView: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    backgroundColor: '#89CFF0',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#89CFF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  selectionActionsView: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    justifyContent: 'center',
    borderColor: 'white',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteMultiButton: {
    backgroundColor: '#E63946',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
  },
  deleteMultiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
});