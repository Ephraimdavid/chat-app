                                                                                           /*            
                <!- * -!>      
                
                == + ==
                               
         DEVELOPED BY EPHRAIM DAVID

          THIS NODE.JS CHAT APP IS DEDICATED TO...
          MUM *****
          BEN ****
          COLLINS ***
          NORA **
*/ 
// home page adress - background-image: url(https://www.bing.com/th?id=OHR.SantaElena_ROW0096395248_1920x1080.jpg&rf=LaDigue_1920x1080.jpg)

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generalMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
 
const port = process.env.PORT || 3000
const servingPublicDirectory = path.join(__dirname, '../public')

app.use(express.static(servingPublicDirectory))


io.on('connection', (socket) => {
    console.log('new websocket connection')

    socket.on('join', (options, callback) => {
      const { error, user } = addUser({ id: socket.id, ...options})

        if (error)  {
            return callback(error)
        }
      
      socket.join(user.room)
            // server sends event to client - A welcome message for a new user
    socket.emit('message', generalMessage( `Welcome ${user.username}`))

    // sending message across all connected user - when a user joined
    socket.broadcast.to(user.room).emit('message', generalMessage(`${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUserInRoom(user.room)
    })
    callback()
    })

   //server receives info from client via the form - when a user sends a message
    socket.on('receive user message', (message, callback) => {
        const user = getUser(socket.id )
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('please dont use bad words here')
        }

    io.to(user.room).emit('message', generalMessage(` ${message}`))
    callback()
    })

    //getting user location
    socket.on('send location', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`) )
         callback() //render location broadcast to all users...
    })

    //disconnect user and broadcast event
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generalMessage(`${user.username} has Left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log('serving @ port ' + port)
})