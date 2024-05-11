import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeout } from '../fetchTimeout.js';

import config from '../config.js';

const fetchAPILog = async () => {
	const response = await fetchTimeout(`http://${config.API_SERVER}/api/api_log`);
	if (!response.ok) {
		throw new Error('Network response was not ok')
	}
	return response.json();
}

function DisplayAPILog() {
	const { data, error, isLoading } = useQuery({ queryKey: ['apiLog'], queryFn: fetchAPILog });

	if (isLoading) {
		return <div>Loading...</div>;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}

	// Split data into lines and map each line to a div with a <br/> tag
	return (
		<div>
			{data.map((line, index) => (
				<React.Fragment key={index}>
					{line}
					<br />
				</React.Fragment>
			))}
		</div>
	);
}

function APILog() {
	return (
		<Container>
			<h2 style={{ paddingTop: '20px', paddingBottom: '20px' }}>API Log</h2>
			<Card style={{ height: 'calc(80vh - 100px)', overflowY: 'auto' }}>
				<Card.Body>
					<Card.Text>
						<code><DisplayAPILog /></code>
					</Card.Text>
				</Card.Body>
			</Card>

		</Container>
	);
}


export default APILog;

