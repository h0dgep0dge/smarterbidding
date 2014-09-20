var list_template_src = '<div class=\'menu_item\' onClick=\'switch_to_auction({{ListingId}})\'>{{Title}}<br />{{MaxBidAmount}}</div>';
var auction_template_src = '<div>{{Title}} in {{Category}}<br />{{MaxBidAmount}}</div>';

var add_list_item = '<div class=\'menu_item\' onClick=\'add_auction_switch()\'>Add new auction</div>';
var add_auction_form = '<input type=\'text\' id=\'aid\' /><input type=\'button\' value=\'Add\' onClick=\'add()\' />';
var right_view_default = '';

var list_template = Handlebars.compile(list_template_src);
var auction_template = Handlebars.compile(auction_template_src);

function init() {
	var socket = new WebSocket("ws://10.0.0.69:8080/");
	socket.onopen = function() {
		socket.send('{"request":"list"}');
	}
	
	socket.onmessage = function(data) {
		try {
			var decoded = JSON.parse(data.data);
		} catch(err) {
			console.log(err);
			socket.close();
			return;
		}
		document.getElementById('left').innerHTML = '';
		for(var i = 0;i < decoded.length;i++) document.getElementById('left').innerHTML += list_template(decoded[i]);
		document.getElementById('left').innerHTML += add_list_item;
	}
}

function reset() {
	init();
	document.getElementById('right').innerHTML = right_view_default;
}

function add_auction_switch() {
	document.getElementById('right').innerHTML = add_auction_form;
}

function add() {
	var socket = new WebSocket("ws://10.0.0.69:8080/");
	socket.onopen = function() {
		socket.send(JSON.stringify({'request':'add','aid':document.getElementById('aid').value}));
		reset();
	}
}

function switch_to_auction(aid) {
	var socket = new WebSocket("ws://10.0.0.69:8080/");
	socket.onopen = function() {
		socket.send(JSON.stringify({'request':'get','aid':String(aid)}));
	}
	
	socket.onmessage = function(data) {
		try {
			var decoded = JSON.parse(data.data);
		} catch(err) {
			console.log(err);
			socket.close();
			return;
		}
		document.getElementById('right').innerHTML = '';
		document.getElementById('right').innerHTML += auction_template(decoded);
	}
}