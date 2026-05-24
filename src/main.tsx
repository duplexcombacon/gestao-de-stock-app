import { StrictMode, Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Componente ErrorBoundary para capturar e mostrar erros sem quebrar toda a aplicação
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Atualiza o estado para que o próximo render mostre a interface de fallback (erro)
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>
          <h2>Oops, ocorreu um erro!</h2>
          <pre style={{ fontSize: '12px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ fontSize: '10px', overflowX: 'auto', marginTop: '10px', color: '#666' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    // Renderiza a aplicação normalmente se não houver erros
    return this.props.children;
  }
}

// Ponto de entrada da aplicação React, onde é montada no DOM
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
