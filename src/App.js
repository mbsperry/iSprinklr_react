 import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { Form, InputGroup, Container, Button, Card, Stack } from "react-bootstrap";

const Sprinklers = { "1": "East", "2": "West", "3": "Backyard" }
const BLUE = "#cfe2ff";
const GREEN = "#d1e7dd";
const RED = "#f8d7da";

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

function DurationInput({sprinklr}) {
  const [validated, setValidated] = useState(false);
  function handleSubmit(e) {
    if (e.target.checkValidity() === false) { 
      e.preventDefault(); 
      setValidated(true);
      return 
    };
    e.preventDefault();
    console.log("Sumbitted");
    console.log(e.target)
  }
  if (sprinklr < 1) {
    return <></>
  }
  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Control required type="number" min="1" step="1" max="60" placeholder='Duration in whole minutes'></Form.Control>
      <Form.Control.Feedback type="invalid">Please enter duration in whole minutes only. Max 60 min.</Form.Control.Feedback>
      <Button type="submit" className="mt-2">Activate!</Button>
    </Form>
  )
}

function InputCard() {
  const [sprinklr, setSprinklr] = useState("0");
  
  function onSprinklrChange(e) {
    console.log(e.target.value);
    setSprinklr(e.target.value);
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Stack gap="2">
            <SprinklrSelect onChange={onSprinklrChange} />
            <DurationInput sprinklr={sprinklr}/>
          </Stack>
        </Card.Body>
      </Card>
    </>
  )
}

function AlertCard() {
  return (
    <>
      <Card bg="danger" className="d-none">
        <Card.Body>
          This is an alert
        </Card.Body>
      </Card>
    </>
  )
}

function StatusCard() {
  return (
    <>
      <Card className="bg-info bg-opacity-25">
        <Card.Body>
          System disabled
        </Card.Body>
      </Card>
    </>
  )
}

function App() {
  return (
    <Container>
      <h1>###iSprinklr###</h1>
      <p>React based Sprinklr control</p>
      <Stack gap="2">
        <InputCard />
        <StatusCard />
        <AlertCard />
      </Stack>
    
    </Container>
  );
}

export default App;
