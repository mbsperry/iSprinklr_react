 import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchTimeout } from './fetchTimeout.js';
import { useCountdown } from './useCountdown';
import { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Container, Button, Card, Stack } from "react-bootstrap";

const API_SERVER = "192.168.88.160:8080";

function SprinklrSelect({sprinklerList, onChange}) {
  function MakeList() {
    const options = [];
    for (const element of sprinklerList) {
      options.push(<option value={element.zone}>{element.name}</option>);
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
        <Form.Select onChange={(e) => onChange(e)}>
          <option value="0">None</option>
          {MakeList()}
       </Form.Select>
    </InputGroup>
  )
}

function DurationInput({ visible, systemStatus, onStatusChange }) {
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
      buttonColor = 'danger';
    } else {
      onStatusChange(0, "stop");
      buttonColor = 'primary';
    }
  };
  
  // Don't render if a sprinkler hasn't been selected yet
  if (visible === false) {
    return <></>
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Control required type="number" min="1" step="1" max="60" onChange={onChange} placeholder='Duration in whole minutes'></Form.Control>
      <Form.Control.Feedback type="invalid">Please enter duration in whole minutes only. Max 60 min.</Form.Control.Feedback>
      <Button type="submit" variant={buttonColor} className="mt-2">{buttonColor === "primary" ? "Activate!" : "Stop"}</Button>
    </Form>
  )
}

function InputCard({sprinklerList, systemStatus, sprinklr, onSprinklrChange, onStatusChange}) {
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
            <SprinklrSelect sprinklerList={sprinklerList} onChange={onSprinklrChange} />
            <DurationInput visible={isVisible} systemStatus={systemStatus} onStatusChange={onStatusChange}/>
          </Stack>
        </Card.Body>
      </Card>
    </>
  )
}

function StatusCard({sprinklerList, sprinklr, systemStatus, countDownDate, onStatusChange}) {
  let color = "bg-info";
  let msg = systemStatus.message;
  const [min,sec] = useCountdown(countDownDate);

  if (systemStatus.status === "active" && countDownDate - new Date().getTime() < 0) {
    onStatusChange(0, "update");
  }

  if (systemStatus.status === "active") { 
    color = "bg-success";
    msg = `Active Zone: ${sprinklerList[sprinklr-1].name}. Remaining time: ${min}:${sec}`;
  } else if (systemStatus.status === "inactive") {
    color = "bg-info";
    msg = "System is Idle";
  } else {
    color = "bg-danger";
    msg = `Error: ${systemStatus.message}`;
  }

  return (
    <>
      <Card className={color + " bg-opacity-25"}>
        <Card.Body>
          {msg}
        </Card.Body>
      </Card>
    </>
  )
}

function App() {
  const [duration, setDuration] = useState(0);
  const [sprinklr, setSprinklr] = useState("0");
  const [sprinklerList, setSprinklerList] = useState([]);
  const [systemStatus, setSystemStatus] = useState({"status": "inactive", "message": "System is idle"});
  const [isLoading, setLoading] = useState(true);
  const [countDownDate, setCountDownDate] = useState(0);
  // countDownDate is the end time for the running sprinkler.

  // Handle errors thrown by fetch
  const handleError = response => {
   if (!response.ok) { 
      throw Error(response.statusText);
   } else {
      return response.json();
   }
  }; //handler function that throws any encountered error

  // Get the system status from the server
  const fetchSystemStatus = async () => {
    try {
      let res = await fetchTimeout(`http://${API_SERVER}/api/status`);
      let data = await handleError(res);
      // setSystemStatus(data.message);
      if (data.systemStatus === "error") {
        setSystemStatus({"status": "error", "message": data.message});
        return;
      } else if (data.systemStatus === "active") {
        // This happens when the system was already activated somewhere else
        // Get must set duration timer and current zone (not used, but will generate errors if systemStatus is active and no zone is set)
        onStatusChange(data.duration, "update");
        setSprinklr(data.zone);
      } else {
        // Default
        setSystemStatus({"status": "inactive", "message": "System is idle"});
        setDuration(0);
      }
    } catch(error) {
      setSystemStatus({"status": "error", "message": error.message});
      setDuration(-1);
    };
  }

  // Get the list of sprinklers from the server
  const fetchSprinklerData = async () => {
    try {
      let res = await fetchTimeout(`http://${API_SERVER}/api/sprinklers`);
      let data = await handleError(res);
      setSprinklerList(data);
      setLoading(false);
    } catch (error) {
      setSystemStatus({ "status": "error", "message": error.message });
      setDuration(-1);
      setLoading(false);
    };
  }

  const startSprinkler = async (newDuration) => {
    try {
      let response = await fetchTimeout(`http://${API_SERVER}/api/start_sprinklr/${sprinklr}/duration/${newDuration}`);
      let data = await handleError(response);
      return data;
    } catch(error) {
      setSystemStatus({"status": "error", "message": error.message});
      setDuration(-1);
      return { "systemStatus": "error", "message": error.message };
    };
  }

  const stopSprinkler = async () => {
    try {
      let response = await fetchTimeout(`http://${API_SERVER}/api/stop_sprinklr`);
      let data = await handleError(response);
      return data;
    } catch(error) {
      setSystemStatus({"status": "error", "message": error.message});
      setDuration(-1);
      return { "systemStatus": "error", "message": error.message };
    };
  }
  

  // Fetch the system status and sprinkler data on initial load
  useEffect(() => {
    document.title = "iSprinklr";
    fetchSystemStatus();
    fetchSprinklerData();
  }, []);


  function onSprinklrChange(e) {
    setSprinklr(e.target.value);
  }

  // Handle system status changes, triggered when the user clicks the activate button, or when the countdown timer reaches zero
  // Also triggered if initial page load returns an active system
  function onStatusChange(newDuration, action) {
    if (action === "start") {
      startSprinkler(newDuration).then((response) => {
        console.log("API response: " + response.message);
        if ( response.systemStatus === "error" ) {
          setSystemStatus({"message": response.message, "status": "error"});
          setDuration(-1);
          return;
        } else if (response.systemStatus === "active" && response.zone != sprinklr) {
          setSystemStatus({"status": "active", "message": "Error, system already active on zone " + response.zone});
          setDuration(response.duration);
          setCountDownDate(new Date().getTime() + newDuration * 60000);
          return;
        } 
        setDuration(newDuration);
        setSystemStatus({"status": "active", "message": "System active"}); 
        setCountDownDate(new Date().getTime() + newDuration * 60000);
      });
    } else if (action === "stop") {
      stopSprinkler().then((response) => {
        console.log("API response: " + response.message);
        if ( response.systemStatus === "error" ) {
          setSystemStatus({"status": "error", "message": response.message});
          setDuration(-1);
          return;
        } else {
          setDuration(0);
          setSystemStatus({"status": "inactive", "message": "System is idle"});
          setCountDownDate(0);
        }
      });
    } else if (action === "update" && newDuration > 0) {
      setCountDownDate(new Date().getTime() + newDuration * 1000);
      setDuration(newDuration);
      setSystemStatus({"status": "active", "message": "System active"});
    } else if (action === "update" && newDuration === 0) {
      setDuration(0);
      setSystemStatus({"status": "inactive", "message": "System is idle"});
      setCountDownDate(0);
    } 
  }

  if (isLoading) {
    return <div className="App">Loading...</div>;
  }
  return (
    <Container>
      <h1>###iSprinklr###</h1>
      <p>React based Sprinklr control</p>
      <Stack gap="2">
        <InputCard sprinklerList={sprinklerList} systemStatus={systemStatus} sprinklr={sprinklr} onSprinklrChange={onSprinklrChange} onStatusChange={onStatusChange}/>
        <StatusCard sprinklerList={sprinklerList} duration={duration} sprinklr={sprinklr} systemStatus={systemStatus} countDownDate={countDownDate} onStatusChange={onStatusChange}/>
      </Stack>
    
    </Container>
  );
}

export default App;
