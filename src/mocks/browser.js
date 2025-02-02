import { setupWorker } from 'msw/browser'
import { handlers, errors } from './handlers'
 
export const worker = setupWorker(...handlers)

// Example of how to use different error handlers:
// worker.use(errors.activeSchedule.notFound())    // No active schedule found error
// worker.use(errors.activeSchedule.server())      // Server error for active schedule
// worker.use(errors.sprinklerList.network())      // Network error for sprinkler list
// worker.use(errors.startSprinkler.validation())  // Validation error for start sprinkler
// worker.use(errors.stopSprinkler.notActive())    // Not active error for stop sprinkler
