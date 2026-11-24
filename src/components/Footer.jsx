import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-foot">
      <div className="wrap foot-in">
        <span className="foot-brand"><img src="/logo.png" alt="" />© {new Date().getFullYear()} Check My Citation</span>
        <nav className="foot-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </div>
    </footer>
  )
}
