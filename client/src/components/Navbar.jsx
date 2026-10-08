import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">FinSight</div>

      <div className="nav-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Transactions
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Analytics
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Budgets
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          AI Assistant
        </NavLink>

        <NavLink
          to="/import-transactions"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Import
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Profile
        </NavLink>

        <button onClick={handleLogout} className="btn-logout-small">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;