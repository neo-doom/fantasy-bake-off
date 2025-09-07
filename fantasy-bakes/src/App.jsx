import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicView from './components/PublicView';
import AdminView from './components/AdminView';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
