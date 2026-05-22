import React from 'react';
import DecisionsTable from '../components/DecisionsTable';
import RefreshButton from '../components/RefreshButton';

export default function Decisions({ decisions, loading, onRefresh }) {
  return (
    <div className="page">
      <div className="page-actions">
        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>
      <DecisionsTable decisions={decisions} />
    </div>
  );
}

