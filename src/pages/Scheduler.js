import Container from 'react-bootstrap/Container';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTimeout } from '../fetchTimeout.js';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';

import config from '../config.js';


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

async function postSchedule(schedule) {
    const formattedSchedule = schedule.map(s => {
        if (s.daysOfWeek === "") {
            return { zone: s.zone, day: s.multiDay, duration: s.duration };
        } else {
            return { zone: s.zone, day: s.daysOfWeek, duration: s.duration };
        }
    });
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/set_schedule`, 
        { 
            method: 'POST', 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: formattedSchedule }) 
        });
    if (!response.ok) {
        // Throw custom error with status and message
        return response.text().then(text => {
            const message = JSON.parse(text).detail[0].msg;
            throw ({ status: response.status, message: message });
        });
    }
    return response.json();
}

// Parse the schedule from the API into a format that is easier to use in the form
function ParseSchedule() {
    const { data, error, isLoading } = useQuery({queryKey: ['schedules'], queryFn: fetchSchedule});
    const { data: sprinklerList, error: sprinklerListError, isLoading: isLoadingSprinklerList } = useQuery({queryKey: ['sprinklers'], queryFn: fetchSprinklerList});

    // Match the zone ID to the zone name
    // Need to split the days of the week and the multiday tags into different variables to 
    // allow either:or logic later on
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

function ScheduleForm() {
    const daysOfWeek = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
    const [schedule, setSchedule] = useState(ParseSchedule());
    const originalSchedule = ParseSchedule();
    const [alertData, setAlertData] = useState({ show: false, type: '', message: '' });

    const queryClient = useQueryClient();

    const submitMutation = useMutation({
        mutationFn: postSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries('schedules');
            // Display alert with success message
            setAlertData({ show: true, type: 'Success', message: 'Schedule updated successfully' });
        },
        onError: (error) => {
            // Display alert with error
            console.log('Error:', error);
            setAlertData({ show: true, type: 'Submission Error', message: 'Status ' + error.status + ' Message: ' + error.message });
        }
    });

    function handleCloseAlert() {
        setAlertData({ show: false, type: '', message: '' });
    }

    function defaultDays(days) {
        if (days === null) {
            return [];
        }
        return days.split(':');
    };

    // Handle clicks on the day buttons. Must only allow a combination of days of week OR one of
    // multiday buttons. 
    function handleDayChange(zone, value) {
        const newSchedule = schedule.map(s => {
            if (s.zone === zone) {
                if (value[0] === "ALL") {
                    return { ...s, daysOfWeek: "", multiDay: "ALL" };
                } else if (value[0] === "NONE") {
                    return { ...s, daysOfWeek: "", multiDay: "NONE" };
                } else if (value[0] === "EO") {
                    return { ...s, daysOfWeek: "", multiDay: "EO" };
                } else {
                    return { ...s, daysOfWeek: value.join(':'), multiDay: "" };
                }
            }
            return s;
        });
        setSchedule(newSchedule);
    };

    function handleDurationChange(zone, event) {
        const newSchedule = schedule.map(s => {
            if (s.zone === zone) {
                return { ...s, duration: event.target.value };
            }
            return s;
        });
        setSchedule(newSchedule);
    };

    function handleSubmit(event) {
        event.preventDefault();
        console.log('Submitted schedule:', schedule);
        submitMutation.mutate(schedule);
        // TODO: invalidate queries
    };

    // Reset the schedule to the original schedule from the API
    function handleCancel() {
        setSchedule(originalSchedule);
    };


    // Build a button for every day of the week
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

    // ALL, None, Every Other day buttons
    function MultiDayButtons({ scheduleItem, index }) {
        return (
            <Form.Group>
                <ToggleButtonGroup type="radio" name={`multiDaySelector-${index}`} defaultValue={defaultDays(scheduleItem.multiDay)} onChange={(value) => handleDayChange(scheduleItem.zone, [value])}>
                    <ToggleButton key={"ALL"} id={`all-${index}`} value={"ALL"} variant={scheduleItem.multiDay === "ALL" ? 'outline-success' : 'outline-secondary'}>
                        ALL
                    </ToggleButton>
                    <ToggleButton key={"NONE"} id={`none-${index}`} value={"NONE"} variant={scheduleItem.multiDay === "NONE" ? 'outline-success' : 'outline-secondary'}>
                        NONE
                    </ToggleButton>
                    <ToggleButton key={"EO"} id={`eo-${index}`} value={"EO"} variant={scheduleItem.multiDay === "EO" ? 'outline-success' : 'outline-secondary'}>
                        Every Other
                    </ToggleButton>
                </ToggleButtonGroup>
            </Form.Group>
        );
    }

    return (
        <>
            <Form style={{ paddingBottom: '20px' }} onSubmit={handleSubmit}>
                <Row className="d-none d-md-flex">
                    <Col md="2">Zone</Col>
                    <Col md="2">Duration</Col>
                    <Col>Day</Col>
                </Row>
                <hr className="d-none d-md-block" />
                {schedule.map((s, index) => (
                    <Form.Group as={Row} controlId={`schedule-${index}`} style={{ paddingTop: "10px", paddingBottom: "10px", background: (index % 2 === 0) ? 'white' : '#f2f2f2' }}>
                        <Col md="2">
                            <Form.Label column>{s.name}</Form.Label>
                        </Col>
                        <Col md="2">
                            <Form.Group style={{ paddingBottom: "10px" }}>
                                <Form.Control
                                    required
                                    type="number"
                                    placeholder="Duration (min)"
                                    defaultValue={s.duration} onChange={(event) => handleDurationChange(s.zone, event)}
                                    min="0"
                                    max="60"
                                />
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

            <Modal show={alertData.show} onHide={handleCloseAlert}>
                <Modal.Header closeButton>
                    <Modal.Title>{alertData.type}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{alertData.message}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAlert}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
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
