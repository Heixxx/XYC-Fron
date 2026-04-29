import { Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import News from './pages/News';
import Forex from './pages/Forex';
import Crypto from './pages/Crypto';
import Search from './pages/Search';
import Whales from './pages/Whales';
import Signals from './pages/Signals';
import Vision from './pages/Vision';
import LogicLab from './pages/LogicLab';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/news" element={<News />} />
        <Route path="/forex" element={<Forex />} />
        <Route path="/crypto" element={<Crypto />} />
        <Route path="/search" element={<Search />} />
        <Route path="/whales" element={<Whales />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/logic-lab" element={<LogicLab />} />
      </Route>
    </Routes>
  );
}
