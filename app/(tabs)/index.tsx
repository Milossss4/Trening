import { View, StyleSheet, Text, TouchableOpacity, Platform, Linking } from 'react-native';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@trening_notification_settings';

const DAYS = [
  {id: 1, short: 'Pon', day: 'Poniedziałek'},
  {id: 2, short: 'Wt', day: 'Wtorek'},
  {id: 3, short: 'Śr', day: 'Środa'},
  {id: 4, short: 'Czw', day: 'Czwartek'},
  {id: 5, short: 'Pt', day: 'Piątek'},
  {id: 6, short: 'Sob', day: 'Sobota'},
  {id: 7, short: 'Nd', day: 'Niedziela'}
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen() {
  const [selectedDayId, setSelectedDayIds] = useState<number[]>([]);
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isErrorToast, setIsErrorToast] = useState(false);

  const toggleDay = (dayId: number) => {
    setSelectedDayIds(prevSelectedDayId => 
      prevSelectedDayId.includes(dayId)
        ? prevSelectedDayId.filter(id => id !== dayId)
        : [...prevSelectedDayId, dayId]
    );
  };

  useEffect(() => {
    loadSettings();
  }, []);


  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const { days, hour, minute } = JSON.parse(storedSettings);
        const restoredTime = new Date();
        restoredTime.setHours(hour);
        restoredTime.setMinutes(minute);
        setTime(restoredTime);
        setSelectedDayIds(days);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania ustawień:', error);
    }
  };
  
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const showToast = (message: string, isError: boolean = false) => {
    setToastMessage(message);
    setIsErrorToast(isError);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const scheduleNotification = async () => {
    if (selectedDayId.length === 0) {
      showToast('Wybierz chociaż 1 dzień tygodnia', true);
      return;
    }
  
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Brak zgody na powiadomienia w ustawieniach', true);
        return;
      }

      if (Platform.OS === 'android') {
        const androidPermissions = await Notifications.getPermissionsAsync();

        if ((androidPermissions as any)?.canScheduleExactAlarms === false) {
          showToast('Aplikacja wymaga uprawnienia do ustawiania dokładnych alarmów. Włącz je w ustawieniach.', true);
          Linking.openSettings();
          return;
        }
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Przypomnienia o treningu',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#89CFF0',
          sound: 'default',
        });
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      const hour = time.getHours();
      const minute = time.getMinutes();

      for (const dayId of selectedDayId) {
        const expoDay = dayId === 7 ? 1 : dayId + 1;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Czas na trening!',
            body: 'Pora zacząć ćwiczenia!',
            sound: 'default', 
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: 'default',
            weekday: expoDay,
            hour: hour,
            minute: minute,
          },
        });
      }
      
      showToast('Powiadomienia zostały pomyślnie ustawione');

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({days: selectedDayId, hour, minute}));
      
    } catch (error) {
      console.error('Błąd powiadomień:', error);
      showToast('Wystąpił błąd podczas ustawiania. Sprawdź uprawnienia telefonu.', true);
    }
  }

  const cancelNotifications = async() => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSelectedDayIds([]);
    showToast('Wszystkie powiadomienia zostały anulowane');
  } 

  return (
    <View style={styles.viewStyle}>
      <View style={styles.headerContainer}>
        <Text style={styles.weekText}>Kiedy chcesz ćwiczyć?</Text>
      </View>

      <View style={styles.calendarView}>
        {DAYS.map(day => {
          const isSelected = selectedDayId.includes(day.id);

          return(
            <TouchableOpacity 
              key={day.id}
              activeOpacity={0.7}
              onPress={() => toggleDay(day.id)}
              style={[styles.dayStyle, isSelected && styles.selectedDayStyle]}
            >
              <Text style={[styles.daytextStyle, isSelected && styles.selectedDayText]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={styles.hourText}>Wybierz godzinę przypomnienia:</Text>
      </View>

      <View style={styles.timePickerContainer}>
        <TouchableOpacity 
          style={styles.timeButton} 
          activeOpacity={0.7} 
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.timeValueText}>{formattedTime}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View style={styles.bottomContainer}>
        {toastMessage && (
          <View style={[styles.toastContainer, isErrorToast && styles.toastErrorContainer]}>
            <Text style={[styles.toastText, isErrorToast && styles.toastErrorText]}>
              {toastMessage}
            </Text>
          </View>
        )}

        <View style={styles.setNotificationView}>
          <TouchableOpacity 
            onPress={scheduleNotification} 
            style={styles.setNotificationButton} 
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Ustaw powiadomienie</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton} 
            activeOpacity={0.8}
            onPress={cancelNotifications} 
          >
            <Text style={styles.cancelButtonText}>Wyłącz powiadomienia</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  viewStyle: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: '#121417', 
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  weekText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hourText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calendarView: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  dayStyle: {
    backgroundColor: '#2A2E35', 
    width: 44,
    height: 44,
    borderRadius: 22, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayStyle: {
    backgroundColor: '#89CFF0',
    shadowColor: '#89CFF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  daytextStyle: {
    color: '#8A8F99',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#121417', 
    fontWeight: 'bold',
  },
  timePickerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timeButton: {
    backgroundColor: '#2A2E35',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3F49',
  },
  timeValueText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  bottomContainer: {
    marginTop: 'auto',
    width: '100%',
  },
  
  toastContainer: {
    backgroundColor: 'rgba(137, 207, 240, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#89CFF0',
    alignItems: 'center',
  },
  toastErrorContainer: {
    backgroundColor: 'rgba(230, 57, 70, 0.15)', 
    borderColor: '#E63946',
  },
  toastText: {
    color: '#89CFF0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  toastErrorText: {
    color: '#E63946',
  },

  setNotificationView: {
    width: '100%',
    gap: 12,
  },
  setNotificationButton: {
    height: 56,
    width: '100%', 
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#89CFF0',
  },
  buttonText: {
    color: '#121417',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 56,
    width: '100%', 
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E63946', 
  },
  cancelButtonText: {
    color: '#E63946', 
    fontSize: 16,
    fontWeight: 'bold',
  }
});