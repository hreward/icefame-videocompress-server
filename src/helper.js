const { createLogger, transports, format } = require("winston");
const { combine, timestamp, label, prettyPrint, printf, json } = format;
require('winston-daily-rotate-file');


const transport = new transports.DailyRotateFile({
	filename: 'app-%DATE%.jlog',
	dirname:'./logs',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '2m',
	maxFiles: '10d'
});

var thisUser = {
	id:"",
	name:"Developer"
}

function setUser(name){
	thisUser.name = name;
	logger = createLogger({
		transports: [
			transport
		],
		format:combine(
				label({ label: thisUser.name }),
				timestamp(),
				myFormat
			)
		});
}

/////////////////////
////LOGGER///////////
/////////////////////
const myFormat = printf(({ level, message, label, timestamp }) => {
	// return `${timestamp} [${label}] ${level}: ${message}`;
	//return `{\n\ttimestamp:"${timestamp}"\n\tlabel:"${label}"\n\tlevel:"${level}"\n\nmessage:"${message}"\n}`;
return`{
	"timestamp":"${timestamp}",
	"label":"${label}",
	"level":"${level}",
	"message":"${message}"
}`;
});

transport.on('rotate', function(oldFilename, newFilename) {
	// do something fun
});

global.logger = createLogger({
	transports: [
		transport
	],
	format:combine(
			label({ label: thisUser.name }),
			timestamp(),
			myFormat
		)
	});



module.exports = {
// 	logger,
	setUser
}