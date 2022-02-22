import React from 'react';
import ReactDOM from 'react-dom';
import PowerBar from './components/PowerBar';

import './assets/css/styles.scss';

async function main() {
	while (!Spicetify?.Platform || !Spicetify?.CosmosAsync) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	const container = document.createElement('div');
	container.style.display = 'block';
	ReactDOM.render(<PowerBar/>, container);

	document.body.appendChild(container);
}

export default main;
