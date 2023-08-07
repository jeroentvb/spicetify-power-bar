import React from 'react';
import ReactDOM from 'react-dom/client';
import PowerBar from './components/PowerBar';

import './assets/css/styles.scss';

async function main() {
   while (!Spicetify?.Platform || !Spicetify?.CosmosAsync || !Spicetify?.Player) {
      await new Promise(resolve => setTimeout(resolve, 100));
   }

   const container = document.createElement('div');
   container.style.display = 'block';
   const root = ReactDOM.createRoot(container);
   root.render(<PowerBar/>);

   document.body.appendChild(container);
}

export default main;
