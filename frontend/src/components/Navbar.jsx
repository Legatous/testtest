import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">&#9776;</span> Bindery &amp; Co.
      </Link>
      <nav className="nav-links">
        <Link to="/">Catalog</Link>
        {user && !isAdmin && <Link to="/orders">My Orders</Link>}
        {isAdmin && <Link to="/admin/books">Manage Books</Link>}
        {isAdmin && <Link to="/admin/orders">All Orders</Link>}
      </nav>
      <div className="nav-right">
        {user ? (
          <>
            <span className="user-pill">
              {user.name} <em>({user.role})</em>
            </span>
            <button className="btn ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">
              Log in
            </Link>
            <Link className="btn" to="/register">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
