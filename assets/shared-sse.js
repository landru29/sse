
var MAX_SSE_RETRIES = 5;
var connectionPath = '/events/';


// Connect to SSE
function openSSE(callback) {
    console.log(self.eventSource);
    if (!self.eventSource || self.eventSource.readyState === 2) {
        if (self.sseRetry-- > 0) {
            if(typeof(EventSource)!=='undefined') {

                self.eventSource = new EventSource(connectionPath);
                self.eventSource.onmessage = function(e) {
                    try {
                        var data = JSON.parse(e.data);
                        self.workerPorts.forEach(function(port) {
                            port.postMessage(data);
                        });
                    } catch (err) {
                        self.workerPorts.forEach(function(port) {
                            port.postMessage(e.data);
                        });
                    }
                };

                self.eventSource.onopen = function (e) {
                    self.sseRetry = MAX_SSE_RETRIES;
                    callback(null);
                }

                self.eventSource.onerror = function (e) {
                    eventSource.close();
                    var delay = Math.pow(2, MAX_SSE_RETRIES - self.sseRetry) * 1000;
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
            self.workerPorts.push(e.ports[0]);
            setTimeout(function() {
                e.ports[0].postMessage({init: "shared worker"});
            }, 100);
        }
        if (!err && !e) {
            self.workerPorts.push({
                postMessage: function(data) {
                    postMessage(data);
                }
            });
            setTimeout(function() {
                postMessage({init: "web worker"});
            }, 100);
        }
    });
}


self.sseRetry = MAX_SSE_RETRIES;
self.workerPorts = self.workerPorts || [];

// Used to automatically launch shared worker
onconnect = function(e) {
    start(e);
    
}

// Used to manually launch simple worker
onmessage = function(e) {
    if (e.data === 'start') {
        start();
    }
}
