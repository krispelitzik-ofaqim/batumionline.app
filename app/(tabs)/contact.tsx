import React, { useEffect } from 'react';
import { View, Linking } from 'react-native';
import { Colors } from '../../constants/colors';

const WHATSAPP = '972502844867';

export default function ContactScreen() {
  useEffect(() => {
    Linking.openURL(`https://wa.me/${WHATSAPP}`);
  }, []);
  return <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }} />;
}
