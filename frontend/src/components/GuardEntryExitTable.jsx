import React from 'react';

const GuardEntryExitTable = ({ logs, loading, formatLogTime }) => {
  // Helper to determine row styling based on flags
  const getRowStyle = (log) => {
    const flags = log.flags || {};
    
    // Red background for late entries (after 8PM without gatepass OR after gatepass time)
    if (flags.lateAfter8PM || flags.lateGatepass) {
      return { backgroundColor: '#fee2e2' }; // Light red
    }
    
    // Yellow background for students still outside after 8PM or past gatepass time
    if (flags.outsideAfter8PM || flags.outsidePastGatepass) {
      return { backgroundColor: '#fef3c7' }; // Light yellow/amber
    }
    
    return {};
  };

  // Get status indicator for the row
  const getStatusIndicator = (log) => {
    const flags = log.flags || {};
    const indicators = [];
    
    if (flags.lateAfter8PM) {
      indicators.push({ icon: '🔴', title: 'Late entry after 8 PM' });
    }
    if (flags.lateGatepass) {
      const type = flags.isOutstationGatepass ? 'Outstation' : 'Local';
      indicators.push({ icon: '⚠️', title: `Late entry - Past ${type} gatepass return time` });
    }
    if (flags.outsideAfter8PM) {
      indicators.push({ icon: '⭐', title: 'Still outside after 8 PM (No gatepass)' });
    }
    if (flags.outsidePastGatepass) {
      const type = flags.isOutstationGatepass ? 'Outstation' : 'Local';
      indicators.push({ icon: '🚨', title: `Still outside - Past ${type} gatepass return time` });
    }
    
    return indicators;
  };

  return (
    <div className="guard-logs-table-wrapper">
      <div className="guard-logs-table-scroll">
        <table className="guard-logs-table">
          <thead>
            <tr>
              <th>SR NO.</th>
              <th>STATUS</th>
              <th>NAME</th>
              <th>ROLL NO.</th>
              <th>ROOM NO.</th>
              <th>CONTACT</th>
              <th>PLACE</th>
              <th>PURPOSE</th>
              <th>GATE PASS</th>
              <th>TIME OUT</th>
              <th>TIME IN</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11}>Loading...</td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={11}>No records</td>
              </tr>
            )}
            {!loading &&
              logs.map((l, idx) => {
                const s = l.student || {};
                const timeOut = formatLogTime(l.exitStatusTime);
                const timeIn = formatLogTime(l.entryStatusTime);
                const hasEntry = l.entryOutcome === 'approved';
                const statusIndicators = getStatusIndicator(l);

                return (
                  <tr key={l._id} style={getRowStyle(l)}>
                    <td>{idx + 1}</td>
                    <td style={{ textAlign: 'center', fontSize: '16px' }}>
                      {statusIndicators.length > 0 ? (
                        statusIndicators.map((ind, i) => (
                          <span key={i} title={ind.title} style={{ cursor: 'help', marginRight: '2px' }}>
                            {ind.icon}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#10b981' }}>✓</span>
                      )}
                    </td>
                    <td>{s.name || '-'}</td>
                    <td>{s.rollnumber || '-'}</td>
                    <td>{s.roomNumber || '-'}</td>
                    <td>{s.contactNumber || '-'}</td>
                    <td>{l.place || '-'}</td>
                    <td>{l.purpose || '-'}</td>
                    <td>{l.gatePassNo || '--'}</td>
                    <td>{timeOut || '-'}</td>
                    <td className={hasEntry ? 'guard-logs-time-in-done' : ''}>
                      {hasEntry ? timeIn : '--'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuardEntryExitTable;
