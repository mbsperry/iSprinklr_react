import '../App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import config from '../config.js';
import { fetchTimeout } from '../fetchTimeout.js';
import { useCountdown } from '../useCountdown.js';
import { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Container, Button, Card, Stack, Row, Col } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Functions for the Schedule Controller section
async function fetchSchedules() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/schedules`);
  if (!response.ok) {
    if (response.status === 422) {
      const error = await response.json();
      throw new Error(`Validation Error: ${error.detail[0].msg}`);
    }
    throw new Error('Error: unable to load schedules');
  }
  return response.json();
}

async function fetchScheduleOnOff() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/on_off`);
  if (!response.ok) {
    if (response.status === 422) {
      const error = await response.json();
      throw new Error(`Validation Error: ${error.detail[0].msg}`);
    }
    throw new Error('Error: unable to load schedule on off status');
  }
  return response.json();
}

async function fetchActiveSchedule() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/active`);
  if (!response.ok) {
    if (response.status === 422) {
      const error = await response.json();
      throw new Error(`Validation Error: ${error.detail[0].msg}`);
    }
    throw new Error('Error: unable to load active schedule');
  }
  return response.json();
}

async function postActiveSchedule(scheduleName) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/active/${scheduleName}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    if (response.status === 422) {
      const error = await response.json();
      throw new Error(`Validation Error: ${error.detail[0].msg}`);
    }
    throw new Error('Error: unable to set active schedule');
  }
  return response.json();
}

async function postScheduleOnOff(value) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/scheduler/on_off?schedule_on_off=${value}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    if (response.status === 422) {
      const error = await response.json();
      throw new Error(`Validation Error: ${error.detail[0].msg}`);
    }
    throw new Error(`Unable to set schedule on off. Status: ${response.status} Message: ${response.statusText}`);
  }
  return response.json();
}


// Query functions for the Sprinkler Controller
async function fetchSystemStatus() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/system/status`);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

async function fetchSprinklerList() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers/`);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

async function startSprinkler({ zone, duration }) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: parseInt(zone),
      duration: parseInt(duration * 60) // Convert minutes to seconds
    })
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

async function stopSprinkler() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}


function SprinklrSelect({sprinklerList, onChange, value, disabled}) {
  function MakeList() {
    const options = [];
    for (const element of sprinklerList) {
      options.push(<option key={element.name} value={element.zone}>{element.name}</option>);
    }
    return (
      <>
        {options}
      </>
    )
  }

  return (
    <InputGroup>
      <InputGroup.Text>Select Sprinklr</InputGroup.Text>
        <Form.Select 
          onChange={(e) => onChange(e)} 
          value={value}
          disabled={disabled}
        >
          <option value="0">None</option>
          {MakeList()}
       </Form.Select>
    </InputGroup>
  )
}

function DurationInput({ visible, systemStatus, onStatusChange, isLoading }) {
  const [validated, setValidated] = useState(false);
  const formValue = useRef(null);
  let buttonColor = (systemStatus.status === "active") ? "danger" : "primary";

  function onChange(e) {
    formValue.current = e.target.value;
  }
  // First, check to make sure input is valid
  function handleSubmit(e) {
    if (systemStatus.status === "inactive") {
      if (e.target.checkValidity() === false) {
        e.preventDefault();
        setValidated(true);
        return
      };
    }
    e.preventDefault();
    if (buttonColor === "primary" && systemStatus.status === "inactive") {
      onStatusChange(formValue.current, "start");
    } else {
      onStatusChange(0, "stop");
    }
  };
  
  // Don't render if a sprinkler hasn't been selected yet
  if (visible === false) {
    return <></>
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Control 
        required 
        type="number" 
        min="1" 
        step="1" 
        max="60" 
        onChange={onChange} 
        placeholder='Duration in whole minutes'
        disabled={isLoading}
      />
      <Form.Control.Feedback type="invalid">Please enter duration in whole minutes only. Max 60 min.</Form.Control.Feedback>
      <Button 
        type="submit" 
        variant={isLoading ? "secondary" : buttonColor} 
        className="mt-2" 
        disabled={isLoading}
      >
        {buttonColor === "primary" ? "Activate!" : "Stop"}
      </Button>
    </Form>
  )
}

function InputCard({sprinklerList, systemStatus, sprinklr, onSprinklrChange, onStatusChange, isLoading}) {
  // Default is DurationInput is not visible
  let isVisible = false;

  // Only show it if a sprinklr has been selected
  if (sprinklr > 0) {
    isVisible = true;
  }

  return (
    <>
      <Card>
        <Card.Body>
      <Stack gap="2">
        <SprinklrSelect 
          sprinklerList={sprinklerList} 
          onChange={onSprinklrChange} 
          value={sprinklr} 
          disabled={isLoading}
        />
        <DurationInput 
          visible={isVisible} 
          systemStatus={systemStatus} 
          onStatusChange={onStatusChange}
          isLoading={isLoading}
        />
      </Stack>
        </Card.Body>
      </Card>
    </>
  )
}

// Schedule Controller component
function ScheduleController() {
  const queryClient = useQueryClient();
  
  // Fetch schedules list
  const { 
    data: schedules = [], 
    error: schedulesError, 
    isLoading: isLoadingSchedules 
  } = useQuery({ 
    queryKey: ['schedules'], 
    queryFn: fetchSchedules 
  });

  // Fetch the schedule on/off state
  const {
    data: onOffData,
    error: onOffError,
    isLoading: isLoadingOnOff
  } = useQuery({
    queryKey: ['scheduleOnOff'],
    queryFn: fetchScheduleOnOff
  });

  // Fetch the active schedule
  const {
    data: activeScheduleData,
    error: activeScheduleError,
    isLoading: isLoadingActiveSchedule
  } = useQuery({
    queryKey: ['activeSchedule'],
    queryFn: fetchActiveSchedule
  });

  // Mutations for changing schedule state
  const setActiveScheduleMutation = useMutation({
    mutationFn: postActiveSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSchedule'] });
    }
  });

  const setScheduleOnOffMutation = useMutation({
    mutationFn: postScheduleOnOff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleOnOff'] });
    }
  });

  // Handle schedule selection change
  const handleScheduleChange = (event) => {
    const scheduleName = event.target.value;
    setActiveScheduleMutation.mutate(scheduleName);
  };

  // Handle schedule on/off toggle
  const handleScheduleOnOff = (event) => {
    const isOn = event.target.checked;
    setScheduleOnOffMutation.mutate(isOn);
  };

  // Get the currently active schedule name
  const getActiveScheduleName = () => {
    if (isLoadingActiveSchedule || !activeScheduleData) return "";
    return activeScheduleData.schedule_name || "";
  };

  // Is the schedule feature turned on?
  const isScheduleOn = () => {
    if (isLoadingOnOff || !onOffData) return false;
    return onOffData.schedule_on_off || false;
  };

  if (isLoadingSchedules || isLoadingOnOff || isLoadingActiveSchedule) {
    return <div>Loading schedule data...</div>;
  }

  if (schedulesError || onOffError || activeScheduleError) {
    return (
      <Card>
        <Card.Body>
          <Card.Title>Schedule Controller</Card.Title>
          <div>Error loading schedule data: {(schedulesError || onOffError || activeScheduleError).message}</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Schedule Controller</Card.Title>
        <Stack gap="3">
          <Form.Check
            type="switch"
            id="scheduleOnOff"
            label={`Schedule ${isScheduleOn() ? 'On' : 'Off'}`}
            checked={isScheduleOn()}
            onChange={handleScheduleOnOff}
          />
          
          <Form.Group>
            <Form.Label>Active Schedule</Form.Label>
            <Form.Select 
              value={getActiveScheduleName()} 
              onChange={handleScheduleChange}
              disabled={!isScheduleOn()}
            >
              {/* Add test id to placeholder option for debugging */}
              <option data-testid="placeholder-option" key="select-placeholder" value="">Select a schedule</option>
              {schedules.map((schedule, index) => (
                <option
                  data-testid={`schedule-option-${index}`}
                  key={`schedule-${schedule.schedule_name || index}`}
                  value={schedule.schedule_name}
                >
                  {schedule.schedule_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Stack>
      </Card.Body>
    </Card>
  );
}

function StatusCard({sprinklerList, sprinklr, systemStatus, countDownDate, onStatusChange}) {
  let color = "bg-info";
  let msg = systemStatus.message;
  const [min,sec] = useCountdown(countDownDate);
  
  // Format minutes and seconds to always have two digits
  const formattedMin = min.toString().padStart(2, '0');
  const formattedSec = sec.toString().padStart(2, '0');

  // Use useEffect to handle countdown completion instead of doing it during render
  useEffect(() => {
    if (systemStatus.status === "active" && countDownDate - new Date().getTime() < 0) {
      onStatusChange(0, "update");
    }
  }, [systemStatus.status, countDownDate, onStatusChange]);

  if (systemStatus.status === "active") { 
    color = "bg-success";
    // Check if sprinklerList has data and the index is valid
    const zoneName = sprinklerList && sprinklerList[sprinklr - 1] ? sprinklerList[sprinklr - 1].name : `Zone ${sprinklr}`;
    
    msg = (
      <>
        <p><b>Active Zone:</b> {zoneName}<br />
        <b>Remaining time:</b> {formattedMin}:{formattedSec}</p>
      </>
    );
  } else if (systemStatus.status === "loading") {
    color = "bg-warning";
    msg = systemStatus.message;
  } else if (systemStatus.status === "inactive") {
    color = "bg-info";
    msg = "System is Idle";
  } else {
    color = "bg-danger";
    msg = `Error: ${systemStatus.message}`;
  }

  const handleReset = () => {
    window.location.reload();
  }

  return (
    <>
      <Card className={color + " bg-opacity-25"}>
        <Card.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span> {msg} </span>
            {(systemStatus.status === "error") && <Button onClick={handleReset} variant="warning"> Reset </Button>}
          </div>
        </Card.Body>
      </Card>
    </>
  )
}

function Controller() {
  const queryClient = useQueryClient();
  const [sprinklr, setSprinklr] = useState("0");
  const [countDownDate, setCountDownDate] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Fetch the system status
  const { 
    data: systemStatusData,
    error: systemStatusError,
    isLoading: isLoadingSystemStatus
  } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: fetchSystemStatus,
    refetchInterval: 10000 // Refetch every 10 seconds to keep status updated
  });

  // Use effect to track system status changes coming from outside
  useEffect(() => {
    if (systemStatusData) {
      if (systemStatusData.systemStatus === "active") {
        // System is active - could be activated elsewhere
        console.log("System active detected - zone:", systemStatusData.active_zone);
        
        // Update sprinklr selection to match active zone
        if (sprinklr !== systemStatusData.active_zone.toString()) {
          console.log("Updating sprinklr to", systemStatusData.active_zone);
          setSprinklr(systemStatusData.active_zone.toString());
        }
        
        // Calculate proper end time
        const endTime = new Date().getTime() + (systemStatusData.duration * 1000);
        
        // Only update if the time has changed significantly or if no timer is running
        if (Math.abs(countDownDate - endTime) > 10000 || countDownDate === 0) {
          console.log("Updating countdown to", systemStatusData.duration, "seconds");
          setCountDownDate(endTime);
          setDuration(Math.round(systemStatusData.duration / 60)); // Convert to minutes
        }
      } else if (systemStatusData.systemStatus === "inactive" && duration > 0) {
        // System was active but now inactive - shut down UI state
        console.log("System became inactive - resetting state");
        setDuration(0);
        setCountDownDate(0);
      }
    }
  }, [systemStatusData, countDownDate, sprinklr, duration]);

  // Fetch the sprinkler list
  const {
    data: sprinklerList = [],
    error: sprinklerListError,
    isLoading: isLoadingSprinklerList
  } = useQuery({
    queryKey: ['sprinklerList'],
    queryFn: fetchSprinklerList
  });

  // Mutations for starting and stopping sprinklers
  const startSprinklerMutation = useMutation({
    mutationFn: startSprinkler,
    onSuccess: (response, variables) => {
      console.log("API response: " + response.message);
      if (response.systemStatus === "error") {
        return;
      } else if (response.systemStatus === "active" && response.zone !== parseInt(sprinklr)) {
        setDuration(response.duration);
        setCountDownDate(new Date().getTime() + response.duration * 1000);
        return;
      }
      // Use the variables.duration that was passed to the mutation
      setDuration(variables.duration);
      setCountDownDate(new Date().getTime() + variables.duration * 60000);
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
    },
    onError: (error) => {
      console.error("Error starting sprinkler:", error);
    }
  });

  const stopSprinklerMutation = useMutation({
    mutationFn: stopSprinkler,
    onSuccess: (response) => {
      console.log("API response: " + response.message);
      if (response.systemStatus !== "error") {
        setDuration(0);
        setCountDownDate(0);
        queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
      }
    },
    onError: (error) => {
      console.error("Error stopping sprinkler:", error);
    }
  });

  function onSprinklrChange(e) {
    setSprinklr(e.target.value);
  }

  // Get the current system status
  const getSystemStatus = () => {
    if (isLoadingSystemStatus) {
      return { "status": "loading", "message": "Waiting for arduino..." };
    }
    
    if (systemStatusError) {
      return { "status": "error", "message": systemStatusError.message };
    }
    
    if (!systemStatusData) {
      return { "status": "loading", "message": "No system status data" };
    }
    
    if (systemStatusData.systemStatus === "error") {
      return { "status": "error", "message": systemStatusData.message };
    }
    
    if (systemStatusData.systemStatus === "active") {
      return { "status": "active", "message": "System active" };
    }
    
    return { "status": "inactive", "message": "System is idle" };
  };

  // Handle system status changes, triggered when the user clicks the activate button, 
  // when the countdown timer reaches zero, or on initial load
  function handleStatusChange(newDuration, action) {
    if (action === "start") {
      // Start a new sprinkler
      startSprinklerMutation.mutate({ zone: sprinklr, duration: newDuration });
    } else if (action === "stop") {
      // Stop the current sprinkler
      stopSprinklerMutation.mutate();
    } else if (action === "update" && newDuration > 0) {
      // Update the countdown timer
      setCountDownDate(new Date().getTime() + newDuration * 1000);
      setDuration(newDuration);
    } else if (action === "update" && newDuration === 0) {
      // Reset everything
      setDuration(0);
      setCountDownDate(0);
    }
  }

  const systemStatus = getSystemStatus();
  const isLoading = isLoadingSystemStatus || isLoadingSprinklerList;
  
  // Track mutation loading states for button disabling
  const isMutationLoading = startSprinklerMutation.isPending || stopSprinklerMutation.isPending;

  if (isLoading) {
    return <div className="App">Loading...</div>;
  }
  return (
    <Container>
      <h1>###iSprinklr###</h1>
      <p>React based Sprinklr control</p>
      
      {/* Sprinkler Controller Section */}
      <h2 className="mt-4 mb-3">Sprinkler Control</h2>
      <Stack gap="2" className="mb-4">
        <InputCard 
          sprinklerList={sprinklerList} 
          systemStatus={systemStatus} 
          sprinklr={sprinklr} 
          onSprinklrChange={onSprinklrChange} 
          onStatusChange={handleStatusChange}
          isLoading={isMutationLoading}
        />
        <StatusCard 
          sprinklerList={sprinklerList} 
          duration={duration} 
          sprinklr={sprinklr} 
          systemStatus={systemStatus} 
          countDownDate={countDownDate} 
          onStatusChange={handleStatusChange}
        />
      </Stack>
      
      {/* Schedule Controller Section */}
      <h2 className="mt-4 mb-3">Schedule Control</h2>
      <ScheduleController />
    
    </Container>
  );
}

export default Controller;
