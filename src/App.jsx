import React from 'react';
import Ventas from './Ventas.jsx';
import HistorialVentas from './HistorialVentas.jsx';

function App() {
  return (
    <div className="app-ventas">
      <header>
        <h1>TapStudio</h1>
        <p>Sistema de gestión de tienda</p>
      </header>

      <main>
        <Ventas />
        <HistorialVentas />
      </main>
    </div>
  );
}

export default App;
