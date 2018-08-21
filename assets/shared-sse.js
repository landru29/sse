
var MAX_SSE_RETRIES = 5;
var connectionPath = '/events/';

var sseRetry = MAX_SSE_RETRIES;
var eventSource;
var workerPorts = [];


// Connect to SSE
function openSSE(callback) {
    if (!eventSource || eventSource.readyState === 2) {
        if (sseRetry-- > 0) {
            if(typeof(EventSource)!=='undefined') {

                eventSource = new EventSource(connectionPath);
                eventSource.onmessage = function(e) {
                    try {
                        var data = JSON.parse(e.data);
                        workerPorts.forEach(function(port) {
                            port.postMessage(data);
                        });
                    } catch (err) {
                        workerPorts.forEach(function(port) {
                            port.postMessage(e.data);
                        });
                    }
                };

                eventSource.onopen = function (e) {
                    sseRetry = MAX_SSE_RETRIES;
                    callback(null);
                }

                eventSource.onerror = function (e) {
                    eventSource.close();
                    var delay = Math.pow(2, MAX_SSE_RETRIES - sseRetry) * 1000;
                    setTimeout(
                        function() {
                            openSSE(callback);
                        },
                        delay
                    );
                }

            }
        } else {
            callback('Not connected')
        }
    } else {
        callback(null);
    }
}

// Start SSE connexion
function start(e) {
    openSSE(function(err) {
        if (!err && e) {
            workerPorts.push(e.ports[0]);
        }
        if (!err && !e) {
            workerPorts.push({
                postMessage: function(data) {
                    postMessage(data);
                }
            });
        }
    });
}

// Used to automatically launch shared worker
onconnect = function(e) {
    start(e);
}

// Used to manually launch simple worker
onmessage = function (e) {
    if (e.data === 'start') {
        start();
    }
}