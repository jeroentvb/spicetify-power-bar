import React from 'react';
import ReactDOM from 'react-dom';
import PowerBar from './components/PowerBar';

import './assets/css/styles.scss';

async function main() {
   while (!Spicetify?.Platform || !Spicetify?.CosmosAsync || !Spicetify?.Player) {
      await new Promise(resolve => setTimeout(resolve, 100));
   }

   const container = document.createElement('div');
   container.style.display = 'block';
   // Spotify still uses React v17, so this rule doesn't apply yet
   // eslint-disable-next-line react/no-deprecated
   ReactDOM.render(<PowerBar/>, container);

   document.body.appendChild(container);
}

export default main;
