import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Root } from './components/Root.js';

createRoot(document.getElementById('root')).render(React.createElement(Root));
