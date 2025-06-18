const express = require("express")
const bcrypt = require("bcrypt")
const asyncHandler = require("express-async-handler")
const User = require("../models/User")
const Note = require("../models/Note")

//get all users,, GET request,,access private
const getAllUsers = asyncHandler( async (req, res) => {
	const users = await User.find().select("-password").lean()	
	if(!users?.length) {
		return res.status(400).json({message:"NO USERS FOUND"})
	}
		res.json(users)
}) 

//create new users,, GET request,,access private
const addUser = asyncHandler( async (req, res) => {
	const {username, password, roles} = req.body

	if(!username || !password || !Array.isArray(roles) || !roles.length) {
		return res.status(400).json({message: "All fields must be filled"})
	}

	const duplicate = await User.findOne({username}).lean().exec()
	if (duplicate) {
		return res.status(409).json({message: `User with username ${username} allready registerd, Duplication NOT allowed! `})
	}
	const hashedpwd = await bcrypt.hash(password, 10) //10 salt round
	const userObject = {username, "password":hashedpwd, roles}
	const user = await User.create(userObject)
	
	

	if (user) {
		res.status(201).json({message:`user ${user.username} created succesfuly`})
	} else {
		res.status(400).json({message:"invalid user credentials entered"})
	}
}
) 
//update a users,, GET request,,access private
const updateUser = asyncHandler( async (req, res) => {
	const {id, password, username, active, roles} = req.body

	if(!id ||!username || !Array.isArray(roles) || !roles.length ||typeof active !== "boolean") {
		return res.status(400).json({message: "all fields must be filled"})
	}

	const user = await User.findById(id).exec()
	if (!user) {
		return res.status(400).json({message: "user not found"})
	}
	const duplicate = await User.findOne({username}).lean().exec()
	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({message: "Duplictae username"})
	}
	user.username = username
	user.roles = roles
	user.id = id
	user.active = active

	if(password){
		user.password =	await bcrypt.hash(password, 10)	
	}

	const updatedUser = await user.save()

	res.json({message: `${updatedUser.username} updated sucessfully`})


}) 
//delete a user,, GET request,,access private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

   if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    // Check for notes assigned to the user
    const note = await Note.findOne({ user: id }).lean().exec();
    if (note) {
        return res.status(400).json({ message: "User has assigned notes and cannot be deleted" });
    }

    // Find the user
    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

   const reply = `User ${user.username} with ID ${user._id} deleted successfully`;
    res.json({ message: reply });
});


module.exports = {
	getAllUsers, addUser, updateUser, deleteUser
}