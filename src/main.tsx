import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ProjectsPage } from './pages/ProjectsPage.tsx'
import { TokensPage } from './pages/TokensPage.tsx'
import { EconomyPage } from './pages/EconomyPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<ProjectsPage />} />
          <Route path="tokens" element={<TokensPage />} />
          <Route path="economy" element={<EconomyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
