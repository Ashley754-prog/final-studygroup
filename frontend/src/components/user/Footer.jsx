import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();

  const footerLink = (path, label) => (
    <Link
      to={path}
      className={`${location.pathname === path ? "text-gold" : "text-white hover:text-gold"}`}
    >
      {label}
    </Link>
  );

  return (
    <footer className="w-full bg-maroon text-white py-4 shadow-md fixed bottom-0 left-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-center gap-10 text-sm">
        {footerLink("/about", "About")}
        {footerLink("/contacts", "Contacts")}
        {footerLink("/terms", "Terms of Service")}
        {footerLink("/policies", "Policies")}
      </div>
    </footer>
  );
}
