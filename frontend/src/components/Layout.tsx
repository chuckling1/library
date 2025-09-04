import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../images/logo.png'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  
  const isActive = (path: string): boolean => {
    return location.pathname === path
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img src={logo} alt="Library Logo" className="header-logo" />
            <h1>My Book Library</h1>
          </div>
          <nav className="nav">
            <Link 
              to="/books" 
              className={isActive('/books') ? 'active' : ''}
            >
              Books
            </Link>
            <Link 
              to="/stats" 
              className={isActive('/stats') ? 'active' : ''}
            >
              Statistics
            </Link>
          </nav>
          <div className="header-spacer"></div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p className="attribution">
            Book data provided by{' '}
            <a
              href="https://openlibrary.org"
              target="_blank"
              rel="noopener noreferrer"
              className="attribution-link"
            >
              Open Library
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout