const path = require("path")
const {v4: uuid} = require("uuid")
const {format}  = require("date-fns") 
const fs = require("fs")
const fsPromises = require("fs").promises

const logEvents = async (message, logName) => {
    const dateTime = `${format(new Date(), "yyyy/MM/dd \t HH:mm:ss")}`
    const logItem = `${dateTime}        ${uuid()}        ${message}\n`
    console.log(logItem)

	try{
		if(!fs.existsSync) {
		await fs.mkdir(path.join(__dirname, "..", "logs"))
		}
		await fsPromises.appendFile(path.join(__dirname, "..", "Logs",  logName), logItem)
	} catch (err) {
		console.error(err)
	}
}

const logger = (req,res,next)=>{
	logEvents(`${req.method} \t ${req.headers.origin} ${req.url}`, "reqLog.txt")
	console.log(`${req.method}  ${req.path} ${res.statusCode}`)
	next()
}


const errorHandle = (err,req,res,next) => {
	logEvents(`${err.name} : ${err.message}`, "errLog.txt")
	console.error(err.stack)
	const status = res.statusCode ? res.statusCode : 500
	res.status(status)
	res.json({message:err.message})
} 

module.exports = {logger, errorHandle, logEvents} 