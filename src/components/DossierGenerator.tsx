import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PersonData } from '../types';

interface DossierGeneratorProps {
  data: PersonData[];
  images: Map<string, string>;
}

/**
 * DossierGenerator creates a multi-page PDF document with all person data
 * formatted for A4 portrait printing with automatic pagination
 */
export const DossierGenerator: React.FC<DossierGeneratorProps> = ({ data, images }) => {
  // Calculate items per page based on content size
  const ITEMS_PER_PAGE = 2; // Conservative estimate for A4 portrait with images and descriptions
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Split data into pages
  const getPageData = (pageIndex: number): PersonData[] => {
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
    return data.slice(startIndex, endIndex);
  };

  // Render a single person data item
  const renderPersonItem = (person: PersonData, index: number) => {
    const imageData = images.get(person.picture);
    
    return (
      <View key={`person-${index}`} style={styles.personItem}>
        {/* Person Name Header */}
        <Text style={styles.personName}>{person.person}</Text>
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Left Column - Text Content */}
          <View style={styles.textColumn}>
            {/* Word Section */}
            <View style={styles.wordSection}>
              <Text style={styles.sectionLabel}>Word:</Text>
              <Text style={styles.wordText}>{person.word}</Text>
            </View>
            
            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{person.description}</Text>
            </View>
          </View>
          
          {/* Right Column - Image */}
          {imageData && (
            <View style={styles.imageColumn}>
              <Image
                src={imageData}
                style={styles.personImage}
              />
            </View>
          )}
        </View>
        
        {/* Separator Line */}
        <View style={styles.separator} />
      </View>
    );
  };

  // Render a single page
  const renderPage = (pageIndex: number) => {
    const pageData = getPageData(pageIndex);
    
    return (
      <Page key={`page-${pageIndex}`} size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dossier</Text>
          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} of {totalPages}
          </Text>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {pageData.map((person, index) => 
            renderPersonItem(person, pageIndex * ITEMS_PER_PAGE + index)
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    );
  };

  return (
    <Document>
      {Array.from({ length: totalPages }, (_, pageIndex) => renderPage(pageIndex))}
    </Document>
  );
};

// Styles for the Dossier PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  pageNumber: {
    fontSize: 12,
    color: '#666666',
  },
  
  // Content styles
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  
  // Person item styles
  personItem: {
    marginBottom: 25,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  
  // Content layout
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textColumn: {
    flex: 1,
    paddingRight: 20,
  },
  imageColumn: {
    width: 120,
    alignItems: 'center',
  },
  
  // Text sections
  wordSection: {
    marginBottom: 12,
  },
  descriptionSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 4,
  },
  descriptionText: {
    fontSize: 11,
    lineHeight: 1.4,
    color: '#4b5563',
    textAlign: 'justify',
  },
  
  // Image styles
  personImage: {
    width: 100,
    height: 100,
    objectFit: 'cover',
    borderRadius: 8,
    border: '2px solid #e5e7eb',
  },
  
  // Separator
  separator: {
    marginTop: 15,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  
  // Footer styles
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },
});

export default DossierGenerator;