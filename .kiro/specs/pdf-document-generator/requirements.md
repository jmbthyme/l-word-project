# Requirements Document

## Introduction

This application generates two distinct PDF document views from local JSON data and images. The system will create a Word Cloud view for visual word representation and a Dossier view for comprehensive data presentation. The application will be built using React, Vite, Tailwind CSS, and Google Fonts to provide a modern, responsive interface for document generation and export.

## Requirements

### Requirement 1

**User Story:** As a user, I want to load a data folder containing JSON and images so that I can generate PDF documents with my content.

#### Acceptance Criteria

1. WHEN the user selects a data folder THEN the system SHALL validate it contains at least one JSON file and may contain image files
2. WHEN the system processes JSON data THEN it SHALL validate the schema contains required person and word fields, with description and picture fields being optional
3. WHEN the system processes image files THEN it SHALL validate they are in supported formats (PNG, JPG, JPEG)
4. WHEN a picture field exists in JSON data THEN the system SHALL verify the referenced image file exists in the same data folder
5. WHEN description or picture fields are missing from JSON data THEN the system SHALL continue processing without errors
6. IF the JSON data is invalid THEN the system SHALL display clear error messages indicating what required fields (person, word) are missing or incorrect
7. IF a picture field references a non-existent image THEN the system SHALL display a warning but continue processing
8. WHEN valid data is loaded THEN the system SHALL enable the document generation options

### Requirement 2

**User Story:** As a user, I want to generate a Word Cloud PDF so that I can visualize all the words in an artistic format.

#### Acceptance Criteria

1. WHEN the user selects Word Cloud generation THEN the system SHALL create a single-page view containing only the "word" data
2. WHEN rendering the Word Cloud THEN each word SHALL have a different font size based on frequency or importance
3. WHEN rendering the Word Cloud THEN each word SHALL have a different font weight (normal, bold, etc.)
4. WHEN rendering the Word Cloud THEN each word SHALL use a different Google Font family
5. WHEN the Word Cloud is complete THEN the system SHALL provide an option to export as PDF with selected size and orientation
6. WHEN exporting Word Cloud THEN the system SHALL generate a high-quality PDF optimized for printing at the selected paper size

### Requirement 3

**User Story:** As a user, I want to generate a Dossier PDF so that I can view all data in a comprehensive document format.

#### Acceptance Criteria

1. WHEN the user selects Dossier generation THEN the system SHALL create a multi-page document with all data items
2. WHEN rendering each data item THEN the system SHALL display person and word as formatted text
3. WHEN a description field exists and is not empty THEN the system SHALL display it as additional formatted text below the person and word
4. WHEN a description field is missing or empty THEN the system SHALL continue rendering without the description section
5. WHEN a picture field exists and the corresponding image is available THEN the system SHALL render the image inline with the text
6. WHEN a picture field exists but the corresponding image is missing THEN the system SHALL display a placeholder or skip the image without breaking the layout
7. WHEN a picture field is missing THEN the system SHALL continue rendering without the image section
8. WHEN formatting text content THEN the system SHALL use consistent typography and spacing for readability
9. WHEN the document exceeds one page THEN the system SHALL automatically paginate content appropriately on A4 portrait pages
10. WHEN exporting Dossier THEN the system SHALL generate a high-quality PDF optimized for A4 printing with proper page breaks

### Requirement 4

**User Story:** As a user, I want to configure print settings so that I can generate PDFs optimized for printing.

#### Acceptance Criteria

1. WHEN generating a Word Cloud THEN the user SHALL be able to select PDF size (A4 or A3)
2. WHEN generating a Word Cloud THEN the user SHALL be able to select orientation (portrait or landscape)
3. WHEN generating a Dossier THEN the system SHALL automatically use A4 size in portrait orientation
4. WHEN displaying previews THEN the system SHALL show accurate representations of the final printed output
5. WHEN configuring print settings THEN the system SHALL provide clear options for paper size and orientation selection

### Requirement 5

**User Story:** As a user, I want a clean interface and fast PDF generation so that I can efficiently create print-ready documents.

#### Acceptance Criteria

1. WHEN using the application THEN the interface SHALL provide clear controls for data loading and document generation
2. WHEN using Tailwind CSS THEN the system SHALL provide consistent styling across all interface components
3. WHEN loading Google Fonts THEN the system SHALL efficiently load only the required font families for the Word Cloud
4. WHEN generating PDFs THEN the system SHALL complete the process within reasonable time limits (under 10 seconds for typical datasets)
5. WHEN using Vite THEN the system SHALL provide fast development iteration and optimized production builds