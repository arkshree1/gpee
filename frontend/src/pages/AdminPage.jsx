import React, { useEffect, useState } from 'react';
import { getAdminLogs, getAdminOverview, getAdminUsers } from '../api/api';
import '../styles/student.css';

const AdminPage = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [o, u, l] = await Promise.all([getAdminOverview(), getAdminUsers(), getAdminLogs()]);
    setOverview(o.data);
    setUsers(u.data.users || []);
    setLogs(l.data.logs || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="guard-shell">
      <div className="guard-topbar">
        <div className="guard-title">Admin Dashboard</div>
        <div className="guard-actions">
          <button className="guard-btn ghost" type="button" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="guard-grid">
        <div className="guard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Overview</h3>
          <div className="guard-card-body">
            {loading && <div>Loading...</div>}
            {!loading && overview && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className="guard-pill">Students: {overview.students}</span>
                <span className="guard-pill">Guards: {overview.guards}</span>
                <span className="guard-pill">Admins: {overview.admins}</span>
                <span className="guard-pill">Outside: {overview.outsideCount}</span>
                <span className="guard-pill">Pending: {overview.pendingCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="guard-card">
          <h3>Users</h3>
          <div className="guard-card-body">
            <table className="guard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Presence</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 50).map((u) => (
                  <tr key={u._id}>
                    <td>
                      {u.name}
                      <div className="guard-muted">{u.rollnumber}</div>
                    </td>
                    <td>{u.role}</td>
                    <td>{u.presence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="guard-card">
          <h3>Logs</h3>
          <div className="guard-card-body">
            <table className="guard-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Action</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 100).map((l) => (
                  <tr key={l._id}>
                    <td>{new Date(l.decidedAt).toLocaleString()}</td>
                    <td>
                      {l.student?.name}
                      <div className="guard-muted">{l.student?.rollnumber}</div>
                    </td>
                    <td>{l.direction}</td>
                    <td>
                      <span className="guard-pill">{l.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
