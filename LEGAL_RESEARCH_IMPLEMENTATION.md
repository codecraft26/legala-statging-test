# Legal Research Implementation

This document describes the comprehensive Legal Research AI implementation for the legalai-dashboard project.

## Overview

The Legal Research AI system provides access to Supreme Court, High Court, and District Court case search functionality, along with AI-powered legal knowledge search capabilities. The implementation maintains the same UI structure as the original legal-ai-ui project while integrating seamlessly with the legalai-dashboard.

## Features

### Court Search Functionality

1. **Supreme Court Search**
   - Search by party name with filters for party type, year, and status
   - Real-time case details retrieval
   - Follow/unfollow cases functionality

2. **High Court Search**
   - Search by advocate name or filing number
   - Configurable court codes and state codes
   - Advanced filtering options

3. **District Court Search**
   - Search by party name across different districts
   - Support for multiple establishment codes
   - Year-based filtering

4. **Legal Knowledge Search**
   - AI-powered search using IndiaKanoon database
   - Perplexity-based web search integration
   - Rich formatting and case law analysis

### Case Management

- Follow/unfollow cases across all court types
- Centralized followed cases management
- Export functionality for tracked cases

## File Structure

```
src/
├── app/research/
│   ├── page.tsx                          # Main research page with sidebar navigation
│   ├── components/
│   │   ├── SupremeCourtSearch.tsx        # Supreme Court search component
│   │   ├── HighCourtSearch.tsx           # High Court search component
│   │   ├── DistrictCourtSearch.tsx       # District Court search component
│   │   └── KnowledgeSearch.tsx           # AI-powered knowledge search
│   └── utils/
│       ├── districtId.ts                 # District court data
│       ├── hcBench.ts                    # High court bench data
│       ├── catBenches.ts                 # CAT bench data
│       └── ncltBenches.ts                # NCLT bench data
├── lib/
│   └── research-api.ts                   # API client classes for all court types
└── hooks/
    └── use-research.ts                   # Custom hook for research API calls
```

## API Integration

### API Endpoints

The implementation integrates with the following API endpoints:

#### Supreme Court APIs

- `POST /api/research/supreme-court/search-party` - Search by party name
- `POST /api/research/supreme-court/search-diary` - Search by diary number
- `POST /api/research/supreme-court/case-detail` - Get case details

#### High Court APIs

- `POST /api/research/high-court/search-advocate` - Search by advocate
- `POST /api/research/high-court/search-filing-number` - Search by filing number
- `POST /api/research/high-court/case-detail` - Get case details

#### District Court APIs

- `POST /api/research/district-court/search-party` - Search by party name
- `POST /api/research/district-court/case-detail` - Get case details

#### Research Management APIs

- `POST /api/research/follow` - Follow research/cases
- `POST /api/research/unfollow` - Unfollow research/cases
- `GET /api/research/followed` - Get followed research/cases

### API Client Classes

The implementation includes TypeScript API client classes:

- `SupremeCourtAPI` - Supreme Court operations
- `HighCourtAPI` - High Court operations
- `DistrictCourtAPI` - District Court operations
- `ResearchAPI` - Research management operations

### Custom Hook

The `useResearchAPI` hook provides a clean interface for components to interact with the research APIs, including:

- Loading state management
- Error handling
- Automatic token management
- Type-safe API calls

## UI Components

### Main Research Page (`page.tsx`)

- Sidebar navigation with court selection
- Dynamic content rendering based on selected court
- Consistent header with contextual information
- Responsive design matching the dashboard theme

### Search Components

All search components maintain consistent UI patterns:

- Form-based search interfaces
- Real-time search with loading states
- Tabular results with sorting and filtering
- Follow/unfollow functionality
- Case details modals
- Error handling and user feedback

### Knowledge Search Component

- AI-powered legal research interface
- Dual-tab results (IndiaKanoon + Web Search)
- Rich text formatting for legal content
- Case law analysis and precedent display

## Data Management

### Court Data

Utility files provide comprehensive data for:

- District court identifiers and names
- High court bench information
- CAT and NCLT bench data
- State and court codes

### State Management

- Local state management for search results
- Followed cases tracking
- Search filters and parameters
- Modal states and loading indicators

## Integration with Dashboard

The research functionality is fully integrated with the main dashboard:

1. **Navigation**: Research link in the main sidebar (`/research`)
2. **Authentication**: Uses existing auth system and token management
3. **Styling**: Consistent with dashboard theme and components
4. **Responsive Design**: Mobile-friendly and adaptive layouts

## Usage Examples

### Basic Search

```typescript
// Using the custom hook
const { searchSupremeCourtByParty, loading, error } = useResearchAPI();

// Perform search
const results = await searchSupremeCourtByParty({
  party_type: "any",
  party_name: "Tanishk",
  year: 2022,
  party_status: "P",
});
```

### Following Cases

```typescript
// Follow a case
await followResearch({
  court: "Supreme_Court",
  followed: caseData,
  workspaceId: "current-workspace",
});

// Get followed cases
const followedCases = await getFollowedResearch(workspaceId, "Supreme_Court");
```

## Error Handling

The implementation includes comprehensive error handling:

- Network error management
- API response validation
- User-friendly error messages
- Automatic retry mechanisms
- Graceful degradation

## Security

- JWT token-based authentication
- Secure API calls with proper headers
- Input validation and sanitization
- CORS compliance
- Rate limiting awareness

## Performance Optimizations

- Lazy loading of components
- Debounced search inputs
- Efficient state updates
- Memoized components where appropriate
- Optimized API calls

## Future Enhancements

Potential areas for future development:

1. Advanced filtering and sorting options
2. Case law analytics and insights
3. Document export in multiple formats
4. Real-time case status updates
5. Collaborative research features
6. Integration with external legal databases
7. Mobile app support

## Dependencies

Key dependencies used in the implementation:

- React 18+ for component architecture
- Next.js for routing and SSR
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons
- Custom hooks for API management

## Testing

The implementation includes:

- Component unit tests
- API integration tests
- Error handling tests
- User interaction tests
- Accessibility compliance tests

## Deployment Notes

For production deployment:

1. Configure API base URLs in environment variables
2. Set up proper CORS policies
3. Implement rate limiting
4. Configure authentication tokens
5. Set up monitoring and logging
6. Optimize bundle size and performance

## Support

For technical support or questions about the implementation:

1. Check the API documentation for endpoint specifications
2. Review component props and interfaces
3. Test API endpoints using the provided examples
4. Verify authentication and token management
5. Check browser console for error messages

---

**Implementation Date**: September 18, 2025  
**Version**: 1.0  
**Author**: Legal AI Development Team
