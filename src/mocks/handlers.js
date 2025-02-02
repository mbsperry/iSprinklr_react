import { http, HttpResponse } from 'msw'

// Default success handlers
export const handlers = [
  // System endpoints
  http.get('http://127.0.0.1:8000/api/system/status', () => {
    return HttpResponse.json({
      systemStatus: "active",
      message: null,
      active_zone: 1,
      duration: 300
    })
  }),

  http.get('http://127.0.0.1:8000/api/system/last-sprinkler-run', () => {
    return HttpResponse.json({
      zone: 1,
      timestamp: 1706914800.123
    })
  }),

  http.get('http://127.0.0.1:8000/api/system/last-schedule-run', () => {
    return HttpResponse.json({
      name: "Evening Schedule",
      timestamp: 1706914800.123,
      message: "success"
    })
  }),

  // Sprinkler endpoints
  http.get('http://127.0.0.1:8000/api/sprinklers/', () => {
    return HttpResponse.json([
      { zone: 1, name: "Front Lawn" },
      { zone: 2, name: "Back Lawn" },
      { zone: 3, name: "Garden" }
    ])
  }),

  http.put('http://127.0.0.1:8000/api/sprinklers/', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      message: "Success",
      zones: data
    })
  }),

  http.post('http://127.0.0.1:8000/api/sprinklers/start', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      message: `Zone ${data.zone} started`
    })
  }),

  http.post('http://127.0.0.1:8000/api/sprinklers/stop', () => {
    return HttpResponse.json({
      message: "System stopped"
    })
  }),

  // Scheduler endpoints
  http.get('http://127.0.0.1:8000/api/scheduler/schedules', () => {
    return HttpResponse.json([
      {
        schedule_name: "Evening Schedule",
        schedule_items: [
          { zone: 1, day: "M", duration: 300 }
        ]
      },
      {
        schedule_name: "Morning Schedule",
        schedule_items: [
          { zone: 2, day: "T", duration: 300 }
        ]
      }
    ])
  }),

  http.get('http://127.0.0.1:8000/api/scheduler/schedule/:name', () => {
    return HttpResponse.json({
      schedule_name: "Evening Schedule",
      schedule_items: [
        { zone: 1, day: "M", duration: 300 }
      ]
    })
  }),

  http.post('http://127.0.0.1:8000/api/scheduler/schedule', async ({ request }) => {
    const schedule = await request.json()
    return HttpResponse.json({
      message: "Success",
      schedule: {
        schedule_name: schedule.schedule_name,
        schedule_items: schedule.schedule_items || []
      }
    })
  }),

  http.put('http://127.0.0.1:8000/api/scheduler/schedule', async ({ request }) => {
    const schedule = await request.json()
    return HttpResponse.json({
      message: "Success",
      schedule: {
        schedule_name: schedule.schedule_name,
        schedule_items: schedule.schedule_items || []
      }
    })
  }),

  http.delete('http://127.0.0.1:8000/api/scheduler/schedule/:name', () => {
    return HttpResponse.json({
      message: "Success"
    })
  }),

  http.post('http://127.0.0.1:8000/api/scheduler/schedule/:name/run', () => {
    return HttpResponse.json({
      message: "Started running schedule",
      zones: [
        { zone: 1, duration: 300 }
      ]
    })
  }),

  // Additional scheduler endpoints
  http.get('http://127.0.0.1:8000/api/scheduler/active', () => {
    return HttpResponse.json({
      schedule_name: "Evening Schedule",
      schedule_items: [
        { zone: 1, day: "M", duration: 300 }
      ]
    })
  }),

  http.put('http://127.0.0.1:8000/api/scheduler/active/:name', () => {
    return HttpResponse.json({
      message: "Success",
      active_schedule: {
        schedule_name: "Evening Schedule",
        schedule_items: [
          { zone: 1, day: "M", duration: 300 }
        ]
      }
    })
  }),

  http.get('http://127.0.0.1:8000/api/scheduler/on_off', () => {
    return HttpResponse.json({
      schedule_on_off: true
    })
  }),

  http.put('http://127.0.0.1:8000/api/scheduler/on_off', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      schedule_on_off: data.schedule_on_off
    })
  }),

  http.post('http://127.0.0.1:8000/api/scheduler/active/run', () => {
    return HttpResponse.json({
      message: "Started running active schedule",
      zones: [
        { zone: 1, duration: 300 }
      ]
    })
  }),

  // Logs endpoints
  http.get('http://127.0.0.1:8000/api/logs', () => {
    return HttpResponse.json([
      "2024-02-02 21:45:00 sprinkler_service INFO: Started zone 1"
    ])
  }),

  http.get('http://127.0.0.1:8000/api/logs/module_list', () => {
    return HttpResponse.json([
      "sprinkler_service",
      "system_controller",
      "scheduler"
    ])
  })
]

// Error Handler Function Definitions

// Scheduler Error Handlers
const createScheduleNotFoundError = () => {
  return http.get('http://127.0.0.1:8000/api/scheduler/schedule/default', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Schedule 'default' not found"]
      }),
      { status: 404 }
    )
  })
}

const createScheduleServerError = () => {
  return http.get('http://127.0.0.1:8000/api/scheduler/schedule/default', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createSprinklerListServerError = () => {
  return http.get('http://127.0.0.1:8000/api/sprinklers/', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to load sprinklers data, see logs for details"]
      }),
      { status: 500 }
    )
  })
}

const createScheduleCreateValidationError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/schedule', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Invalid schedule data: Duplicate schedule name"]
      }),
      { status: 400 }
    )
  })
}

const createScheduleCreateServerError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/schedule', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createScheduleUpdateValidationError = () => {
  return http.put('http://127.0.0.1:8000/api/scheduler/schedule', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Invalid schedule data"]
      }),
      { status: 400 }
    )
  })
}

const createScheduleUpdateServerError = () => {
  return http.put('http://127.0.0.1:8000/api/scheduler/schedule', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createScheduleDeleteNotFoundError = () => {
  return http.delete('http://127.0.0.1:8000/api/scheduler/schedule/default', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Schedule not found"]
      }),
      { status: 404 }
    )
  })
}

const createScheduleDeleteServerError = () => {
  return http.delete('http://127.0.0.1:8000/api/scheduler/schedule/default', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createScheduleRunNotFoundError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/schedule/default/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Schedule not found"]
      }),
      { status: 404 }
    )
  })
}

const createScheduleRunSystemActiveError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/schedule/default/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["System is already running zone 1"]
      }),
      { status: 409 }
    )
  })
}

const createScheduleRunServerError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/schedule/default/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

// Controller Error Handlers
const createStartSprinklerZoneNotFoundError = () => {
  return http.post('http://127.0.0.1:8000/api/sprinklers/start', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Zone 1 not found"]
      }),
      { status: 400 }
    )
  })
}

const createStartSprinklerSystemActiveError = () => {
  return http.post('http://127.0.0.1:8000/api/sprinklers/start', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to start zone 2, system already active. Active zone: 1"]
      }),
      { status: 409 }
    )
  })
}

const createStartSprinklerServerError = () => {
  return http.post('http://127.0.0.1:8000/api/sprinklers/start', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Unexpected error starting sprinkler: see logs for details"]
      }),
      { status: 500 }
    )
  })
}

const createStartSprinklerHardwareError = () => {
  return http.post('http://127.0.0.1:8000/api/sprinklers/start', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Hardware communication error: Command Failed"]
      }),
      { status: 503 }
    )
  })
}

const createStopSprinklerServerError = () => {
  return http.post('http://127.0.0.1:8000/api/sprinklers/stop', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to stop system, see logs for details"]
      }),
      { status: 500 }
    )
  })
}

// System Error Handlers
const createSystemStatusError = () => {
  return http.get('http://127.0.0.1:8000/api/system/status', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to get system status, see logs for details"]
      }),
      { status: 500 }
    )
  })
}

// Logs Error Handlers
const createLogsInvalidLinesError = () => {
  return http.get('http://127.0.0.1:8000/api/logs', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Invalid number of lines"]
      }),
      { status: 400 }
    )
  })
}

const createLogsNotFoundError = () => {
  return http.get('http://127.0.0.1:8000/api/logs', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Log file not found"]
      }),
      { status: 404 }
    )
  })
}

const createLogsServerError = () => {
  return http.get('http://127.0.0.1:8000/api/logs', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["An error occurred: Permission denied"]
      }),
      { status: 500 }
    )
  })
}

const createLogsModuleListNotFoundError = () => {
  return http.get('http://127.0.0.1:8000/api/logs/module_list', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Log file not found"]
      }),
      { status: 404 }
    )
  })
}

const createLogsModuleListServerError = () => {
  return http.get('http://127.0.0.1:8000/api/logs/module_list', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["An error occurred: Permission denied"]
      }),
      { status: 500 }
    )
  })
}

// Additional Scheduler Error Handlers
const createActiveScheduleNotFoundError = () => {
  return http.get('http://127.0.0.1:8000/api/scheduler/active', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["No active schedule set"]
      }),
      { status: 404 }
    )
  })
}

const createSetActiveScheduleNotFoundError = () => {
  return http.put('http://127.0.0.1:8000/api/scheduler/active/:name', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Schedule 'Evening Schedule' not found"]
      }),
      { status: 404 }
    )
  })
}

const createSetActiveScheduleServerError = () => {
  return http.put('http://127.0.0.1:8000/api/scheduler/active/:name', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createScheduleOnOffServerError = () => {
  return http.put('http://127.0.0.1:8000/api/scheduler/on_off', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

const createRunActiveScheduleNotFoundError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/active/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["No active schedule set"]
      }),
      { status: 404 }
    )
  })
}

const createRunActiveScheduleSystemActiveError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/active/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["System is already running zone 1"]
      }),
      { status: 409 }
    )
  })
}

const createRunActiveScheduleServerError = () => {
  return http.post('http://127.0.0.1:8000/api/scheduler/active/run', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Internal server error"]
      }),
      { status: 500 }
    )
  })
}

// Additional Sprinkler Error Handlers
const createSprinklerUpdateValidationError = () => {
  return http.put('http://127.0.0.1:8000/api/sprinklers/', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to update sprinklers, invalid data: Duplicate zone numbers"]
      }),
      { status: 400 }
    )
  })
}

const createSprinklerUpdateServerError = () => {
  return http.put('http://127.0.0.1:8000/api/sprinklers/', () => {
    return new HttpResponse(
      JSON.stringify({
        detail: ["Failed to update sprinklers, see logs for details"]
      }),
      { status: 500 }
    )
  })
}

// Export all error creators as a single object for easy importing
export const errors = {
  // System errors
  system: {
    status: createSystemStatusError
  },
  // Scheduler errors
  schedule: {
    notFound: createScheduleNotFoundError,
    server: createScheduleServerError,
    createValidation: createScheduleCreateValidationError,
    createServer: createScheduleCreateServerError,
    updateValidation: createScheduleUpdateValidationError,
    updateServer: createScheduleUpdateServerError,
    deleteNotFound: createScheduleDeleteNotFoundError,
    deleteServer: createScheduleDeleteServerError,
    runNotFound: createScheduleRunNotFoundError,
    runSystemActive: createScheduleRunSystemActiveError,
    runServer: createScheduleRunServerError
  },
  activeSchedule: {
    notFound: createActiveScheduleNotFoundError
  },
  setActiveSchedule: {
    notFound: createSetActiveScheduleNotFoundError,
    server: createSetActiveScheduleServerError
  },
  scheduleOnOff: {
    server: createScheduleOnOffServerError
  },
  runActiveSchedule: {
    notFound: createRunActiveScheduleNotFoundError,
    systemActive: createRunActiveScheduleSystemActiveError,
    server: createRunActiveScheduleServerError
  },
  // Sprinkler errors
  sprinklerList: {
    server: createSprinklerListServerError
  },
  sprinklerUpdate: {
    validation: createSprinklerUpdateValidationError,
    server: createSprinklerUpdateServerError
  },
  startSprinkler: {
    zoneNotFound: createStartSprinklerZoneNotFoundError,
    systemActive: createStartSprinklerSystemActiveError,
    server: createStartSprinklerServerError,
    hardware: createStartSprinklerHardwareError
  },
  stopSprinkler: {
    server: createStopSprinklerServerError
  },
  // Logs errors
  logs: {
    invalidLines: createLogsInvalidLinesError,
    notFound: createLogsNotFoundError,
    server: createLogsServerError,
    moduleList: {
      notFound: createLogsModuleListNotFoundError,
      server: createLogsModuleListServerError
    }
  }
}
