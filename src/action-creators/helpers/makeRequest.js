import isObject from '../../utils/object/isObject';
import requestProgress from '../requestProgress';
import { DOWN, UP } from '../../constants/ProgressDirections';
import without from '../../utils/collection/without';

function makeRequest(options, actionCreatorOptions = {}) {
  const {
    url,
    previousValues,
    collectionKeys,
    credentials,
    dispatch,
    onSuccess,
    onError,
    request,

    responseAdaptor,
    progress,
    ..._options
  } = options;

  const actionCreatorRequestOptions = actionCreatorOptions.request || {};

  const _request = {
    credentials,
    ...request || {},
    ...actionCreatorRequestOptions
  };

  const requestOptions = function(){
    const common = {
      ...without(_request, [ 'errorHandler', 'cookie', 'credentials' ]),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ..._request.headers,
        ...(actionCreatorRequestOptions.headers || {})
      }
    };

    if (_request.cookie) {
      common.headers.Cookie = _request.cookie;
    } else if (_request.credentials) {
      common.credentials = 'include';
    }

    return common;
  }();

  const processResponse = (response) => {
    const { status } = response;

    if (status < 400) {
      return response.json().then((json) => {
        const _json = function () {
          if (responseAdaptor) {
            return responseAdaptor(json, response);
          } else {
            if (isObject(json)) {
              const { error, ...values } = json;

              return { values, error };
            } else {
              return { values: json };
            }
          }
        }();

        if (_json.error) {
          return dispatch(onError(_options, actionCreatorOptions, status, _json.error));
        } else {
          return dispatch(onSuccess(_options, actionCreatorOptions, _json.values, collectionKeys || previousValues));
        }
      });

    } else {
      if (_request.errorHandler) {
        _request.errorHandler(response, (error) => {
          dispatch(onError(_options, actionCreatorOptions, status, error));
        });
      } else {
        if (response.headers.get('Content-Type').startsWith('application/json')) {
          return response.json().then((json) => {
            const errorNormalized = isObject(json.error) ? json.error : { message: json.error };

            return dispatch(onError(_options, actionCreatorOptions, status, { ...errorNormalized, occurredAt: Date.now() }));
          });
        } else {
          return response.text().then((message) => dispatch(onError(_options, actionCreatorOptions, status, { message, occurredAt: Date.now() })));
        }
      }
    }
  };

  if (progress) {
    return new Promise((resolve, reject)=>{
      const xhRequest = new XMLHttpRequest();

      if (requestOptions.credentials === 'include') {
        xhRequest.withCredentials = true;
      }

      xhRequest.open(requestOptions.method || 'GET', url);

      Object.keys(requestOptions.headers || {}).forEach((headerKey) => {
        xhRequest.setRequestHeader(headerKey, requestOptions.headers[headerKey]);
      });

      xhRequest.upload.onprogress = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: UP }));
      };

      xhRequest.upload.onloadend = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: UP }));
      };

      xhRequest.onprogress = (event) => {
        dispatch(requestProgress(_options, { ...event, direction: DOWN }));
      };

      xhRequest.onload = ({ target })=> {

        const responseBlob =
          new Blob(
            [ target.responseText ],
            { type: target.responseType || 'application/json' }
          );

        const response =
          new Response(responseBlob, {
            status: target.status,
            statusText: target.statusText
          });

        return processResponse(response).then(resolve);
      };

      xhRequest.onerror = (error) => {
        dispatch(onError(_options, actionCreatorOptions, 0, { type: 'NETWORK_ERROR', occurredAt: Date.now(), ...(error || {}) })).then(reject);
      };

      xhRequest.send(requestOptions.body);
    }).catch((error) => {
      throw error;
    });

  } else {
    return fetch(url, requestOptions).then(processResponse).
              catch((error) => dispatch(onError(_options, actionCreatorOptions, 0, { type: 'NETWORK_ERROR', occurredAt: Date.now(), ...(error || {}) })));
  }
}

export default makeRequest;
