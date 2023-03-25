// import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, InputGroup, Container, Button, Card, Stack } from "react-bootstrap";

function SprinklrSelect() {
  return (
    <InputGroup>
      <InputGroup.Text>Select Sprinklr</InputGroup.Text>
        <Form.Select>
          <option>Select sprinklr</option>
       </Form.Select>
    </InputGroup>
  )
}

function DurationInput() {
  return (
   <InputGroup>
      <Form.Control type="text"></Form.Control>
      <Button variant="success">Activate!</Button>
    </InputGroup>
  )
}

function InputCard() {
  return (
    <>
      <Card>
        <Card.Body>
          <Stack gap="2">
            <SprinklrSelect />
            <DurationInput />
          </Stack>
        </Card.Body>
      </Card>
    </>
  )
}

function StatusCard() {
  return (
    <>
      <Card bg="info">
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
      </Stack>
    
    </Container>
  );
}

export default App;
