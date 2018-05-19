var sys = require('sys'), path = require("path"), express = require("express");

var app = express();

var currentState = {
	"ledColor" : {
		r : 255,
		g : 255,
		b : 255,
		dim : 0.5,
		state : false
	},
	"coffeeState" : {
		bean_fill : 255,
		water_level : 255
	},
	"heating" : {
		temperature : 22.0,
		humidity : 88,
		wanted : 20.0,
		autodown : false
	},
	"relais" : false,
	"display" : {
		backgroundLight : true,
		textLine1 : "",
		textLine2 : ""
	}
};

if (process.env.IP) {
	app.set('interface', process.env.IP);
	app.set('port', process.env.PORT);
} else {
	app.set('interface', '0.0.0.0');
	app.set('port', 8080);
}
app.listen(app.get('port'), app.get('interface'));
console.log("[SRV] node.js version %s", process.version);
console.log("[SRV] Listening at interface %s:%s...", app.get('interface'), app
		.get('port'));

// Config

app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	/*
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
	*/
	app.set('version', '0.0.1');
	app.set('timeout', 300);
	app.set('maxwait', 1);
	app.set('static_dir', "./static");
	setTimeout(function() {
		// Timeout function
		console.log("[SRV] Ready to go!");
	}, 1000);
});

// Include static app files
// app.use(express.static(app.get('static_dir')));

// set cross domain headers
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	console.log("[URL] Received GET request for %s...", req.url);
	next();
});

app.get('/api/', function(req, res) {
	res.status(200).json({
		message : 'ok',
		version : app.get('version')
	});
});

var randomInterval = setInterval(function() {
	if (currentState.heating.wanted > currentState.heating.temperature) {
		currentState.heating.temperature += Math.random(1, 25) / 100.0;
	} else {
		currentState.heating.temperature -= Math.random(1, 25) / 100.0;
	}
	currentState.heating.temperature = Math.round(100 * currentState.heating.temperature) / 100;
});

var TEMP_MIN = 0;
var TEMP_MAX = 35;

app.get('/temp/get/', function(req, res) {
	send_temp_state(req, res);
});

app.get('/temp/set/wanted/:value', function(req, res) {
	var wanted = req.param('value');
	currentState.heating.wanted = Math
			.min(TEMP_MAX, Math.max(TEMP_MIN, wanted));
	console.log("[INFO] Heating Wanted set to %d °C...",
			currentState.heating.wanted);
	send_temp_state(req, res);
});

app.get('/temp/set/autodown/:value', function(req, res) {
	var wanted = req.param('value');
	switch (wanted.toLowerCase()) {
	case 'on':
		currentState.heating.autodown = true;
		console.log("[INFO] Heating autodown set to ON");
		send_temp_state(req, res);
		break;
	case 'off':
		currentState.heating.autodown = false;
		console.log("[INFO] Heating autodown set to OFF!");
		send_temp_state(req, res);
		break;
	default:
		send_request_error(req, res);
	}
});


app.get('/display/get/', function(req, res) {
	send_display_state(req, res);
});

app.get('/display/set/text/:text', function(req, res) {
	var text = req.param('text').substr(0, 31);
	console.log("[INFO] Display set to %s...", text);
	currentState.display.textLine2 = text;
	send_display_state(req, res);
});

app.get('/display/set/backlight/:value', function(req, res) {
	var backlight = req.param('value');
	switch (backlight.toLowerCase()) {
	case 'on':
		console.log("[INFO] Display backlight set to ON");
		currentState.display.backgroundLight = true;
		send_display_state(req, res);
		break;
	case 'off':
		console.log("[INFO] Display backlight set to OFF");
		currentState.display.backgroundLight = false;
		send_display_state(req, res);
		break;
	default:
		send_request_error(req, res);
	}
});

app.get('/light/get/', function(req, res) {
	send_light_state(req, res);
});

app.get('/light/set/state/:value', function(req, res) {
	var state = req.param('value');
	switch (state.toLowerCase()) {
	case 'on':
		currentState.ledColor.state = true;
		console.log("[INFO] LED state set to ON");
		send_light_state(req, res);
		break;
	case 'off':
		currentState.ledColor.state = false;
		console.log("[INFO] LED state set to OFF");
		send_light_state(req, res);
		break;
	default:
		send_request_error(req, res);
	}
});

app.get('/light/set/color/:value', function(req, res) {
	var colorString = req.param('value');
	currentState.ledColor.r = parseInt(colorString.substring(0, 2), 16);
	currentState.ledColor.g = parseInt(colorString.substring(2, 4), 16);
	currentState.ledColor.b = parseInt(colorString.substring(4, 6), 16);
	console.log("[INFO] Light color set to #%s...",
			rgbToHex(currentState.ledColor));
	send_light_state(req, res);
});

app.get('/light/set/brightness/:value', function(req, res) {
	var brightness = parseInt(req.param('value'));
	currentState.ledColor.dim = Math.min(Math.max(0, brightness), 255) / 255.0;
	console.log("[INFO] Light color set to %d...",
			currentState.ledColor.dim);
	send_light_state(req, res);
});


app.get('/coffee/get/', function(req, res) {
	send_coffee_state(req, res);
});

var COFFEE_WATER = 20;
var COFFEE_BEANS = 5;

app
		.get(
				'/coffee/make/',
				function(req, res) {
					console.log("[INFO] Coffee done...");
					if ((currentState.coffeeState.bean_fill >= COFFEE_BEANS)
							&& (currentState.coffeeState.water_level >= COFFEE_WATER)) {
						currentState.coffeeState.bean_fill = currentState.coffeeState.bean_fill
								- COFFEE_BEANS;
						currentState.coffeeState.water_level = currentState.coffeeState.water_level
								- COFFEE_WATER;
						res.status(200).json({
							status : "ok",
							coffee : "done"
						});
					} else {
						console.log("[ERR] Coffee failed!");
						res.status(200).json({
							status : "error",
							message : "Bitte Füllstand kontrollieren"
						});
					}
				});

app.get('/coffee/refill/', function(req, res) {
	currentState.coffeeState.bean_fill = 255;
	currentState.coffeeState.water_level = 255;
	console.log("[INFO] Coffee refilled...");
	send_coffee_state(req, res);
});

function send_temp_state(req, res) {
	res.status(200).json({
		status : 'ok',
		temperature : currentState.heating.temperature,
		humidity : currentState.heating.humidity,
		wanted : currentState.heating.wanted,
		autodown : currentState.heating.autodown
	});
}

function send_display_state(req, res) {
	res.status(200).json({
		status : 'ok',
		text : currentState.display.textLine2,
		backlight : (currentState.display.backgroundLight ? "on" : "off")
	});
}

function componentToHex(c) {
    var hex = c.toString(16).toUpperCase();
    return (hex.length == 1 ? "0" + hex : hex);
}

function rgbToHex(value) {
    return componentToHex(value.r) + componentToHex(value.g) + componentToHex(value.b);
}


function send_light_state(req, res) {
	res.status(200).json(
			{
				status : 'ok',
				color : rgbToHex(currentState.ledColor),
				dim : Math.floor(255.0 * currentState.ledColor.dim),
				state : (currentState.ledColor.state ? "on" : "off")
			});
}

function send_coffee_state(req, res) {
	res.status(200).json({
		status : 'ok',
		bean_fill : currentState.coffeeState.bean_fill,
		water_level : currentState.coffeeState.water_level
	});
}

app.use(function(req, res, next) {
	send_request_error(req,res);
	});

function send_request_error(req, res) {
	console.log("[ERR] Invalid URI \"%s\"!", req.url);
	res.status(400).json({
		status : "error",
		message : "invalid uri",
		uri :req.url
	});
}

app.use(function(err, req, res, next) {
	console.log("[ERR] Internal error at \"%s\"!", req.url);
	  console.error(err.stack);
	  res.status(500).json({
			status : "error",
			message : "internal error",
	});
});