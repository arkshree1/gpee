// Jest manual mock for react-router-dom to avoid ESM interop issues in CRA/Jest.
// We keep it minimal for our test suite; runtime app uses the real library.

const React = require('react');

const MemoryRouter = ({ children }) => React.createElement(React.Fragment, null, children);

module.exports = {
  // Components
  BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  MemoryRouter,
  Routes: ({ children }) => React.createElement(React.Fragment, null, children),
  Route: ({ element }) => element || null,
  Navigate: () => null,

  // Hooks
  useNavigate: () => () => {},

  // passthrough helpers
  Outlet: ({ children }) => children || null,
};
