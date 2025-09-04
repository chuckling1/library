import React from 'react'
import { Link, useLocation } from 'react-router-dom'

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
          <h1>My Book Library</h1>
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
          <Link to="/books/new" className="btn-primary">
            Add Book
          </Link>
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