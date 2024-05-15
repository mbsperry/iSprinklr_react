import { Routes, Route, Outlet, Link } from "react-router-dom";
import { useEffect } from "react";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import Controller from './pages/Controller.js';
import Scheduler from './pages/Scheduler.js';
import APILog from './pages/APILog.js';
import SchedulerLog from './pages/SchedulerLog.js';
import SerialLog from './pages/SerialLog.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    document.title = "iSprinklr";
  }, []);

  return (
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Controller />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="api_log" element={<APILog />} />
            <Route path="scheduler_log" element={<SchedulerLog />} />
            <Route path="serial_log" element={<SerialLog />} />

            {/* Using path="*"" means "match anything", so this route
              acts like a catch-all for URLs that we don't have explicit
              routes for. */}
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
  )
} 

function Layout() {
  return (
    <>
          <Navbar expand="lg" variant="dark" className="bg-dark bg-gradient">
              <Container>
                  <Navbar.Brand >iSprinklr</Navbar.Brand>
                  <Navbar.Toggle aria-controls="basic-navbar-nav" />
                  <Navbar.Collapse id="basic-navbar-nav">
                      <Nav className="me-auto">
                          <Nav.Link as={Link} to="/">Controller</Nav.Link>
                          <Nav.Link as={Link} to="/scheduler">Scheduler</Nav.Link>
                          <NavDropdown title="Logs" id="basic-nav-dropdown">
                              <NavDropdown.Item as={Link} to="/api_log">API Log</NavDropdown.Item>
                              <NavDropdown.Item as={Link} to="/scheduler_log">Scheduler Log</NavDropdown.Item>
                              <NavDropdown.Item as={Link} to="/serial_log">Serial Log</NavDropdown.Item>
                          </NavDropdown>
                      </Nav>
                  </Navbar.Collapse>
              </Container>
          </Navbar>
      <Outlet />
    </>
  );
}


function NoMatch() {
    return (
      <div>
        <h2>Nothing to see here!</h2>
        <p>
          <Link to="/">Go to the home page</Link>
        </p>
      </div>
    );
  }