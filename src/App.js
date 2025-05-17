import { Routes, Route, Outlet, Link } from "react-router-dom";
import { useEffect } from "react";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import Controller from './pages/Controller.js';
import Logs from './pages/Logs.js';
import Status from './pages/Status.js';
import Settings from './pages/Settings.js';
import ScheduleEditor from './pages/ScheduleEditor.js'; // New schedule editor

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
            <Route path="logs" element={<Logs />} />
            <Route path="status" element={<Status />} />
            <Route path="settings" element={<Settings />} />
            <Route path="schedule-editor" element={<ScheduleEditor />} /> {/* Schedule Editor uses its own route */}

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
                          <Nav.Link as={Link} to="/schedule-editor">Schedule Editor</Nav.Link> {/* Schedule Editor link remains */}
                          <Nav.Link as={Link} to="/logs">Logs</Nav.Link>
                          <Nav.Link as={Link} to="/status">Status</Nav.Link>
                          <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
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
