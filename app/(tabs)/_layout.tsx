import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Powiadomienia',
          tabBarIcon: ({ focused }) => focused ? <Ionicons name="notifications" size={24} color="#89CFF0" /> : <Ionicons name="notifications-outline" size={24} color="white" />,
          tabBarActiveTintColor: '#89CFF0',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Historia',
          tabBarIcon: ({ focused }) => focused ? <Ionicons name="calendar-clear" size={24} color="#89CFF0" /> : <Ionicons name="calendar-clear-outline" size={24} color="white" />,
          tabBarActiveTintColor: '#89CFF0',
        }}
      />
    </Tabs>
  );
}
