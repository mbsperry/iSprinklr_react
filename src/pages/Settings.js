import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Stack } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import config from '../config';
import { fetchTimeout } from '../fetchTimeout.js';

// Fetch the API configuration
async function fetchApiConfig() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/system/config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch API configuration: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Update the API configuration
async function updateApiConfig(newConfig) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/system/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newConfig),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update API configuration: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

function Settings() {
  const queryClient = useQueryClient();
  const [apiServer, setApiServer] = useState(config.API_SERVER);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Fetch the API configuration
  const { 
    data: apiConfig,
    error: fetchError,
    isLoading: isLoadingConfig
  } = useQuery({
    queryKey: ['apiConfig'],
    queryFn: fetchApiConfig
  });
  
  // Mutation for updating the API configuration
  const updateApiConfigMutation = useMutation({
    mutationFn: updateApiConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiConfig'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });
  
  // Handle saving the API server address (frontend config)
  const handleSaveApiServer = () => {
    // In a real implementation, this would update the config file through a server endpoint
    // For now, we'll just update the in-memory config and show a success message
    config.API_SERVER = apiServer;
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  // Handle updating the API configuration (backend config)
  const handleSaveApiConfig = () => {
    if (!apiConfig) return;
    updateApiConfigMutation.mutate(apiConfig);
  };
  
  // Handle API config field changes
  const handleApiConfigChange = (key, value) => {
    if (apiConfig) {
      const updatedConfig = { ...apiConfig, [key]: value };
      // Update local state without triggering a mutation
      queryClient.setQueryData(['apiConfig'], updatedConfig);
    }
  };

  return (
    <Container className="my-4">
      <h1>Settings</h1>
      
      {fetchError && <Alert variant="danger">{fetchError.message}</Alert>}
      {updateApiConfigMutation.error && <Alert variant="danger">{updateApiConfigMutation.error.message}</Alert>}
      {saveSuccess && <Alert variant="success">Settings saved successfully!</Alert>}
      
      <Stack gap={4}>
        <Card>
          <Card.Header>React Frontend Configuration</Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>API Server Address</Form.Label>
                <Form.Control 
                  type="text" 
                  value={apiServer} 
                  onChange={(e) => setApiServer(e.target.value)} 
                  placeholder="127.0.0.1:8000"
                />
                <Form.Text className="text-muted">
                  Format: IP_ADDRESS:PORT (e.g., 127.0.0.1:8000)
                </Form.Text>
              </Form.Group>
              <Button 
                variant="primary" 
                onClick={handleSaveApiServer}
              >
                Save Frontend Config
              </Button>
            </Form>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>API Configuration</Card.Header>
          <Card.Body>
            {isLoadingConfig ? (
              <p>Loading API configuration...</p>
            ) : apiConfig ? (
              <Form>
                {Object.entries(apiConfig).map(([key, value]) => {
                  // Handle boolean switches
                  if (key === 'dummy_mode' || key === 'schedule_on_off' || key === 'USE_STRICT_CORS') {
                    // Ensure value is a string before calling toLowerCase, or handle boolean true directly.
                    // Default to false if value is null, undefined, or not 'true' (string) or true (boolean).
                    let isChecked = false;
                    if (typeof value === 'string') {
                      isChecked = value.toLowerCase() === 'true';
                    } else if (typeof value === 'boolean') {
                      isChecked = value;
                    }
                    
                    // Format the label to be more readable
                    let formattedLabel = '';
                    if (key === 'dummy_mode') {
                      formattedLabel = 'Dummy Mode';
                    } else if (key === 'schedule_on_off') {
                      formattedLabel = 'Enable Scheduled Runs';
                    } else if (key === 'USE_STRICT_CORS') {
                      formattedLabel = 'Strict CORS Policy';
                    }
                      
                    // Helper text for each option
                    let helperText = '';
                    if (key === 'dummy_mode') {
                      helperText = 'When enabled, the system operates without sending actual commands to hardware';
                    } else if (key === 'schedule_on_off') {
                      helperText = 'When enabled, scheduler will run active schedule daily';
                    } else if (key === 'USE_STRICT_CORS') {
                      helperText = 'When enabled, strict CORS policies will be enforced for API requests';
                    }
                      
                    return (
                      <Form.Group className="mb-3" key={key}>
                        <Form.Check 
                          type="switch"
                          id={`switch-${key}`}
                          label={formattedLabel}
                          checked={isChecked}
                          onChange={(e) => handleApiConfigChange(key, e.target.checked ? 'True' : 'False')}
                        />
                        <Form.Text className="text-muted ps-4">
                          {helperText}
                        </Form.Text>
                      </Form.Group>
                    );
                  }
                  // Handle log_level as a dropdown
                  if (key === 'log_level') {
                    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
                    return (
                      <Form.Group className="mb-3" key={key}>
                        <Form.Label>Log Level</Form.Label>
                        <Form.Select
                          value={value}
                          onChange={(e) => handleApiConfigChange(key, e.target.value)}
                        >
                          {logLevels.map(level => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Controls the verbosity of server logs
                        </Form.Text>
                      </Form.Group>
                    );
                  }
                  
                  // ESP_controller_IP field
                  if (key === 'ESP_controller_IP') {
                    return (
                      <Form.Group className="mb-3" key={key}>
                        <Form.Label>ESP Controller IP Address</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={value}
                          onChange={(e) => handleApiConfigChange(key, e.target.value)}
                          placeholder="192.168.1.100"
                        />
                        <Form.Text className="text-muted">
                          IP address of the ESP32 hardware controller
                        </Form.Text>
                      </Form.Group>
                    );
                  }
                  
                  // domain field
                  if (key === 'domain') {
                    return (
                      <Form.Group className="mb-3" key={key}>
                        <Form.Label>API Server Domain</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={value}
                          onChange={(e) => handleApiConfigChange(key, e.target.value)}
                          placeholder="127.0.0.1"
                        />
                        <Form.Text className="text-muted">
                          Domain address for the API server
                        </Form.Text>
                      </Form.Group>
                    );
                  }
                  
                  // All other fields as regular text inputs
                  return (
                    <Form.Group className="mb-3" key={key}>
                      <Form.Label>{key}</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={value}
                        onChange={(e) => handleApiConfigChange(key, e.target.value)}
                      />
                    </Form.Group>
                  );
                })}
                <Button 
                  variant="primary" 
                  onClick={handleSaveApiConfig}
                  disabled={updateApiConfigMutation.isPending}
                >
                  {updateApiConfigMutation.isPending ? 'Saving...' : 'Save API Config'}
                </Button>
              </Form>
            ) : (
              <p>No API configuration available.</p>
            )}
          </Card.Body>
        </Card>
      </Stack>
    </Container>
  );
}

export default Settings;
