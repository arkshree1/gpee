import React from 'react';

const GuardEntryExitTable = ({ logs, loading, formatLogTime }) => {
  return (
    <div className="guard-logs-table-wrapper">
      <div className="guard-logs-table-scroll">
        <table className="guard-logs-table">
          <thead>
            <tr>
              <th>SR NO.</th>
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
                <td colSpan={10}>Loading...</td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={10}>No records</td>
              </tr>
            )}
            {!loading &&
              logs.map((l, idx) => {
                const s = l.student || {};
                const timeOut = formatLogTime(l.exitStatusTime);
                const timeIn = formatLogTime(l.entryStatusTime);
                const hasEntry = l.entryOutcome === 'approved';

                return (
                  <tr key={l._id}>
                    <td>{idx + 1}</td>
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
