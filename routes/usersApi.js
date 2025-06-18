const express = require("express")
const router = express.Router()
const usersControler = require("../controlers/usersControler")
const verifyJWT = require("../middleware/verifyJWT")

 router.use(verifyJWT)

router.route("/")

.get(usersControler.getAllUsers)
.post(usersControler.addUser)
.patch(usersControler.updateUser)
.delete(usersControler.deleteUser)


 module.exports = router