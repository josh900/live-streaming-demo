import Logger from './logger.js';

const logger = new Logger('ERROR');

export function handleError(message, error) {
    logger.error(`${message}:`, error);
    
    // You can add more sophisticated error handling here, such as:
    // - Sending error reports to a server
    // - Displaying user-friendly error messages
    // - Attempting to recover from certain types of errors

    // For now, we'll just log to console and alert the user
    console.error(`${message}:`, error);
    alert(`An error occurred: ${message}\nPlease check the console for more details.`);
}