import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


interface cwiczenie {
    id: number;
    nazwa: string;
    serie: number;
    powtorzenia: number;
}


export default function GroupDetails() {
    const db = useSQLiteContext();
    const [cwiczenia, setCwiczenia] = useState<cwiczenie[]>([]);
    const [nazwaCwiczenia, setNazwaCwiczenia] = useState('');
    const { id, nazwa } = useLocalSearchParams<{ id: string; nazwa: string }>();
    const [modalVisible, setModalVisible] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [groupSerie, setGroupSerie] = useState<number>(0);
    const [powtorzeniaCwiczenia, setPowtorzeniaCwiczenia] = useState('');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editCwiczenieId, setEditCwiczenieId] = useState<number | null>(null);
    const [editPowtorzenia, setEditPowtorzenia] = useState('');


    
    const addCwiczenie = async (nazwa: string, powtorzenia: number) => {
        await db.runAsync('INSERT INTO cwiczenia (grupa_id,nazwa,powtorzenia) VALUES (?, ?, ? )',
            Number(id),
            nazwa,
            powtorzenia,
        );
        await fetchCwiczenia();
    }

    const fetchGroupDetails = async () => {
        const wynik = await db.getFirstAsync<{ serie: number }>(
            'SELECT serie FROM grupy_treningowe WHERE id = ?',
            Number(id)
        );
        if (wynik) {
            setGroupSerie(wynik.serie);
        }
    }

    const changeGroupSerie = async (zmiana: number) => {
        const nowaWartosc = Math.max(0, groupSerie + zmiana);

        setGroupSerie(nowaWartosc);

        await db.runAsync(
            'UPDATE grupy_treningowe SET serie = ? WHERE id = ?',
            nowaWartosc,
            Number(id)
        );
    }

    const fetchCwiczenia = async () => {
        const wynik = await db.getAllAsync<cwiczenie>('SELECT * FROM cwiczenia where grupa_id = ?', Number(id));
        setCwiczenia(wynik);
    }

    const handleAddCwiczenie = async () => {
        if (nazwaCwiczenia.trim() === '') return;

        const powt = parseInt(powtorzeniaCwiczenia) || 0;

        await addCwiczenie(nazwaCwiczenia, powt);

        setNazwaCwiczenia('');
        setPowtorzeniaCwiczenia('');
        setModalVisible(false);
    }

    const handleSaveEdit = async () => {
        if (editCwiczenieId === null) return;
        
        const nowePowt = parseInt(editPowtorzenia) || 0;
        await db.runAsync('UPDATE cwiczenia SET powtorzenia = ? WHERE id = ?', nowePowt, editCwiczenieId);
        
        await fetchCwiczenia();
        setEditModalVisible(false);
        setEditCwiczenieId(null);
    }

    const handleLongPress = (cwiczenieId: number) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedIds([cwiczenieId]);
        }
    }

    const handlePress = (cwiczenie: cwiczenie) => {
        if (isSelectionMode) {
            if (selectedIds.includes(cwiczenie.id)) {
                const newSelected = selectedIds.filter(itemId => itemId !== cwiczenie.id);
                setSelectedIds(newSelected);
                if (newSelected.length === 0) {
                    setIsSelectionMode(false);
                }
            } else {
                setSelectedIds([...selectedIds, cwiczenie.id]);
            }
        } else {
            setEditCwiczenieId(cwiczenie.id);
            setEditPowtorzenia(cwiczenie.powtorzenia.toString());
            setEditModalVisible(true);
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.length > 0) {
            const placeholders = selectedIds.map(() => '?').join(',');
            await db.runAsync(`DELETE FROM cwiczenia WHERE id IN (${placeholders})`, selectedIds);
            await fetchCwiczenia();
        }
        setIsSelectionMode(false);
        setSelectedIds([]);
    }

    useEffect(() => {
        fetchCwiczenia();
        fetchGroupDetails();
    }, []);


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {isSelectionMode ? `${selectedIds.length} zaznaczono` : nazwa}
                </Text>

                {isSelectionMode ? (
                    <View style={{ width: 30 }} />
                ) : (
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle-outline" size={30} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.groupSettingsPanel}>
                <Text style={styles.groupSettingsText}>Serie dla tej grupy:</Text>

                <View style={styles.counterContainer}>
                    <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => changeGroupSerie(-1)}
                    >
                        <Ionicons name="remove" size={24} color="#E63946" />
                    </TouchableOpacity>

                    <Text style={styles.counterText}>{groupSerie}</Text>

                    <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => changeGroupSerie(1)}
                    >
                        <Ionicons name="add" size={24} color="#89CFF0" />
                    </TouchableOpacity>
                </View>
            </View>


            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={cwiczenia.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 20 }}
            >
                {cwiczenia.map((cwiczenie) => {
                    const isSelected = selectedIds.includes(cwiczenie.id);

                    return (
                        <TouchableOpacity
                            key={cwiczenie.id}
                            style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
                            activeOpacity={0.7}
                            onPress={() => handlePress(cwiczenie)}
                            onLongPress={() => handleLongPress(cwiczenie.id)}
                        >
                            <Text style={styles.exerciseNameText} numberOfLines={1}>
                                {cwiczenie.nazwa}
                            </Text>

                        
                            <View style={styles.exerciseRightSide}>
                                <View style={styles.repsBadge}>
                                    <Text style={styles.repsText}>{cwiczenie.powtorzenia} powt.</Text>
                                </View>

                                {isSelectionMode && (
                                    <Ionicons
                                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                        size={24}
                                        color={isSelected ? "#E63946" : "#888"}
                                        style={styles.selectionIcon}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {cwiczenia.length === 0 && (
                    <Text style={styles.emptyListText}>
                        Brak ćwiczeń w tej grupie. Dodaj pierwsze klikając +
                    </Text>
                )}
            </ScrollView>

            {isSelectionMode && (
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
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    setNazwaCwiczenia('');
                    setPowtorzeniaCwiczenia('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Dodaj ćwiczenie</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Nazwa ćwiczenia (np. Pompki)"
                            placeholderTextColor="#888"
                            value={nazwaCwiczenia}
                            onChangeText={setNazwaCwiczenia}
                            autoFocus={true}
                        />

                        <TextInput
                            style={styles.textInput}
                            placeholder="Ilość powtórzeń (np. 12)"
                            placeholderTextColor="#888"
                            value={powtorzeniaCwiczenia}
                            onChangeText={setPowtorzeniaCwiczenia}
                            keyboardType="numeric" 
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNazwaCwiczenia('');
                                    setPowtorzeniaCwiczenia(''); 
                                }}
                            >
                                <Text style={styles.closeButtonText}>Anuluj</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddCwiczenie}
                            >
                                <Text style={styles.saveButtonText}>Zapisz</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edytuj powtórzenia</Text>
                        
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ilość powtórzeń"
                            placeholderTextColor="#888"
                            value={editPowtorzenia}
                            onChangeText={setEditPowtorzenia}
                            keyboardType="numeric"
                            autoFocus={true}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Anuluj</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    groupSettingsPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E2126',
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#2A2E35',
    },
    groupSettingsText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2E35',
        borderRadius: 10,
    },
    counterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    counterText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        minWidth: 40, 
        textAlign: 'center',
    },
    exerciseCard: {
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
    exerciseCardSelected: {
        borderColor: '#E63946',
        backgroundColor: 'rgba(230, 57, 70, 0.1)',
    },
    exerciseNameText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        flexShrink: 1,
        marginRight: 15,
    },
    emptyListText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 16,
        paddingHorizontal: 20,
    },
    selectionActionsView: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 30,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        justifyContent: 'center',
        backgroundColor: '#2A2E35',
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
        paddingHorizontal: 25,
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
        marginBottom: 15,
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

    exerciseRightSide: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    repsBadge: {
        backgroundColor: '#1E2126',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    repsText: {
        color: '#89CFF0',
        fontSize: 14,
        fontWeight: 'bold',
    },
    selectionIcon: {
        marginLeft: 15,
    },
});