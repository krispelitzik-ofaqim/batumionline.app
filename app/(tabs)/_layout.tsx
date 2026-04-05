import React, { useContext } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import HeaderBar from '../../components/HeaderBar';

const MAX_MOBILE = 375;

export default function TabLayout() {
  const { dark } = useContext(ThemeContext);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const outerBg = dark ? Colors.TEXT : Colors.BACKGROUND;

  return (
    <View style={{ flex: 1, backgroundColor: outerBg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: outerBg }}>
        <View style={{ maxWidth: MAX_MOBILE, width: '100%', alignSelf: 'center' }}>
          <HeaderBar />
        </View>
      </SafeAreaView>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: dark ? Colors.ACCENT : Colors.PRIMARY,
          tabBarInactiveTintColor: dark ? Colors.SECONDARY : Colors.PRIMARY + '60',
          tabBarShowLabel: !isMobile,
          tabBarStyle: {
            backgroundColor: dark ? Colors.TEXT : Colors.WHITE,
            borderTopColor: dark ? Colors.PRIMARY + '40' : Colors.SECONDARY + '20',
            height: isMobile ? 50 : 60,
            paddingBottom: isMobile ? 4 : 8,
            paddingTop: 4,
            flexDirection: 'row-reverse',
            maxWidth: MAX_MOBILE,
            width: '100%',
            alignSelf: 'center',
          },
          sceneStyle: {
            backgroundColor: outerBg,
            maxWidth: MAX_MOBILE,
            width: '100%',
            alignSelf: 'center',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'בית',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={isMobile ? 22 : size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'מפה',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={isMobile ? 22 : size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'מידע',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={isMobile ? 22 : size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: 'צור קשר',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble" size={isMobile ? 22 : size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
