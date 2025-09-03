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
        <Link to="/books/new" className="btn btn-primary">
          Add Book
        </Link>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
}

export default Layout