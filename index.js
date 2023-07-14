const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var fs = require('fs');

app.get('/', (req, res) => {
    res.render(__dirname + '/index.ejs', {rooms: rooms});
  });

app.get('/room1', (req, res) => {
    res.render(__dirname + '/room.ejs', {room: 'room1'});
});

app.get('/room2', (req, res) => {
    res.render(__dirname + '/room.ejs', {room: 'room2'});
});

let rooms = JSON.parse(fs.readFileSync('./rooms.json', 'utf-8'));

app.post('/newroom', jsonParser, (req, res) => {
    const room = req.body.room;
    app.get('/' + room, (req, res) => {
        res.render(__dirname + '/room.ejs', {room: room});
    });
    if(!rooms.includes(req.body.room)) {
        rooms.push(room);
        if(req.body.save) {
            let rooms = JSON.parse(fs.readFileSync('./rooms.json', 'utf-8'));
            const newRooms =  rooms.concat([req.body.room])
            fs.writeFileSync("./rooms.json", JSON.stringify(newRooms));
        }
        res.send({
            'room': room
        });
    }
    else {
        res.send({
            'error': 'room already exist'
        })
    }
})

const admin = io.of("/admin");

admin.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        admin.in(data.room).emit('chat message', `New user joined ${data.room} room!`);
    })

    socket.on('chat message', (data) => {
        admin.in(data.room).emit('chat message', data.msg);
    });

    socket.on('disconnect', () => {
        admin.emit('chat message', 'user disconnected');
    })
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});