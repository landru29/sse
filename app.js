var express = require('express');
var app = express();

var template = ' \
<!DOCTYPE html> <html> <body> \
	<script type="text/javascript" src="/assets/index.js"></script> </body> </html>';

// serve static files
app.use('/assets', express.static('assets'));

// Serve HTML example
app.get('/', (req, res) => {
	res.send(template);  // <- Return the static template above
});

var clientId = 0;
var clients = {};  // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get('/events/', (req, res) => {
	console.log('Opening Connection');
	req.socket.setTimeout(2147483647);
    res.writeHead(200, {
    	'Content-Type': 'text/event-stream',  // <- Important headers
    	'Cache-Control': 'no-cache',
    	'Connection': 'keep-alive'
    });
	res.write('\n');
	
    (function(clientId) {
        clients[clientId] = res;  // <- Add this client to those we consider "attached"
        req.on("close", () => {
			delete clients[clientId];
			console.log('Closing Connection');
		});  // <- Remove this client when he disconnects
	})(++clientId);
	
});

// Sending data to the client
setInterval(function(){
	var msg = JSON.stringify(
		{
			dice: Math.ceil(Math.random() * 6)
		}
	);
	console.log("Clients: " + Object.keys(clients) + " <- " + msg);
	for (clientId in clients) {
		clients[clientId].write("data: "+ msg + "\n\n"); // <- Push a message to a single attached client
	};
}, 2000);

// Bind 8080
app.listen(process.env.PORT || 8080);
