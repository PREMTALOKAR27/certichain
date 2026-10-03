import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BookOpenCheck,
  CircleHelp,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function AppShell() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const admin = user?.role === "ADMIN";
  const links = admin
    ? [
        { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/certificates", label: "Certificates", icon: FileCheck2 },
        { to: "/admin/issue", label: "Issue certificate", icon: Plus },
        { to: "/admin/blockchain", label: "Chain activity", icon: ShieldCheck },
      ]
    : [
        { to: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
        { to: "/student/certificates", label: "My certificates", icon: FileCheck2 },
      ];

  function logout() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-frame">
      <button className="mobile-menu button-icon" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"}>
        {open ? <X size={19} /> : <Menu size={19} />}
      </button>
      {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <NavLink to={admin ? "/admin/dashboard" : "/student/dashboard"} className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark"><BadgeCheck size={21} strokeWidth={2.2} /></span>
          <span><strong>CERTICHAIN</strong><small>ACADEMIC RECORDS</small></span>
        </NavLink>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="nav-caption nav-caption-lower">RESOURCES</div>
        <nav className="side-nav" aria-label="Resources">
          <NavLink to="/verify" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <ShieldCheck size={18} strokeWidth={1.8} /><span>Public verifier</span>
          </NavLink>
          <NavLink to="/about-blockchain" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <BookOpenCheck size={18} strokeWidth={1.8} /><span>About blockchain</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><CircleHelp size={16} /><span>Local network<br /><strong>Hardhat · Chain 31337</strong></span></div>
          <div className="profile-row">
            <div className="avatar">{user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div className="profile-copy"><strong>{user?.name}</strong><small>{admin ? "Administrator" : "Student"}</small></div>
            <button className="button-icon logout-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>Portal</span><span className="breadcrumb-dot">/</span><strong>{admin ? "Institution" : "Student"} workspace</strong></div>
          <div className="network-pill"><span className="network-dot" />LOCAL NETWORK</div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}