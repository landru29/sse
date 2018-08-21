var SSEWorkerPath = '/assets/shared-sse.js';

// Global SSE Object
var SSE = {
    guid: function() {
        function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    events: {},
    register: function(callback) {
        var uuid = SSE.guid();
        SSE.events[uuid] = callback;
        return uuid;
    },
    unregister: function(uuid) {
        delete SSE.events[uuid];
    }
};

// Launch (or reuse) worker to connect SSE
(function() {
    function startSharedWorker() {
        console.log('Shared worker')
        var w = new SharedWorker(SSEWorkerPath);

        w.port.onmessage = function(e) {
            Object.keys(SSE.events).forEach(function (uuid) {
                SSE.events[uuid](e.data);
            });
        }
    }

    function startWebWorker() {
        console.log('Web worker')
        var w = new Worker(SSEWorkerPath);

        w.onmessage = function(e) {
            Object.keys(SSE.events).forEach(function (uuid) {
                SSE.events[uuid](e.data);
            });
        }

        // simple worker must be launched manually
        w.postMessage('start');
    }

    if (window.SharedWorker) {
        startSharedWorker();
    } else {
        startWebWorker();
    }
})();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Example: Register to the bus event to update the DOM
var eventId = SSE.register(function(data) {
    document.body.innerHTML += '<pre>' + JSON.stringify(data, null, 4) + '</pre><br>';
});

// eventId can be used to unregister event
console.log(eventId);