const express = require("express")
const router = express.Router()
const notesControler = require("../controlers/notesControler")
const verifyJWT = require("../middleware/verifyJWT")

router.use(verifyJWT)

router.route("/") 

.get(notesControler.getAllNotes)
.post(notesControler.createNote)
.patch(notesControler.updateNote)
.delete(notesControler.deleteNote)

module.exports = router