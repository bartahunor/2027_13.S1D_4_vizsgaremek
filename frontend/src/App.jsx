import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './components/pages/HomePage'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import TaskSelection from './components/pages/TaskType'
import ResultPage from './components/pages/ResultPage'
import PracticePage from './components/pages/Practice'
import ProfilePage from './components/pages/Profile'
import ForgotPasswordPage from './components/pages/PasswordRecoveryPage'
import ResetPasswordPage from './components/pages/NewPasswordPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            <Route
              path="/tasktype"
              element={
                <ProtectedRoute>
                  <TaskSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice"
              element={
                <ProtectedRoute>
                  <PracticePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/result"
              element={
                <ProtectedRoute>
                  <ResultPage/>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}