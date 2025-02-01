import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeout } from '../fetchTimeout.js';
import { Card, Container, Form, Row, Col } from 'react-bootstrap';
import config from '../config.js';

// Fetch available module names
const fetchModules = async () => {
    const response = await fetchTimeout(`http://${config.API_SERVER}/api/logs/module_list`);
    if (!response.ok) {
        if (response.status === 422) {
            const error = await response.json();
            throw new Error(`Validation Error: ${error.detail[0].msg}`);
        }
        throw new Error('Failed to fetch module list');
    }
    return response.json();
};

// Fetch logs with filters
const fetchLogs = async ({ module_name, debug_level, lines }) => {
    const params = new URLSearchParams();
    if (module_name) params.append('module_name', module_name);
    if (debug_level) params.append('debug_level', debug_level);
    if (lines) params.append('lines', lines);

    const response = await fetchTimeout(`http://${config.API_SERVER}/api/logs/?${params.toString()}`);
    if (!response.ok) {
        if (response.status === 422) {
            const error = await response.json();
            throw new Error(`Validation Error: ${error.detail[0].msg}`);
        }
        throw new Error('Failed to fetch logs');
    }
    return response.json();
};

function FilterControls({ filters, onFilterChange }) {
    const { data: modules = [], error: modulesError, isLoading: isLoadingModules } = useQuery({
        queryKey: ['modules'],
        queryFn: fetchModules
    });

    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];

    return (
        <Form className="mb-3">
            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Module</Form.Label>
                        <Form.Select
                            value={filters.module_name || ''}
                            onChange={(e) => onFilterChange('module_name', e.target.value)}
                            disabled={isLoadingModules}
                        >
                            <option value="">All Modules</option>
                            {modules.map((module) => (
                                <option key={module} value={module}>
                                    {module}
                                </option>
                            ))}
                        </Form.Select>
                        {modulesError && <Form.Text className="text-danger">{modulesError.message}</Form.Text>}
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Log Level</Form.Label>
                        <Form.Select
                            value={filters.debug_level || ''}
                            onChange={(e) => onFilterChange('debug_level', e.target.value)}
                        >
                            <option value="">All Levels</option>
                            {logLevels.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Lines to Show</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            max="200"
                            value={filters.lines}
                            onChange={(e) => onFilterChange('lines', e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Range: 1-200 lines
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>
        </Form>
    );
}

function LogDisplay({ logs, error, isLoading }) {
    if (isLoading) return <div>Loading logs...</div>;
    if (error) return <div className="text-danger">Error: {error.message}</div>;
    if (!logs || logs.length === 0) return <div>No logs found</div>;

    const getLogStyle = (line) => {
        if (line.includes(' ERROR: ')) return { color: '#dc3545' }; // red
        if (line.includes(' WARNING: ')) return { color: '#ffc107' }; // yellow
        if (line.includes(' DEBUG: ')) return { color: '#0d6efd' }; // blue
        return {}; // default color for INFO
    };

    return (
        <Card style={{ height: 'calc(80vh - 200px)', overflowY: 'auto' }}>
            <Card.Body>
                <pre style={{ margin: 0 }}>
                    {[...logs].reverse().map((line, index) => (
                        <div key={index} style={getLogStyle(line)}>
                            {line}
                        </div>
                    ))}
                </pre>
            </Card.Body>
        </Card>
    );
}

function Logs() {
    const [filters, setFilters] = useState({
        module_name: '',
        debug_level: '',
        lines: 100
    });

    const { data: logs, error, isLoading } = useQuery({
        queryKey: ['logs', filters],
        queryFn: () => fetchLogs(filters),
        refetchInterval: 5000 // Refresh every 5 seconds
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Container>
            <h2 className="py-4">System Logs</h2>
            <FilterControls filters={filters} onFilterChange={handleFilterChange} />
            <LogDisplay logs={logs} error={error} isLoading={isLoading} />
        </Container>
    );
}

export default Logs;
