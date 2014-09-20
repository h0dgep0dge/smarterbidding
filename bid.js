var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	ws = require('ws');

var auctions = [];
var auction_ids = [];

var server = http.createServer(function(request,response) {
	var file = url.parse(request.url).pathname;
	if(file == '/') file = '/index.html';
	var path = __dirname + file;
	fs.exists(path, function (exists) {
		if(exists) {
			fs.readFile(path, function (err, data) {
				if (err) throw err;
				response.end(data);
			});
		} else {
			response.end();
		}
	});
});

var wss = new ws.Server({'server':server});

wss.on('connection',function(socket) {
	socket.on('message',function(data,flags) {
		try {
			var decoded = JSON.parse(data);
		} catch(err) {
			console.log(err);
			socket.close();
			return;
		}
		if(decoded.request == undefined) {
			socket.send({'response':400,'message':'Did not receive valid request'});
			socket.close();
			return;
		}
		switch(decoded.request) {
			case 'list':
				socket.send(JSON.stringify(auctions));
				socket.close();
				return;
			case 'get':
				if(decoded.aid == undefined) {
					socket.send({'response':400,'message':'Did not receive auction id'});
					socket.close();
					return;
				}
				if(auction_ids.indexOf(decoded.aid) < 0) {
					socket.send({'response':404,'message':'Auction id not found'});
					socket.close();
					return;
				}
				socket.send(JSON.stringify(auctions[auction_ids.indexOf(decoded.aid)]));
				socket.close();
				return;
			case 'add':
				if(decoded.aid == undefined) {
					socket.send({'response':400,'message':'Did not receive auction id'});
					socket.close();
					return;
				}
				if(!/^[0-9]+$/m.test(decoded.aid)) {
					socket.send({'response':400,'message':'Malformed auction id'});
					socket.close();
					return;
				}
				if(auction_ids.indexOf(decoded.aid) < 0) {
					socket.send({'response':202,'message':'Auction id added'});
					auction_ids.push(decoded.aid);
					update_auctions();
				} else {
					socket.send({'response':409,'message':'Auction id already exists'});
				}
				socket.close();
				return;
			default:
				socket.send({'response':400,'message':'Unknown request type'});
				socket.close();
				return;
		}
	});
});

function update_auctions() {
	auctions = [];
	for(var i = 0;i < auction_ids.length;i++) {
		var options = {
			hostname: 'api.trademe.co.nz',
			port: 80,
			path: '/v1/Listings/' + auction_ids[i] + '.json',
			method: 'GET'
		};
		
		var req = http.request(options, function(res) {
			if(res.statusCode != 200) {
				return;
			}
			var data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			
			res.on('end',function() {
				auctions.push(JSON.parse(data));
			});
		});
		req.end();
	}
}

update_auctions();
setInterval(update_auctions,60000);
server.listen(8080);