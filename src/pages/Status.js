import { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Row, Col, Badge } from 'react-bootstrap';
import config from '../config.js';
import { fetchTimeout } from '../fetchTimeout.js';
import '../App.css';

import 'bootstrap/dist/css/bootstrap.min.css';

function StatusCard({ title, children, className = "" }) {
  return (
    <Card className={`mb-3 ${className}`}>
      <Card.Header as="h5">{title}</Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}

function Status() {
  const [statusData, setStatusData] = useState(null);
  const [lastScheduleRun, setLastScheduleRun] = useState(null);
  const [lastSprinklerRun, setLastSprinklerRun] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Handle errors thrown by fetch
  const handleError = response => {
    if (!response.ok) { 
      throw Error(response.statusText);
    } else {
      return response.json();
    }
  };

  // Get the system status from the server
  const fetchStatusData = async () => {
    try {
      const res = await fetchTimeout(`http://${config.API_SERVER}/api/system/status`);
      const data = await handleError(res);
      setStatusData(data);
      setLoading(false);
    } catch(error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Get the last schedule run information
  const fetchLastScheduleRun = async () => {
    try {
      const res = await fetchTimeout(`http://${config.API_SERVER}/api/system/last-schedule-run`);
      const data = await handleError(res);
      setLastScheduleRun(data);
    } catch(error) {
      console.error("Error fetching last schedule run:", error);
    }
  };

  // Get the last sprinkler run information
  const fetchLastSprinklerRun = async () => {
    try {
      const res = await fetchTimeout(`http://${config.API_SERVER}/api/system/last-sprinkler-run`);
      const data = await handleError(res);
      setLastSprinklerRun(data);
    } catch(error) {
      console.error("Error fetching last sprinkler run:", error);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      await fetchStatusData();
      await fetchLastScheduleRun();
      await fetchLastSprinklerRun();
    };

    fetchAllData();

    // Set up polling to refresh the data every 10 seconds
    const intervalId = setInterval(() => {
      fetchAllData();
    }, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div className="App">Loading...</div>;
  }

  if (error) {
    return (
      <Container>
        <h1>System Status</h1>
        <Card className="bg-danger bg-opacity-25">
          <Card.Body>
            <Card.Title>Error</Card.Title>
            <Card.Text>{error}</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <h1>System Status</h1>

      <StatusCard 
        title="System Overview" 
        className={statusData.systemStatus === "active" ? "bg-success bg-opacity-25" : "bg-info bg-opacity-25"}
      >
        <ListGroup variant="flush">
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Status:</strong></Col>
              <Col md={8}>
                <Badge bg={statusData.systemStatus === "active" ? "success" : "info"}>
                  {statusData.systemStatus}
                </Badge>
              </Col>
            </Row>
          </ListGroup.Item>
          {statusData.systemStatus === "active" && (
            <>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Active Zone:</strong></Col>
                  <Col md={8}>{statusData.active_zone}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Duration:</strong></Col>
                  <Col md={8}>{statusData.duration} seconds</Col>
                </Row>
              </ListGroup.Item>
            </>
          )}
          {statusData.message && (
            <ListGroup.Item>
              <Row>
                <Col md={4}><strong>Message:</strong></Col>
                <Col md={8}>{statusData.message}</Col>
              </Row>
            </ListGroup.Item>
          )}
        </ListGroup>
      </StatusCard>

      <StatusCard title="Last Run Information" className="bg-warning bg-opacity-10">
        <Row>
          <Col md={6}>
            <h6>Last Manual Run</h6>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Zone:</strong></Col>
                  <Col md={8}>{lastSprinklerRun?.zone || 'None'}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Time:</strong></Col>
                  <Col md={8}>{lastSprinklerRun?.timestamp ? formatTimestamp(lastSprinklerRun.timestamp) : 'Never'}</Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={6}>
            <h6>Last Schedule Run</h6>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Name:</strong></Col>
                  <Col md={8}>{lastScheduleRun?.name || 'None'}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Time:</strong></Col>
                  <Col md={8}>{lastScheduleRun?.timestamp ? formatTimestamp(lastScheduleRun.timestamp) : 'Never'}</Col>
                </Row>
              </ListGroup.Item>
              {lastScheduleRun?.message && (
                <ListGroup.Item>
                  <Row>
                    <Col md={4}><strong>Status:</strong></Col>
                    <Col md={8}>
                      <Badge bg={
                        lastScheduleRun.message === 'success' ? 'success' : 
                        lastScheduleRun.message === 'failure' ? 'danger' : 
                        'warning'
                      }>
                        {lastScheduleRun.message}
                      </Badge>
                    </Col>
                  </Row>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
        </Row>
      </StatusCard>

      <StatusCard title="ESP32 Information" className="bg-light">
        <ListGroup variant="flush">
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Status:</strong></Col>
              <Col md={8}>
                <Badge bg={statusData.esp_status.status === "ok" ? "success" : "danger"}>
                  {statusData.esp_status.status}
                </Badge>
              </Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Uptime:</strong></Col>
              <Col md={8}>{formatUptime(statusData.esp_status.uptime_ms)}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Reset Reason:</strong></Col>
              <Col md={8}>{statusData.esp_status.reset_reason}</Col>
            </Row>
          </ListGroup.Item>
        </ListGroup>
      </StatusCard>

      <Row>
        <Col md={6}>
          <StatusCard title="Chip Information">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Model:</strong></Col>
                  <Col md={8}>{statusData.esp_status.chip.model}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Revision:</strong></Col>
                  <Col md={8}>{statusData.esp_status.chip.revision}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>Cores:</strong></Col>
                  <Col md={8}>{statusData.esp_status.chip.cores}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={4}><strong>IDF Version:</strong></Col>
                  <Col md={8}>{statusData.esp_status.idf_version}</Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </StatusCard>
        </Col>
        <Col md={6}>
          <StatusCard title="Memory Information">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col md={6}><strong>Free Heap:</strong></Col>
                  <Col md={6}>{(statusData.esp_status.memory.free_heap / (1024 * 1024)).toFixed(2)} MB</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={6}><strong>Min Free Heap:</strong></Col>
                  <Col md={6}>{(statusData.esp_status.memory.min_free_heap / (1024 * 1024)).toFixed(2)} MB</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col md={6}><strong>Task Stack High Water Mark:</strong></Col>
                  <Col md={6}>{statusData.esp_status.task.stack_hwm} bytes</Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </StatusCard>
        </Col>
      </Row>

      <StatusCard title="Network Information" className="bg-light">
        <ListGroup variant="flush">
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Connected:</strong></Col>
              <Col md={8}>
                <Badge bg={statusData.esp_status.network.connected ? "success" : "danger"}>
                  {statusData.esp_status.network.connected ? "Yes" : "No"}
                </Badge>
              </Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Type:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.type}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>IP Address:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.ip}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>MAC Address:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.mac}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Gateway:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.gateway}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Subnet:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.subnet}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Connection Speed:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.speed}</Col>
            </Row>
          </ListGroup.Item>
          <ListGroup.Item>
            <Row>
              <Col md={4}><strong>Duplex:</strong></Col>
              <Col md={8}>{statusData.esp_status.network.duplex}</Col>
            </Row>
          </ListGroup.Item>
        </ListGroup>
      </StatusCard>
    </Container>
  );
}

export default Status;
