import { ERROR } from '../../constants/Statuses';

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when it was
 * requested from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} error An object containing the details of the error
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key, projection } = options;

  return {
    type: action,
    status: ERROR,
    projection,
    httpCode,
    key,
    error
  };
}

export default handleResourceError;
