import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

interface PDFFooterProps {
  userName: string;
  userPatente: string;
  userBatalhao: string;
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  signature: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  unit: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
  },
});

export const PDFFooter: React.FC<PDFFooterProps> = ({ 
  userName, 
  userPatente, 
  userBatalhao 
}) => {
  return (
    <View style={styles.footer}>
      <Text style={styles.signature}>
        {userPatente} {userName}
      </Text>
      <Text style={styles.unit}>
        PATRULHA RURAL COMUNITÁRIA - {userBatalhao}
      </Text>
    </View>
  );
};