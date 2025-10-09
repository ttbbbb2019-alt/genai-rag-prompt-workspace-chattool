const SemanticSearchDetails = ({ searchResults }: any) => (
  <div data-testid="semantic-search-details">
    <div>Search Details</div>
    <div>Engine: {searchResults?.engine || 'opensearch'}</div>
  </div>
);

export default SemanticSearchDetails;
