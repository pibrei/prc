import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

interface PDFHeaderProps {
  userCrpm: string;
  userBatalhao: string;
  userCia: string;
  battalionBadgeUrl?: string;
  pmprBadgeUrl?: string;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});

export const PDFHeader: React.FC<PDFHeaderProps> = ({ 
  userCrpm, 
  userBatalhao, 
  userCia,
  battalionBadgeUrl,
  pmprBadgeUrl 
}) => {
  return (
    <View style={styles.header}>
      {/* Brasão PMPR */}
      <View>
        {pmprBadgeUrl ? (
          <Image 
            style={styles.logo} 
            src={pmprBadgeUrl} 
          />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 8, color: '#666' }}>PMPR</Text>
          </View>
        )}
      </View>

      {/* Texto Central */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>POLÍCIA MILITAR DO PARANÁ</Text>
        <Text style={styles.subtitle}>{userCrpm} - {userBatalhao} - {userCia}</Text>
        <Text style={styles.subtitle}>PATRULHA RURAL COMUNITÁRIA</Text>
      </View>

      {/* Brasão do Batalhão */}
      <View>
        {battalionBadgeUrl ? (
          <Image 
            style={styles.logo} 
            src={battalionBadgeUrl} 
          />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 8, color: '#666' }}>BPM</Text>
          </View>
        )}
      </View>
    </View>
  );
};