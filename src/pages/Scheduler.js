import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTimeout } from '../fetchTimeout.js';
import { useState } from 'react';
import { Button, Col, Container, Form, Modal, Row, Stack, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';

import config from '../config.js';


async function fetchSchedule() {
	const response = await fetchTimeout(`http://${config.API_SERVER}/api/get_schedule`);
	if (!response.ok) {
		throw new Error('Error: unable to load schedule');
	}
	return response.json();
}

async function fetchSprinklerList() {
	const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers`);
	if (!response.ok) {
		throw new Error('Error: unable to load sprinkler list');
	}
	return response.json();
}

async function fetchScheduleOnOff() {
	const response = await fetchTimeout(`http://${config.API_SERVER}/api/get_schedule_on_off`);
	if (!response.ok) {
		throw new Error('Error: unable to load schedule on off');
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
			body: JSON.stringify(formattedSchedule)
		});
	if (!response.ok) {
		// Error handling if post was not successful
		return response.text().then(text => {
			const message = JSON.parse(text).detail[0].msg;
			throw new Error (`Status: ${response.status} Message: ${message}`);
		});
	}
	return response.json();
}

async function postScheduleOnOff(value) {
	const response = await fetchTimeout(`http://${config.API_SERVER}/api/set_schedule_on_off`,
		{
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ schedule_on_off: value })
		});
	if (!response.ok) {
		throw new Error(`Unable to set schedule on off. Status: ${response.status} Message: ${response.statusText}`);
	}
	return response.json();
}

// Parse the schedule from the API into a format that is easier to use in the form
function useFetchSchedule() {
	const { data: scheduleData, error: scheduleError, isLoading: isLoadingSchedule } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedule });
	const { data: sprinklerList, error: sprinklerListError, isLoading: isLoadingSprinklerList } = useQuery({ queryKey: ['sprinklers'], queryFn: fetchSprinklerList });

	if (isLoadingSchedule || isLoadingSprinklerList) {
		return { schedule: [], scheduleError: null, isLoadingSchedule: true };
	} else if (scheduleError || sprinklerListError) {
		return { schedule: [], scheduleError: scheduleError || sprinklerListError, isLoadingSchedule: false };
	}

	// Match the zone ID to the zone name
	// Need to split the days of the week and the multiday tags into different variables to 
	// allow either:or logic later on
	const schedule = scheduleData.map((schedule) => {
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
	return { schedule, scheduleError, isLoadingSchedule };
}

function useFetchScheduleOnOff() {
	const { data: onOffData, isLoading: isLoadingOnOffData, error: onOffError } = useQuery({ queryKey: ['onOffData'], queryFn: fetchScheduleOnOff });
	return { onOffData, isLoadingOnOffData, onOffError };
}

function ScheduleForm() {
	const daysOfWeek = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
	const [schedule, setSchedule] = useState(useFetchSchedule().schedule);
	const { schedule: originalSchedule } = useFetchSchedule();
	const [alertData, setAlertData] = useState({ show: false, type: '', message: '' });
	const [scheduleOnOff, setScheduleOnOff] = useState(useFetchScheduleOnOff().onOffData.schedule_on_off);

	const queryClient = useQueryClient();

	const submitMutation = useMutation({
		mutationFn: postSchedule,
	});

	const onOffMutation = useMutation({
		mutationFn: postScheduleOnOff,
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

	function handleScheduleOnOff(value) {
		onOffMutation.mutate(value, {
			onSuccess: (data) => {
				setScheduleOnOff(value);
			},
			onError: (error) => {
				setAlertData({ show: true, type: 'API Error', message: error.message });
			}
		});
	}	

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
					return { ...s, daysOfWeek: value.filter(day => day !== "").join(':'), multiDay: "" };
				}
			}
			return s;
		});
		console.log('New schedule:', newSchedule);
		setSchedule(newSchedule);
	};

	// Duration input is a controlled input, so we have to handle every change and update the draft schedule
	function handleDurationChange(zone, event) {
		const newSchedule = schedule.map(s => {
			if (s.zone === zone) {
				return { ...s, duration: event.target.value };
			}
			return s;
		});
		setSchedule(newSchedule);
	};

	function handleGlobalDurationChange(percent) {
		const newSchedule = schedule.map(s => {
			return { ...s, duration: Math.round(s.duration * (percent / 100)) };
		});
		setSchedule(newSchedule);
	}

	// Uses the mutation to submit the schedule via post
	// On success invalidate 
	function handleSubmit(event) {
		event.preventDefault();
		submitMutation.mutate(schedule, {
			onSuccess: (data) => {
				setAlertData({ show: true, type: 'Success', message: 'Schedule updated successfully' });
				// I'm not sure invalidating queries does anything
				queryClient.invalidateQueries('schedules');
			},
			onError: (error) => {
				setAlertData({ show: true, type: 'Submission Error', message: error.message });
			}
		});
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
						<ToggleButton key={`${day}-${scheduleItem.zone}`} id={`toggle-${day}-${index}`} value={day} variant={scheduleItem.daysOfWeek.includes(day) ? 'outline-success' : 'outline-secondary'}>
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
			<Container className='p-4' >
				<Form>
					<Stack direction="horizontal" gap={3} className="mx-auto flex-column flex-md-row">
						<Form.Check
							type="switch"
							id="scheduleOnOff"
							label={`Schedule ${scheduleOnOff ? 'On' : 'Off'}`}
							checked={scheduleOnOff}
							onChange={(e) => handleScheduleOnOff(e.target.checked)}
						/>
						<Button variant="info" onClick={() => handleGlobalDurationChange(90)}>
							Decrease All 10%
						</Button>
						<Button variant="info" onClick={() => handleGlobalDurationChange(110)}>
							Increase All 10%
						</Button>
					</Stack>
				</Form>
			</Container>
			<Form className='pb-4' onSubmit={handleSubmit}>
				<Row className="d-none d-md-flex">
					<Col md="2">Zone</Col>
					<Col md="2">Duration</Col>
					<Col>Day</Col>
				</Row>
				<hr className="d-none d-md-block" />
				<fieldset disabled={!scheduleOnOff}>
					{schedule.map((s, index) => (
						<Form.Group as={Row} key={`${s.zone}-formGroup`} controlId={`schedule-${index}`} className='py-4' style={{ background: (index % 2 === 0) ? 'white' : '#f2f2f2' }}>
							<Col md="2">
								<Form.Label column>{s.name}</Form.Label>
							</Col>
							<Col md="2">
								<Form.Group className='mb-4'>
									<Form.Control
										required
										type="number"
										placeholder="Duration (min)"
										value={s.duration}
										onChange={(event) => handleDurationChange(s.zone, event)}
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
						Reset Values
					</Button>
				</fieldset>
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
	const { scheduleError, isLoadingSchedule } = useFetchSchedule();
	const { isLoadingOnOffData, onOffError } = useFetchScheduleOnOff();

	if (isLoadingSchedule || isLoadingOnOffData) {
		return <div>Loading...</div>;
	}
	if (scheduleError) {
		return <div>{scheduleError.message}</div>;
	}
	if (onOffError) {
		return <div>{onOffError.message}</div>;
	}
	
	
	return (
		<Container>
			<h2 className='py-4'>Sprinkler Schedule</h2>
			
			<ScheduleForm />
		</Container>
	);
}

export default Scheduler;
