import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { formatDateBR } from '../../utils/dateUtils';

interface Property {
  id: string;
  name: string;
  owner_name?: string;
  owner_phone?: string;
  cidade?: string;
  property_type: string;
  has_cameras?: boolean;
  has_wifi?: boolean;
  created_at: string;
  cadastro_date?: string;
  equipe?: string;
  crpm?: string;
  batalhao?: string;
  cia?: string;
}

interface PDFPropertyReportProps {
  properties: Property[];
  reportTitle: string;
  dateRange: string;
  userInfo: {
    name: string;
    patente: string;
    crpm: string;
    batalhao: string;
    cia: string;
  };
  battalionBadgeUrl?: string;
  pmprBadgeUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 30,
    lineHeight: 1.5,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    textTransform: 'uppercase',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 5,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    paddingVertical: 5,
    fontSize: 9,
  },
  col1: {
    width: '20%',
    paddingRight: 5,
  },
  col2: {
    width: '15%',
    paddingRight: 5,
  },
  col3: {
    width: '25%',
    paddingRight: 5,
  },
  col4: {
    width: '25%',
    paddingRight: 5,
  },
  col5: {
    width: '15%',
    paddingRight: 5,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 10,
    marginBottom: 2,
  },
});

export const PDFPropertyReport: React.FC<PDFPropertyReportProps> = ({
  properties,
  reportTitle,
  dateRange,
  userInfo,
  battalionBadgeUrl,
  pmprBadgeUrl,
}) => {
  const totalProperties = properties.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader 
          userCrpm={userInfo.crpm}
          userBatalhao={userInfo.batalhao}
          userCia={userInfo.cia}
          battalionBadgeUrl={battalionBadgeUrl}
          pmprBadgeUrl={pmprBadgeUrl}
        />

        <Text style={styles.reportTitle}>
          {reportTitle} – {dateRange}
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>RESUMO ESTATÍSTICO</Text>
          <Text style={styles.summaryText}>Total de propriedades cadastradas: {totalProperties}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Município</Text>
            <Text style={styles.col2}>Data Cadastro</Text>
            <Text style={styles.col3}>Proprietário</Text>
            <Text style={styles.col4}>Propriedade</Text>
            <Text style={styles.col5}>Equipe</Text>
          </View>
          
          {properties.map((property, index) => {
            const cadastroDate = property.cadastro_date || property.created_at;
            const formattedDate = formatDateBR(cadastroDate);
            
            return (
              <View key={property.id} style={styles.tableRow}>
                <Text style={styles.col1}>{property.cidade || 'N/A'}</Text>
                <Text style={styles.col2}>{formattedDate}</Text>
                <Text style={styles.col3}>{property.owner_name || 'N/A'}</Text>
                <Text style={styles.col4}>{property.name}</Text>
                <Text style={styles.col5}>{property.equipe || 'N/A'}</Text>
              </View>
            );
          })}
        </View>

        <PDFFooter 
          userName={userInfo.name}
          userPatente={userInfo.patente}
          userBatalhao={userInfo.batalhao}
        />
      </Page>
    </Document>
  );
};