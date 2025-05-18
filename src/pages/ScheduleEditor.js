import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Form, Button, Card, Alert, Stack, Row, Col, Modal, InputGroup, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import config from '../config';
import { fetchTimeout } from '../fetchTimeout.js';

// --- API Functions ---
async function fetchAllSchedules() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/schedules`);
  if (!response.ok) {
    throw new Error('Failed to fetch schedules');
  }
  return response.json();
}

async function fetchSprinklerList() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers/`);
  if (!response.ok) {
    throw new Error('Failed to fetch sprinkler list');
  }
  return response.json();
}

async function createSchedule(newSchedule) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSchedule),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create schedule' }));
    throw new Error(errorData.detail || 'Failed to create schedule');
  }
  return response.json();
}

async function updateSchedule(updatedSchedule) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/schedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedSchedule),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update schedule' }));
    throw new Error(errorData.detail || 'Failed to update schedule');
  }
  return response.json();
}

async function deleteSchedule(scheduleName) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/schedule/${scheduleName}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete schedule' }));
    throw new Error(errorData.detail || 'Failed to delete schedule');
  }
  return response.json();
}

// --- Helper Functions & Constants ---
const DAYS_OF_WEEK = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
const MULTI_DAY_OPTIONS = ["ALL", "NONE", "EO"]; // Every Other

const initialScheduleItem = { zone: 0, day: 'NONE', duration: 5, name: '' }; // duration in minutes for UI, default day to NONE

function formatScheduleForApi(uiSchedule) {
  return {
    schedule_name: uiSchedule.schedule_name,
    schedule_items: uiSchedule.schedule_items.map(item => ({
      zone: parseInt(item.zone),
      day: item.day,
      duration: parseInt(item.duration) * 60 // Convert minutes to seconds
    }))
  };
}

function formatScheduleForUi(apiSchedule, sprinklerList = []) {
  if (!apiSchedule || !sprinklerList || sprinklerList.length === 0) return null;

  const scheduleItemsMap = new Map();
  if (apiSchedule.schedule_items) {
    apiSchedule.schedule_items.forEach(item => {
      scheduleItemsMap.set(item.zone, item);
    });
  }

  const uiScheduleItems = sprinklerList.map(sprinkler => {
    const existingItem = scheduleItemsMap.get(sprinkler.zone);
    if (existingItem) {
      return {
        zone: sprinkler.zone,
        name: sprinkler.name,
        day: existingItem.day,
        duration: Math.round(existingItem.duration / 60) || 5, // Convert seconds to minutes, default 5
      };
    } else {
      // If a zone from sprinklerList is not in the schedule, add it with default "NONE"
      return {
        zone: sprinkler.zone,
        name: sprinkler.name,
        day: 'NONE',
        duration: 5, // Default duration
      };
    }
  });

  return {
    schedule_name: apiSchedule.schedule_name,
    schedule_items: uiScheduleItems,
  };
}


// --- Main Component ---
function ScheduleEditor() {
  const queryClient = useQueryClient();
  const [selectedScheduleName, setSelectedScheduleName] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null); // Holds the schedule being edited (UI format)
  const [originalEditingSchedule, setOriginalEditingSchedule] = useState(null); // Holds the original state for comparison
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  const { data: schedules = [], isLoading: isLoadingSchedules, error: schedulesError } = useQuery({
    queryKey: ['allSchedules'],
    queryFn: fetchAllSchedules,
  });

  const { data: sprinklerList = [], isLoading: isLoadingSprinklers, error: sprinklersError } = useQuery({
    queryKey: ['sprinklerList'],
    queryFn: fetchSprinklerList,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: (data) => { 
      queryClient.invalidateQueries({ queryKey: ['allSchedules'] });
      setAlert({ show: true, variant: 'success', message: 'Schedule created successfully!' });
      setShowNewScheduleModal(false);
      setNewScheduleName('');
      if (data && data.schedule && data.schedule.schedule_name) {
        setSelectedScheduleName(data.schedule.schedule_name); // This will trigger useEffect to set original
      }
    },
    onError: (error) => setAlert({ show: true, variant: 'danger', message: `Error creating schedule: ${error.message}` }),
  });

  const updateMutation = useMutation({
    mutationFn: updateSchedule,
    onSuccess: (data) => { // data is the updated schedule from the API or success message
      queryClient.invalidateQueries({ queryKey: ['allSchedules'] });
      setAlert({ show: true, variant: 'success', message: 'Schedule updated successfully!' });
      // After successful save, the current editingSchedule is the new original.
      // Need to make sure editingSchedule itself is also up-to-date if API returns the full object.
      // If API returns the full updated schedule (data.schedule):
      if (data && data.schedule) {
          const savedUiSchedule = formatScheduleForUi(data.schedule, sprinklerList);
          if (savedUiSchedule) {
              setEditingSchedule(savedUiSchedule);
              setOriginalEditingSchedule(JSON.parse(JSON.stringify(savedUiSchedule)));
          } else { // Fallback if formatting fails or data.schedule is not as expected
              setOriginalEditingSchedule(JSON.parse(JSON.stringify(editingSchedule)));
          }
      } else { // If API only returns a success message, assume current editingSchedule is the source of truth
          setOriginalEditingSchedule(JSON.parse(JSON.stringify(editingSchedule)));
      }
    },
    onError: (error) => setAlert({ show: true, variant: 'danger', message: `Error updating schedule: ${error.message}` }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSchedules'] });
      setAlert({ show: true, variant: 'success', message: 'Schedule deleted successfully!' });
      setSelectedScheduleName('');
      setEditingSchedule(null);
      setOriginalEditingSchedule(null); // Clear original on delete
    },
    onError: (error) => setAlert({ show: true, variant: 'danger', message: `Error deleting schedule: ${error.message}` }),
  });

  // Effects
  // Effect to automatically select the first schedule when the page loads and schedules are available
  useEffect(() => {
    if (!selectedScheduleName && schedules && schedules.length > 0) {
      setSelectedScheduleName(schedules[0].schedule_name);
    }
  }, [schedules, selectedScheduleName]); // Re-run if schedules load or selectedScheduleName changes (e.g., cleared)

  useEffect(() => {
    if (selectedScheduleName) {
      const scheduleToEdit = schedules.find(s => s.schedule_name === selectedScheduleName);
      const formattedSchedule = formatScheduleForUi(scheduleToEdit, sprinklerList);
      setEditingSchedule(formattedSchedule);
      // Ensure originalEditingSchedule is a deep copy
      setOriginalEditingSchedule(formattedSchedule ? JSON.parse(JSON.stringify(formattedSchedule)) : null);
    } else {
      setEditingSchedule(null);
      setOriginalEditingSchedule(null);
    }
  }, [selectedScheduleName, schedules, sprinklerList]);

  // Handlers
  // Helper to compare if schedule items have changed (ignoring the schedule name)
  const hasUnsavedChanges = () => {
    if (!editingSchedule || !originalEditingSchedule) return false;
    
    // Compare only the schedule_items, ignoring the schedule_name
    return JSON.stringify(editingSchedule.schedule_items) !== 
           JSON.stringify(originalEditingSchedule.schedule_items);
  };

  const handleScheduleSelect = (e) => {
    const newSelectedName = e.target.value;
    if (hasUnsavedChanges()) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to switch schedules and discard these changes?")) {
        return; 
      }
    }
    setSelectedScheduleName(newSelectedName);
  };

  const handleNewSchedule = () => {
    if (!newScheduleName.trim()) {
      setAlert({ show: true, variant: 'warning', message: 'New schedule name cannot be empty.' });
      return;
    }
    if (schedules.find(s => s.schedule_name === newScheduleName.trim())) {
        setAlert({ show: true, variant: 'warning', message: 'A schedule with this name already exists.' });
        return;
    }
    // Initialize new schedule with all zones
    const defaultItems = sprinklerList.map(sprinkler => ({
        zone: sprinkler.zone,
        name: sprinkler.name,
        day: 'NONE', 
        duration: 5  
    }));
    const newScheduleData = { 
        schedule_name: newScheduleName.trim(), 
        schedule_items: defaultItems.map(item => ({ 
            zone: item.zone,
            day: item.day,
            duration: item.duration * 60 // to seconds for API
        }))
    };
    // The createSchedule mutation expects API formatted data for schedule_items
    createMutation.mutate({
        schedule_name: newScheduleName.trim(),
        schedule_items: newScheduleData.schedule_items
    });
  };

  const handleSaveSchedule = () => {
    if (editingSchedule) {
      // Get the original schedule name from the selected schedule
      const scheduleToUpdate = {
        ...formatScheduleForApi(editingSchedule),
        // Ensure we use the original schedule name (in case it was modified in the UI state)
        schedule_name: selectedScheduleName
      };
      updateMutation.mutate(scheduleToUpdate);
    }
  };

  const handleDeleteSchedule = () => {
    if (selectedScheduleName && window.confirm(`Are you sure you want to delete schedule "${selectedScheduleName}"?`)) {
      deleteMutation.mutate(selectedScheduleName);
    }
  };

  const handleScheduleItemChange = (index, field, value) => {
    if (!editingSchedule) return;
    const updatedItems = [...editingSchedule.schedule_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditingSchedule({ ...editingSchedule, schedule_items: updatedItems });
  };
  
  const handleDaySelectionChange = (itemIndex, newDayValue) => {
    if (!editingSchedule) return;
    const updatedItems = [...editingSchedule.schedule_items];
    const currentItem = { ...updatedItems[itemIndex] }; // Work on a copy

    // If a multi-day option is clicked
    if (MULTI_DAY_OPTIONS.includes(newDayValue)) {
        // If the same multi-day option is clicked again, treat it as deselecting it, defaulting to "NONE"
        // The ToggleButtonGroup type="radio" for multi-days means only one can be active.
        currentItem.day = newDayValue;
    } 
    // If an individual day of the week is clicked
    else if (DAYS_OF_WEEK.includes(newDayValue)) {
        let currentSelectedDays = [];
        // If the current day was a multi-day option, or no days were selected, start fresh with the new day.
        if (MULTI_DAY_OPTIONS.includes(currentItem.day) || !currentItem.day) {
            currentSelectedDays = [newDayValue];
        } else {
            // Otherwise, it's a list of individual days. Toggle the new day.
            currentSelectedDays = currentItem.day.split(':');
            if (currentSelectedDays.includes(newDayValue)) {
                currentSelectedDays = currentSelectedDays.filter(d => d !== newDayValue);
            } else {
                currentSelectedDays.push(newDayValue);
            }
        }

        if (currentSelectedDays.length === 0) {
            currentItem.day = 'NONE'; // If no days are selected, default to "NONE"
        } else {
            currentItem.day = currentSelectedDays.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)).join(':');
        }
    }
    
    updatedItems[itemIndex] = currentItem;
    setEditingSchedule({ ...editingSchedule, schedule_items: updatedItems });
  };


  if (isLoadingSchedules || isLoadingSprinklers) return <Container><p>Loading schedule data...</p></Container>;
  if (schedulesError) return <Container><Alert variant="danger">Error loading schedules: {schedulesError.message}</Alert></Container>;
  if (sprinklersError) return <Container><Alert variant="danger">Error loading sprinklers: {sprinklersError.message}</Alert></Container>;
  
  // Check if there are no sprinkler zones defined
  const noZonesDefined = Array.isArray(sprinklerList) && sprinklerList.length === 0;

  return (
    <Container className="my-4">
      <h1>Schedule Editor</h1>
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
          {alert.message}
        </Alert>
      )}
      
      {noZonesDefined && (
        <Alert variant="warning" className="mb-3">
          <Alert.Heading>No Sprinkler Zones Defined</Alert.Heading>
          <p>
            Define sprinkler zones to enable schedule editing. 
            Please go to <Link to="/sprinkler-zones">Configure Zones</Link> first to set up your sprinkler zones.
          </p>
        </Alert>
      )}

      <Stack direction="horizontal" gap={3} className="mb-3 align-items-end">
        <Form.Group controlId="selectSchedule" className="flex-grow-1">
          <Form.Label>Select Schedule to Edit</Form.Label>
          <Form.Select 
            value={selectedScheduleName} 
            onChange={handleScheduleSelect}
            disabled={noZonesDefined}
          >
            <option value="">-- Select a Schedule --</option>
            {schedules.map(schedule => (
              <option key={schedule.schedule_name} value={schedule.schedule_name}>
                {schedule.schedule_name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Button 
          variant="primary" 
          onClick={() => setShowNewScheduleModal(true)}
          disabled={noZonesDefined}
        >
          Add New Schedule
        </Button>
      </Stack>

      {editingSchedule && (
        <Card>
          <Card.Header>
            <Stack direction="horizontal" gap={3}>
                <h5 className="mb-0">Editing: {editingSchedule.schedule_name}</h5>
                <Button variant="danger" size="sm" onClick={handleDeleteSchedule} className="ms-auto">Delete This Schedule</Button>
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form>
              <h6 className="mb-3">Schedule Items</h6>
              {editingSchedule.schedule_items.map((item, index) => (
                <Card key={index} className="mb-3 p-3 bg-light">
                  <Row className="align-items-center">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Control plaintext readOnly defaultValue={item.name} className="fw-bold" /> {/* Making name bold for emphasis */}
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Duration (min)</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.duration}
                          onChange={(e) => handleScheduleItemChange(index, 'duration', e.target.value)}
                          min="1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Days</Form.Label>
                        <div>
                            <ToggleButtonGroup
                                type="checkbox"
                                value={item.day && !MULTI_DAY_OPTIONS.includes(item.day) ? item.day.split(':') : []}
                                onChange={(selectedDaysArray) => {
                                    const previousDays = (item.day && !MULTI_DAY_OPTIONS.includes(item.day) ? item.day.split(':') : []);
                                    let toggledDay = '';
                                    if (selectedDaysArray.length > previousDays.length) { 
                                        toggledDay = selectedDaysArray.find(d => !previousDays.includes(d));
                                    } else { 
                                        toggledDay = previousDays.find(d => !selectedDaysArray.includes(d));
                                    }
                                    if (toggledDay) handleDaySelectionChange(index, toggledDay);
                                    else if (selectedDaysArray.length === 0 && previousDays.length > 0) {
                                         handleDaySelectionChange(index, previousDays[0]); 
                                    }
                                }}
                                className="mb-2 d-flex flex-wrap"
                            >
                                {DAYS_OF_WEEK.map(day => (
                                    <ToggleButton
                                        key={`${index}-${day}`}
                                        id={`day-${index}-${day}`}
                                        value={day}
                                        variant="outline-primary"
                                        size="sm"
                                    >
                                        {day}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                            <ToggleButtonGroup
                                type="radio"
                                name={`multiDay-${index}`}
                                value={MULTI_DAY_OPTIONS.includes(item.day) ? item.day : ''}
                                onChange={(val) => { 
                                    if (val) handleDaySelectionChange(index, val);
                                }}
                                className="d-flex flex-wrap"
                            >
                                {MULTI_DAY_OPTIONS.map(option => (
                                    <ToggleButton
                                        key={`${index}-${option}`}
                                        id={`multiDay-${index}-${option}`}
                                        value={option}
                                        variant="outline-secondary"
                                        size="sm"
                                    >
                                        {option}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button 
                variant="primary" 
                onClick={handleSaveSchedule} 
                disabled={updateMutation.isPending || createMutation.isPending || !hasUnsavedChanges()}
              >
                {updateMutation.isPending || createMutation.isPending ? 'Saving...' : 'Save Schedule Changes'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* New Schedule Modal */}
      <Modal 
        show={showNewScheduleModal && !noZonesDefined} 
        onHide={() => setShowNewScheduleModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Schedule Name</Form.Label>
            <Form.Control
              type="text"
              value={newScheduleName}
              onChange={(e) => setNewScheduleName(e.target.value)}
              placeholder="Enter new schedule name"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewScheduleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleNewSchedule} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ScheduleEditor;
