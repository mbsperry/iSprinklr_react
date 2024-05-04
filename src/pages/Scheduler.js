import Container from 'react-bootstrap/Container';
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

// TODO: reformat to use function defintions instead of arrow functions

async function fetchSchedule() {
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/get_schedule`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

async function fetchSprinklerList() {
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

function ParseSchedule() {
    const { data, error, isLoading } = useQuery({queryKey: ['schedules'], queryFn: fetchSchedule});
    const { data: sprinklerList, error: sprinklerListError, isLoading: isLoadingSprinklerList } = useQuery({queryKey: ['sprinklers'], queryFn: fetchSprinklerList});

    // Match the zone ID to the zone name
    const matchedSchedule = data.map((schedule) => {
        const matchedSprinkler = sprinklerList.find((sprinkler) => sprinkler.zone === schedule.zone);
        if (schedule.day === "ALL") {
            return { zone: schedule.zone, duration: schedule.duration, name: matchedSprinkler.name, daysOfWeek: "", multiDay: "ALL" };
        } else if (schedule.day === "NONE") {
            return { zone: schedule.zone, duration: schedule.duration, name: matchedSprinkler.name, daysOfWeek: "", multiDay: "NONE" };
        } else if (schedule.day === "EO") {
            return { zone: schedule.zone, duration: schedule.duration, name: matchedSprinkler.name, daysOfWeek: "", multiDay: "EO" };
        } else {
            return { zone: schedule.zone, duration: schedule.duration, name: matchedSprinkler.name, daysOfWeek: schedule.day, multiDay: "" };
        }
    });
    return matchedSchedule;
}

    // Build a form to edit the schedule
    // The form should have a row for each sprinkler zone. 
    // Each row will have a non-editable text field for the sprinkler name, a ToggleButtonGroup to select the day of the week (M, Tu, W, Th, F, Sa, Su, EO, none), and an input field for duration
    // The form will have a submit button to save the changes
    // The form will have a cancel button to discard the changes
    // The form will be built using React Bootstrap
  


function ScheduleForm() {
    const daysOfWeek = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
    const [schedule, setSchedule] = useState(ParseSchedule());

    const defaultDays = (days) => {
        if (days === null) {
            return [];
        }
        return days.split(':');
    };

    // TODO: Only allow variable number of days of the week, or ALL, or NONE, or EO. Do not allow combinations of ALL, NONE, EO and days of the week
    const handleDayChange = (zone, value) => {
        console.log(value);
        let newDays;
        if (Array.isArray(value)) {
            newDays = value.join(':');
        } else {
            newDays = value;
        }
        const newSchedule = schedule.map(s => {
            if (s.zone === zone) {
                if (newDays === "ALL") {
                    return { ...s, daysOfWeek: "", multiDay: "ALL" };
                } else if (newDays === "NONE") {
                    return { ...s, daysOfWeek: "", multiDay: "NONE" };
                } else if (newDays === "EO") {
                    return { ...s, daysOfWeek: "", multiDay: "EO" };
                } else {
                    return { ...s, daysOfWeek: newDays, multiDay: "" };
                }
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


    function DayOfWeekButtons({ scheduleItem, index }) {
        return (
            <Form.Group style={{ paddingBottom: '10px' }}>
                <ToggleButtonGroup type="checkbox" name={`dayOfWeek-${index}`} defaultValue={defaultDays(scheduleItem.daysOfWeek)} onChange={(value) => handleDayChange(scheduleItem.zone, value)}>
                    {daysOfWeek.map(day => (
                        <ToggleButton key={day} id={`toggle-${day}-${index}`} value={day} variant={scheduleItem.daysOfWeek.includes(day) ? 'outline-success' : 'outline-secondary'}>
                            {day}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Form.Group> 
        );
    }

    function MultiDayButtons({ scheduleItem, index }) {
        return (
            <Form.Group>
                <ToggleButtonGroup type="radio" name={`multiDaySelector-${index}`} defaultValue={defaultDays(scheduleItem.multiDay)} onChange={(value) => handleDayChange(scheduleItem.zone, value)}>
                    <ToggleButton key={"ALL"} id={`all-${index}`} value={"ALL"} variant={scheduleItem.multiDay === "ALL" ? 'outline-success' : 'outline-secondary'}>
                        ALL
                    </ToggleButton>
                    <ToggleButton key={"NONE"} id={`none-${index}`} value={"NONE"} variant={scheduleItem.multiDay === "NONE" ? 'outline-success' : 'outline-secondary'}>
                        NONE
                    </ToggleButton>
                    <ToggleButton key={"EO"} id={`eo-${index}`} value={"EO"} variant={scheduleItem.multiDay === "EO" ? 'outline-success' : 'outline-secondary'}>
                        EO
                    </ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
        );
    }

    return (
        <Form onSubmit={handleSubmit}>
            <Row>
                <Col md="3">Zone</Col>
                <Col md="2">Duration</Col>
                <Col>Day</Col>
            </Row>
            <hr />
            {schedule.map((s, index) => (
                <Form.Group as={Row} controlId={`schedule-${index}`} style={{ paddingTop: "10px", paddingBottom: "10px", background: (index % 2 === 0) ? 'white' : '#f2f2f2' }}>
                    <Col md="2">
                        <Form.Label column>{s.name}</Form.Label>
                    </Col>
                    <Col md="2">
                        <Form.Group style={{ paddingBottom: "10px" }}>
                            <Form.Control type="number" defaultValue={s.duration} onChange={(event) => handleDurationChange(s.zone, event)} />
                        </Form.Group>
                    </Col>
                    <Col md="auto">
                        <DayOfWeekButtons scheduleItem={s} index={index} /> 
                        <MultiDayButtons scheduleItem={s} index={index} />
                    </Col>
                  
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
