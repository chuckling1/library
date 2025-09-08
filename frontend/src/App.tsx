import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GenreFilterProvider } from './contexts/GenreFilterContext';
import Layout from './components/Layout';
import BookListPage from './pages/BookListPage';
import BookFormPage from './pages/BookFormPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.scss';

const App: React.FC = (): React.JSX.Element => {
  return (
    <AuthProvider>
      <GenreFilterProvider>
        <Router>
          <Routes>
            {/* Authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes wrapped in Layout */}
            <Route path="/" element={<Navigate to="/books" replace />} />
            <Route
              path="/books"
              element={
                <Layout>
                  <BookListPage />
                </Layout>
              }
            />
            <Route
              path="/books/new"
              element={
                <Layout>
                  <BookFormPage />
                </Layout>
              }
            />
            <Route
              path="/books/:id/edit"
              element={
                <Layout>
                  <BookFormPage />
                </Layout>
              }
            />
            <Route
              path="/stats"
              element={
                <Layout>
                  <StatsPage />
                </Layout>
              }
            />
          </Routes>
        </Router>
      </GenreFilterProvider>
    </AuthProvider>
  );
};

export default App;
