

const ResultItems = ({ searchResult, searchQuery }: any) => (
  <div data-testid="result-items">
    <div>Results for: {searchQuery}</div>
    <div>Found {searchResult?.items?.length || 0} items</div>
  </div>
);

export default ResultItems;
