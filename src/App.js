 import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchTimeout } from './fetchTimeout.js';
import { useCountdown } from './useCountdown';
import { useState, useRef, useEffect } from 'react';
import { Form, InputGroup, Container, Button, Card, Stack } from "react-bootstrap";


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
  let buttonColor = (systemStatus === "active") ? "danger" : "primary";

  function onChange(e) {
    formValue.current = e.target.value;
  }
  // First, check to make sure input is valid
  function handleSubmit(e) {
    if (systemStatus === "inactive") {
      if (e.target.checkValidity() === false) {
        e.preventDefault();
        setValidated(true);
        return
      };
    }
    e.preventDefault();
    if (buttonColor === "primary" && systemStatus === "inactive") {
      onStatusChange(formValue.current);
      buttonColor = 'danger';
    } else {
      onStatusChange(0);
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
  let msg = systemStatus;
  const [min,sec] = useCountdown(countDownDate);

  if (systemStatus === "active" && countDownDate - new Date().getTime() < 0) {
    onStatusChange(0);
  }

  if (systemStatus === "active") { 
    color = "bg-success";
    msg = `${sprinklerList[sprinklr-1].name} zone is running. Remaining time: ${min}:${sec}`;
  } else if (systemStatus === "inactive") {
    color = "bg-info";
    msg = "System is Idle";
  } else {
    color = "bg-danger";
    msg = systemStatus;
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
  // Top level state variable, which spinklr has been selected and what is the duration
  // If duration is a positive number the system has been activated
  const [duration, setDuration] = useState(0);
  const [sprinklr, setSprinklr] = useState("0");
  const [sprinklerList, setSprinklerList] = useState([]);
  const [systemStatus, setSystemStatus] = useState("inactive");
  const [isLoading, setLoading] = useState(true);
  const [countDownDate, setCountDownDate] = useState(0);

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
    fetchTimeout("http://192.168.88.160:8080/api/status")
      .then(handleError)
      .then((data) => { 
        // setSystemStatus(data.message);
        if (data.systemStatus === "error") {
          setSystemStatus(data.message);
          return;
        }
        setDuration(Number(data.duration));
        if (data.duration > 0) {
          setSprinklr(data.zone);
        }
      })
      .catch((error) => {
        setSystemStatus(error.message);
        setDuration(-1);
      });
  }

  // Get the list of sprinklers from the server
  const fetchSprinklerData = async () => {
    fetchTimeout("http://192.168.88.160:8080/api/sprinklers")
      .then(handleError)
      .then((data) => { 
        setSprinklerList(data);
        setLoading(false);
      })
      .catch((error) => { 
        setSystemStatus(error.message);
        setDuration(-1);
        setLoading(false);
      });
  }

  const startSprinkler = async (newDuration) => {
    fetchTimeout("http://192.168.88.160:8080/api/start_sprinklr/" + sprinklr + "/duration/" + newDuration)
    .then(handleError)
    .then((data) => {
      console.log(data.message)
      return data;
    })
    .catch((error) => {
      setSystemStatus(error.message);
      setDuration(-1);
    });
  }

  const stopSprinkler = async () => {
    fetchTimeout("http://192.168.88.160:8080/api/stop_sprinklr")
    .then(handleError)
    .then((data) => {
      console.log(data.message)
      return data;
    })
    .catch((error) => {
      setSystemStatus(error.message);
      setDuration(-1);
    });
  }
  

  useEffect(() => {
    document.title = "iSprinklr";
    fetchSystemStatus();
    fetchSprinklerData();
  }, []);


  function onSprinklrChange(e) {
    setSprinklr(e.target.value);
  }

  // Handle duration status changes, triggered when the user clicks the activate button, or when the countdown timer reaches zero
  function onStatusChange(newDuration) {
    if (newDuration > 0) {
      const response = startSprinkler(newDuration);
      if ( response.systemStatus === "error" ) {
        setSystemStatus(response.message);
        setDuration(-1);
        return;
      } else if (response.systemStatus === "active" && response.zone != sprinklr) {
        setSystemStatus("Error, system already active on zone " + response.zone);
        setDuration(response.duration);
        setCountDownDate(new Date().getTime() + newDuration * 60000);
        return;
      }
      setDuration(newDuration);
      setSystemStatus("active"); 
      setCountDownDate(new Date().getTime() + newDuration * 60000);
    } else if (newDuration === 0) {
      stopSprinkler();
      setDuration(0);
      setSystemStatus("inactive");
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
