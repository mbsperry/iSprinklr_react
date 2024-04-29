import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeout } from '../fetchTimeout.js';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import config from '../config.js';

const fetchSchedule = async () => {
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/get_schedule`);
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json();
}

const fetchSprinklerList = async () => {
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers`);
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json();
}

function ParseSchedule() {
    const { data, error, isLoading } = useQuery({queryKey: ['schedules'], queryFn: fetchSchedule});
    const { data: sprinklerList, error: sprinklerListError, isLoading: isLoadingSprinklerList } = useQuery({queryKey: ['sprinklers'], queryFn: fetchSprinklerList});

    // Match the zone ID to the zone name
    const matchedSchedule = data.map((schedule) => {
        const matchedSprinkler = sprinklerList.find((sprinkler) => sprinkler.zone === schedule.zone);
        return { ...schedule, name: matchedSprinkler.name };
    });
    return matchedSchedule;
}

    // Build a form to edit the schedule
    // The form should have a row for each sprinkler zone. 
    // Each row will have a non-editable text field for the sprinkler name, a ToggleButtonGroup to select the day of the week (M, Tu, W, Th, F, Sa, Su, EO, none), and an input field for duration
    // The form will have a submit button to save the changes
    // The form will have a cancel button to discard the changes
    // The form will be built using React Bootstrap
  


const ScheduleForm = () => {
    const daysOfWeek = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su', 'EO', 'none'];
    const [schedule, setSchedule] = useState(ParseSchedule());

    const defaultDays = (days) => {
        // Convert a string with day abbreviations to an array of day abbreviations
        // Example: "MWSa" => ['M', 'W', 'Sa']
        return days.split('').map(day => daysOfWeek.find(d => d.includes(day)));
    };

    const handleDayChange = (zone, value) => {
        const newSchedule = schedule.map(s => {
            if (s.zone === zone) {
                return { ...s, day: value };
            }
            return s;
        });
        setSchedule(newSchedule);
    };

    const handleDurationChange = (zone, event) => {
        const newSchedule = schedule.map(s => {
            if (s.zone === zone) {
                return { ...s, duration: event.target.value };
            }
            return s;
        });
        setSchedule(newSchedule);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Submitted schedule:', schedule);
        // Here you would typically handle the API call to update the schedule
    };

    const handleCancel = () => {
        // setSchedule(matchedSchedule); // Reset to original schedule
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Row>
                <Col>Zone</Col>
                <Col>Day</Col>
                <Col>Duration</Col>
            </Row>
            <hr />
            {schedule.map((s, index) => (
                <Form.Group as={Row} controlId={`schedule-${index}`} style={{ paddingTop: "10px" }}>
                    <Form.Label column>{s.name}</Form.Label>
                    <Form.Group as={Col}>
                        <ToggleButtonGroup type="checkbox" name={`dayOfWeek-${index}`} defaultValue={defaultDays(s.day)} onChange={(value) => handleDayChange(s.zone, value)}>
                            {daysOfWeek.map(day => (
                                <ToggleButton key={day} id={`toggle-${day}-${index}`} value={day}>
                                    {day}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Form.Group>
                    <Form.Group as={Col}>
                        <Form.Control type="number" defaultValue={s.duration} onChange={(event) => handleDurationChange(s.zone, event)} />
                    </Form.Group>
                </Form.Group>
            ))}
            <hr />
            <Button variant="primary" type="submit">
                Save Changes
            </Button>
            <Button variant="secondary" onClick={handleCancel} style={{ marginLeft: '10px' }}>
                Cancel
            </Button>
        </Form>
    );
};


function Scheduler() {
    const { data, error, isLoading } = useQuery({queryKey: ['schedules'], queryFn: fetchSchedule});
    const { data: sprinklerList, error: sprinklerListError, isLoading: isLoadingSprinklerList } = useQuery({queryKey: ['sprinklers'], queryFn: fetchSprinklerList});

    if (isLoading || isLoadingSprinklerList) {
        return <div>Loading...</div>;
    }
    if (error || sprinklerListError) {
        return <div>Error: {error.message}</div>;
    }
    return (
        <Container>
            <h2 style={{ paddingTop: '20px', paddingBottom: '20px' }}>Sprinkler Schedule</h2>
            <ScheduleForm />
        </Container>
    );
}

export default Scheduler;
