 import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useRef } from 'react';
import { Form, InputGroup, Container, Button, Card, Stack } from "react-bootstrap";

const Sprinklers = { "1": "East", "2": "West", "3": "Backyard" }

function SprinklrSelect({onChange}) {
  function MakeList() {
    const options = [];
    for (const key in Sprinklers) {
      if (Sprinklers.hasOwnProperty(key)){
        options.push(<option value={key}>{Sprinklers[key]}</option>);
      }
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

function DurationInput({ visible, setDuration }) {
  const [validated, setValidated] = useState(false);
  const [buttonColor, setButtonColor] = useState("primary");
  const formValue = useRef(null);

  function onChange(e) {
    formValue.current = e.target.value;
  }
  // First, check to make sure input is valid
  // I didn't pass duration state down here, since it can be infered
  // Use buttonColor to indicate state of the system. If "primary" the system is stopped
  // If "danger" the system is running
  function handleSubmit(e) {
    if (e.target.checkValidity() === false) { 
      e.preventDefault(); 
      setValidated(true);
      return 
    };
    e.preventDefault();
    if (buttonColor === "primary") {
      setDuration(formValue.current);
      setButtonColor("danger");
      console.log("Sumbitted");
    } else {
      setDuration(null);
      setButtonColor("primary");
    }
  };
  
  // Don't render if a spinkler hasn't been selected yet
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

function InputCard({duration, setDuration, sprinklr, onSprinklrChange}) {
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
            <SprinklrSelect onChange={onSprinklrChange} />
            <DurationInput visible={isVisible} setDuration={setDuration}/>
          </Stack>
        </Card.Body>
      </Card>
    </>
  )
}

function StatusCard({duration, sprinklr}) {
  let color = "bg-info";
  let msg = "System inactive";

  if (duration > 0) {
    color = "bg-success";
    msg = `${Sprinklers[sprinklr]} zone is running`;
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
  const [duration, setDuration] = useState(null);
  const [sprinklr, setSprinklr] = useState("0");
  
  function onSprinklrChange(e) {
    setSprinklr(e.target.value);
  }

  return (
    <Container>
      <h1>###iSprinklr###</h1>
      <p>React based Sprinklr control</p>
      <Stack gap="2">
        <InputCard duration={duration} setDuration={setDuration} sprinklr={sprinklr} onSprinklrChange={onSprinklrChange}/>
        <StatusCard duration={duration} sprinklr={sprinklr}/>
      </Stack>
    
    </Container>
  );
}

export default App;
