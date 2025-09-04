import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GenreFilterProvider } from './contexts/GenreFilterContext'
import Layout from './components/Layout'
import BookListPage from './pages/BookListPage'
import BookFormPage from './pages/BookFormPage'
import StatsPage from './pages/StatsPage'
import './App.scss'

const App: React.FC = () => {
  return (
    <GenreFilterProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/books" replace />} />
            <Route path="/books" element={<BookListPage />} />
            <Route path="/books/new" element={<BookFormPage />} />
            <Route path="/books/:id/edit" element={<BookFormPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </Layout>
      </Router>
    </GenreFilterProvider>
  )
}

export default App