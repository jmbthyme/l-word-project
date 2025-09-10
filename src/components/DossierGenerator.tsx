import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PersonData } from '../types';

interface DossierConfig {
  paperSize: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  itemsPerPage: number;
  highQuality: boolean;
}

interface DossierGeneratorProps {
  data: PersonData[];
  images: Map<string, string>;
  config?: DossierConfig;
}

/**
 * DossierGenerator creates a multi-page PDF document with all person data
 * formatted for A4 portrait printing with automatic pagination and optimized content flow
 */
export const DossierGenerator: React.FC<DossierGeneratorProps> = ({ 
  data, 
  images, 
  config = {
    paperSize: 'A4',
    orientation: 'portrait',
    itemsPerPage: 2,
    highQuality: true
  }
}) => {
  // Use configuration for items per page calculation
  const ITEMS_PER_PAGE = config.itemsPerPage;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Split data into pages
  const getPageData = (pageIndex: number): PersonData[] => {
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
    return data.slice(startIndex, endIndex);
  };

  // Render a single person data item with improved layout and error handling
  const renderPersonItem = (person: PersonData, index: number, isLastOnPage: boolean) => {
    const imageData = person.picture ? images.get(person.picture) : undefined;
    
    // Handle missing or invalid image data gracefully
    const hasValidImage = imageData && imageData.startsWith('data:image/');
    const hasDescription = person.description && person.description.trim().length > 0;
    
    return (
      <View key={`person-${index}`} style={[
        styles.personItem,
        isLastOnPage && styles.lastPersonItem
      ]}>
        {/* Person Name Header */}
        <Text style={styles.personName}>{person.person}</Text>
        
        {/* Content Container with improved layout */}
        <View style={styles.contentContainer}>
          {/* Left Column - Text Content */}
          <View style={[
            styles.textColumn,
            (!person.picture || !hasValidImage) && styles.textColumnFullWidth
          ]}>
            {/* Word Section */}
            <View style={styles.wordSection}>
              <Text style={styles.sectionLabel}>Word:</Text>
              <Text style={styles.wordText}>{person.word}</Text>
            </View>
            
            {/* Description Section with improved text handling - only if description exists */}
            {hasDescription && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>Description:</Text>
                <Text style={styles.descriptionText}>
                  {person.description!.length > 500 
                    ? `${person.description!.substring(0, 500)}...` 
                    : person.description
                  }
                </Text>
              </View>
            )}
          </View>
          
          {/* Right Column - Image with fallback - only if picture field exists */}
          {person.picture && (
            hasValidImage ? (
              <View style={styles.imageColumn}>
                <Image
                  src={imageData}
                  style={styles.personImage}
                />
              </View>
            ) : (
              <View style={styles.imageColumn}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {person.picture}
                  </Text>
                  <Text style={styles.imagePlaceholderSubtext}>
                    Image not found
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
        
        {/* Separator Line - only if not last item on page */}
        {!isLastOnPage && <View style={styles.separator} />}
      </View>
    );
  };

  // Render a single page with improved content flow and page breaks
  const renderPage = (pageIndex: number) => {
    const pageData = getPageData(pageIndex);
    
    return (
      <Page 
        key={`page-${pageIndex}`} 
        size={config.paperSize} 
        orientation={config.orientation} 
        style={styles.page}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dossier</Text>
          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} of {totalPages}
          </Text>
        </View>
        
        {/* Content with proper spacing */}
        <View style={styles.content}>
          {pageData.map((person, index) => {
            const globalIndex = pageIndex * ITEMS_PER_PAGE + index;
            const isLastOnPage = index === pageData.length - 1;
            
            return renderPersonItem(person, globalIndex, isLastOnPage);
          })}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString()} • Total entries: {data.length}
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

// Styles for the Dossier PDF with improved layout and print optimization
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
    minHeight: 600, // Ensure minimum content height
  },
  
  // Person item styles
  personItem: {
    marginBottom: 25,
    paddingBottom: 15,
  },
  lastPersonItem: {
    marginBottom: 0, // Remove bottom margin for last item on page
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
    minHeight: 120, // Ensure consistent item height
  },
  textColumn: {
    flex: 1,
    paddingRight: 20,
  },
  textColumnFullWidth: {
    paddingRight: 0, // Remove padding when no image
  },
  imageColumn: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 11,
    lineHeight: 1.5,
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
  
  // Image placeholder styles
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '2px solid #e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  imagePlaceholderText: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
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
    textAlign: 'center',
  },
});

export default DossierGenerator;