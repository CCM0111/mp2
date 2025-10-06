import React from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { PokemonProvider } from './pokemonData';
import { DetailPage, GalleryPage, ListPage, NotFoundPage } from './pages';
import './App.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="app-layout">
    <header className="app-header">
      <div className="brand">
        <h1>Pokemon App</h1>
      </div>
      <nav className="main-nav">
        <NavLink to="/list" end>
          List
        </NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
      </nav>
    </header>
    <main className="app-main">{children}</main>
  </div>
);

const App: React.FC = () => (
  <PokemonProvider>
    <BrowserRouter basename="/mp2">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/pokemon/:idOrName" element={<DetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </PokemonProvider>
);

export default App;
