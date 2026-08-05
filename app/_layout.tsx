import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

export const unstable_settings = {
  anchor: '(tabs)',
};

async function openDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS grupy_treningowe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nazwa TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS cwiczenia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grupa_id INTEGER,
      nazwa TEXT NOT NULL,
      serie INTEGER,
      powtorzenia INTEGER,
      FOREIGN KEY (grupa_id) REFERENCES grupy_treningowe (id) ON DELETE CASCADE
    );
  `)
}


export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="treningi.db" onInit={openDatabase}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="grupa/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SQLiteProvider >
  );
}
