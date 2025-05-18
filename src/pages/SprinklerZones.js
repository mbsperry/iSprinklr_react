import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Stack, Table } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import config from '../config';
import { fetchTimeout } from '../fetchTimeout.js';

// API Functions
async function fetchSprinklerZones() {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers`);
  if (!response.ok) {
    throw new Error('Failed to fetch sprinkler zones');
  }
  return response.json();
}

async function updateSprinklerZones(zones) {
  const response = await fetchTimeout(`http://${config.API_SERVER}/api/sprinklers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zones),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update sprinkler zones' }));
    throw new Error(errorData.detail || 'Failed to update sprinkler zones');
  }
  return response.json();
}

function SprinklerZones() {
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const [editingZones, setEditingZones] = useState([]);
  const [originalZones, setOriginalZones] = useState([]);

  // Fetch sprinkler zones data
  const { 
    data: sprinklerZones = [], 
    isLoading, 
    error,
    isSuccess
  } = useQuery({
    queryKey: ['sprinklerZones'],
    queryFn: fetchSprinklerZones,
    onSuccess: (data) => {
      const zonesArray = Array.isArray(data) ? data : [];
      setEditingZones(JSON.parse(JSON.stringify(zonesArray)));
      setOriginalZones(JSON.parse(JSON.stringify(zonesArray)));
    },
    // Ensure we always get fresh data
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Effect to sync component state with query data
  React.useEffect(() => {
    if (isSuccess && sprinklerZones) {
      const zonesArray = Array.isArray(sprinklerZones) ? sprinklerZones : [];
      
      if (zonesArray.length > 0 && editingZones.length === 0) {
        setEditingZones(JSON.parse(JSON.stringify(zonesArray)));
        setOriginalZones(JSON.parse(JSON.stringify(zonesArray)));
      }
    }
  }, [isSuccess, sprinklerZones, editingZones.length]);

  // Mutation for updating sprinkler zones
  const updateZonesMutation = useMutation({
    mutationFn: updateSprinklerZones,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprinklerZones'] });
      setAlert({ show: true, variant: 'success', message: 'Sprinkler zones updated successfully!' });
      
      // Update original zones with the latest data
      if (data && data.zones) {
        const zonesArray = Array.isArray(data.zones) ? data.zones : [];
        setOriginalZones(JSON.parse(JSON.stringify(zonesArray)));
        setEditingZones(JSON.parse(JSON.stringify(zonesArray)));
      } else {
        // Refresh the data from the server since we can't use the response directly
        queryClient.fetchQuery({ queryKey: ['sprinklerZones'] });
      }
    },
    onError: (error) => {
      setAlert({ show: true, variant: 'danger', message: `Error updating sprinkler zones: ${error.message}` });
    }
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(editingZones) !== JSON.stringify(originalZones);
  };

  // Handle zone name changes
  const handleZoneNameChange = (index, newName) => {
    const updatedZones = [...editingZones];
    updatedZones[index] = { ...updatedZones[index], name: newName };
    setEditingZones(updatedZones);
  };

  // Add a new zone
  const handleAddZone = () => {
    // Find the highest existing zone number
    const maxZone = editingZones.reduce((max, zone) => Math.max(max, zone.zone), 0);
    const newZoneNumber = maxZone + 1;
    
    setEditingZones([
      ...editingZones,
      {
        zone: newZoneNumber,
        name: `Zone ${newZoneNumber}`
      }
    ]);
  };

  // Delete a zone
  const handleDeleteZone = (index) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      const updatedZones = [...editingZones];
      updatedZones.splice(index, 1);
      setEditingZones(updatedZones);
    }
  };

  // Save changes
  const handleSave = () => {
    updateZonesMutation.mutate(editingZones);
  };

  // Reset to original values
  const handleReset = () => {
    setEditingZones(JSON.parse(JSON.stringify(originalZones)));
    setAlert({ show: false, variant: '', message: '' });
  };

  if (isLoading) return <Container><p>Loading sprinkler zones data...</p></Container>;
  if (error) return <Container><Alert variant="danger">Error loading sprinkler zones: {error.message}</Alert></Container>;

  return (
    <Container className="my-4">
      <h1>Sprinkler Zones Configuration</h1>
      
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
          {alert.message}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header>
          <Stack direction="horizontal" gap={3}>
            <h5 className="mb-0">Configure Zones</h5>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleAddZone}
              className="ms-auto"
            >
              Add Zone
            </Button>
          </Stack>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Zone Number</th>
                <th style={{ width: '60%' }}>Zone Name</th>
                <th style={{ width: '20%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {editingZones.map((zone, index) => (
                <tr key={index}>
                  <td>{zone.zone}</td>
                  <td>
                    <Form.Control
                      type="text"
                      value={zone.name}
                      onChange={(e) => handleZoneNameChange(index, e.target.value)}
                      placeholder="Enter zone name"
                    />
                  </td>
                  <td className="text-center">
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteZone(index)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {editingZones.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center">No zones configured. Click "Add Zone" to create one.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer>
          <Stack direction="horizontal" gap={2}>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={updateZonesMutation.isPending || !hasUnsavedChanges()}
            >
              {updateZonesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={handleReset}
              disabled={!hasUnsavedChanges()}
            >
              Reset
            </Button>
          </Stack>
        </Card.Footer>
      </Card>

    </Container>
  );
}

export default SprinklerZones;
