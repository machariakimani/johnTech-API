const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    // Get all notes from MongoDB
    const notes = await Note.find().lean()
    
    // If no notes
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }
    
    // Add username to each note before sending the response
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        
        // Handle case where user doesn't exist
        if (!user) {
            console.warn(`User with ID ${note.user} not found for note ${note._id}`)
            return { 
                ...note, 
                username: 'Unknown User' // or 'Deleted User'
            }
        }
        
        return { ...note, username: user.username }
    }))
    
    res.json(notesWithUser)
})

// Alternative approach - filter out notes with missing users
const getAllNotesAlternative = asyncHandler(async (req, res) => {
    // Get all notes with populated user data
    const notes = await Note.find().populate('user', 'username').lean()
    
    // If no notes
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }
    
    // Filter out notes where user is null and format response
    const validNotes = notes
        .filter(note => note.user) // Remove notes with null users
        .map(note => ({
            ...note,
            username: note.user.username,
            user: note.user._id // Keep the user ID
        }))
    
    res.json(validNotes)
})

// @desc Create new note
// @route POST /notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body
    
    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    
    // Verify user exists before creating note
    const userExists = await User.findById(user).lean().exec()
    if (!userExists) {
        return res.status(400).json({ message: 'Invalid user ID' })
    }
    
    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }
    
    // Create and store the new note
    const note = await Note.create({ user, title, text })
    
    if (note) {
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body
    
    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }
    
    // Verify user exists
    const userExists = await User.findById(user).lean().exec()
    if (!userExists) {
        return res.status(400).json({ message: 'Invalid user ID' })
    }
    
    // Confirm note exists to update
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }
    
    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()
    // Allow renaming of the original note
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }
    
    note.user = user
    note.title = title
    note.text = text
    note.completed = completed
    
    const updatedNote = await note.save()
    res.json(`'${updatedNote.title}' updated`)
})

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body
    
    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID required' })
    }
    
    // Confirm note exists to delete
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }
    
    const result = await note.deleteOne()
    const reply = `Note '${result.title}' with ID ${result._id} deleted`
    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNote,
    updateNote,
    deleteNote
}