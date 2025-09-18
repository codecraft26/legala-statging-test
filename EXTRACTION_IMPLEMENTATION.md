# Extraction Feature Implementation

This document provides an overview of the comprehensive extraction functionality implemented for the Legal AI Dashboard.

## Overview

The extraction feature allows users to upload documents or select from existing documents and extract structured data using AI. The implementation follows the API endpoints specified in the README and uses TanStack Query for state management.

## Architecture

### API Layer (`/src/lib/extraction-api.ts`)

- **Purpose**: Centralized API service functions for all extraction endpoints
- **Features**:
  - Type-safe API calls with TypeScript interfaces
  - Support for file uploads (multipart/form-data)
  - Document-based extraction from saved documents
  - Full CRUD operations for extractions and results
  - Error handling and response typing

### React Query Hooks (`/src/hooks/use-extraction.ts`)

- **Purpose**: TanStack Query hooks for efficient data fetching and caching
- **Features**:
  - Automatic caching and invalidation
  - Real-time polling for processing extractions
  - Optimistic updates for better UX
  - Error handling and loading states
  - Query key management for cache consistency

## Components

### Main Extract Page (`/src/app/extract/page.tsx`)

- **Purpose**: Primary extraction workflow interface
- **Features**:
  - Step-by-step wizard (Upload → Configure → Results)
  - Integration with TanStack Query hooks
  - Real-time status polling for processing extractions
  - Recent extractions sidebar
  - Responsive design with modern UI

### FileUpload Component (`/src/app/extract/components/FileUpload.tsx`)

- **Purpose**: File selection and import interface
- **Features**:
  - Drag and drop file upload
  - Import from existing documents with folder navigation
  - File type validation and size display
  - Multiple file selection
  - Document browser with breadcrumb navigation

### TagInput Component (`/src/app/extract/components/TagInput.tsx`)

- **Purpose**: Extraction configuration interface
- **Features**:
  - Extraction naming (required)
  - Tag management with add/remove functionality
  - Custom extraction instructions
  - Agent naming (optional)
  - Form validation and user feedback

### DataView Component (`/src/app/extract/components/DataView.tsx`)

- **Purpose**: Results display and export interface
- **Features**:
  - Tabular data display with dynamic columns
  - CSV and JSON export functionality
  - Copy to clipboard functionality
  - Responsive table design
  - Empty state handling

## Pages

### Extractions List (`/src/app/extract/list/page.tsx`)

- **Purpose**: Manage and browse all extractions
- **Features**:
  - Search and filter functionality
  - Status-based filtering (Pending, Processing, Completed, Failed)
  - Sortable columns (Name, Date, Status)
  - Real-time status updates
  - Bulk operations support
  - Delete functionality with confirmation

### Extraction Detail (`/src/app/extract/[id]/page.tsx`)

- **Purpose**: Detailed view of individual extractions
- **Features**:
  - Tabbed interface (Overview, Results, Metadata)
  - Real-time status updates with polling
  - Export functionality (CSV, JSON)
  - Copy to clipboard
  - Delete functionality
  - User and usage information display

## UI Components

Created missing UI components to support the extraction interface:

### Input Component (`/src/components/ui/input.tsx`)

- Standard form input with consistent styling
- Supports all HTML input attributes
- Integrated with form validation

### Label Component (`/src/components/ui/label.tsx`)

- Accessible form labels using Radix UI
- Consistent typography and styling
- Proper association with form controls

### Textarea Component (`/src/components/ui/textarea.tsx`)

- Multi-line text input component
- Consistent styling with other form elements
- Resizable and accessible

## API Integration

The implementation follows the extraction API endpoints as specified:

### Supported Endpoints

1. **POST /extraction/files** - Extract from uploaded files
2. **POST /extraction/documents** - Extract from saved documents
3. **GET /extraction** - List all extractions for workspace
4. **GET /extraction/detail** - Get detailed extraction info
5. **GET /extraction/result/detail** - Get specific result details
6. **DELETE /extraction** - Remove extraction agent
7. **DELETE /extraction/result** - Remove specific result

### Request/Response Handling

- Proper FormData handling for file uploads
- Type-safe request and response interfaces
- Error handling with user-friendly messages
- Loading states and progress indicators

## Features

### Real-time Updates

- Automatic polling for processing extractions
- Status updates without page refresh
- Progress indicators during processing

### Data Export

- CSV export with dynamic column headers
- JSON export with structured data
- Copy to clipboard functionality
- Bulk export from list views

### User Experience

- Step-by-step wizard interface
- Drag and drop file uploads
- Responsive design for all screen sizes
- Loading states and error handling
- Confirmation dialogs for destructive actions

### Search and Filtering

- Text search across extraction names and tags
- Status-based filtering
- Sortable columns
- Real-time filtering updates

## State Management

### TanStack Query Integration

- Centralized cache management
- Automatic background refetching
- Optimistic updates for better UX
- Query invalidation on mutations
- Error boundaries and retry logic

### Local State

- Form state management
- UI state (modals, tabs, etc.)
- File upload progress
- Temporary user interactions

## Error Handling

### API Errors

- Comprehensive error messages
- Retry mechanisms
- Fallback UI states
- User-friendly error displays

### Validation

- Form validation with real-time feedback
- File type and size validation
- Required field validation
- Custom validation rules

## Performance Optimizations

### Caching

- Intelligent query caching with TanStack Query
- Background data updates
- Stale-while-revalidate pattern

### File Handling

- Efficient file processing
- Progress indicators for uploads
- Chunked upload support (if needed)

### UI Performance

- Virtualized tables for large datasets
- Lazy loading of components
- Optimized re-renders

## Security Considerations

### File Uploads

- File type validation
- Size limitations
- Secure multipart handling

### API Security

- Bearer token authentication
- Request validation
- Error message sanitization

## Future Enhancements

### Planned Features

1. Batch processing for multiple extractions
2. Extraction templates and presets
3. Advanced filtering and search
4. Extraction scheduling
5. Webhook notifications
6. Advanced export formats (Excel, PDF)

### Technical Improvements

1. WebSocket integration for real-time updates
2. Progressive file upload
3. Advanced caching strategies
4. Performance monitoring
5. A/B testing framework

## Testing Strategy

### Unit Tests

- Component testing with React Testing Library
- API function testing
- Hook testing with React Query Test Utils

### Integration Tests

- End-to-end workflow testing
- API integration testing
- File upload testing

### Performance Tests

- Load testing for file uploads
- Memory usage monitoring
- Render performance testing

## Deployment Considerations

### Environment Configuration

- API endpoint configuration
- File size limits
- Timeout settings
- Error reporting setup

### Monitoring

- Error tracking
- Performance monitoring
- User analytics
- API usage metrics

This implementation provides a robust, scalable, and user-friendly extraction feature that integrates seamlessly with the existing Legal AI Dashboard while following modern React and TypeScript best practices.
