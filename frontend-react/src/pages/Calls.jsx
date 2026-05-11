import CallsTable from '../components/CallsTable';
import RefreshButton from '../components/RefreshButton';

export default function Calls({ calls, loading, onRefresh }) {
  return (
    <div className="page">
      <div className="page-actions">
        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>
      <CallsTable calls={calls} />
    </div>
  );
}
