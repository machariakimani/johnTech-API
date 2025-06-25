require("dotenv").config()
const mongoose = require("mongoose")
const express = require("express")
const app = express()
const PORT = process.env.PORT || 3501
const path = require("path")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/dataBase")
const {logger} = require("./middleware/logEvents")
const {errorHandle} = require("./middleware/logEvents")
const {logEvents} = require("./middleware/logEvents")

app.use(logger)
connectDB()
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())
app.use(express.static("public"))
app.use("/", require("./routes/root"))
app.use('/auth', require('./routes/authApi'))
app.use("/users", require("./routes/usersApi"))
app.use("/notes", require("./routes/notesApi"))

app.all(/^.*$/, (req, res ) => {
	res.status(404)
	if(req.accepts("html")){
		res.sendFile(path.join(__dirname, "views", "404.html"))
	} else if(req.accepts("json")) {
 		res.json({message: "resource not found"})
	} else {
		res.send("404 not found")
	}
})

app.use(errorHandle)

mongoose.connection.once("open", () => {
	console.log(process.env.NODE_ENV)
	console.log("connected to mongo db")
	app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on("error", err => {
	console.error(err);
	logEvents(`${err.no}: ${err.code} \t ${err.syscall} \t ${err.hostname} `, "mongoErrLog.txt")
})
