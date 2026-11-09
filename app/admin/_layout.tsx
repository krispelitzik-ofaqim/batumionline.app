import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import '../../constants/adminKey';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.BACKGROUND },
      }}
    />
  );
}
