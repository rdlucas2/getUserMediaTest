// app.js
var express = require('express');
var app = express();
var fs = require('fs');
// var server = require('http').createServer(app);

var port = 443;
var options = {
    key: fs.readFileSync('../../../private.pem'),
    cert: fs.readFileSync('../../../public.pem')
};
var server = require('https').createServer(options, app);

var io = require('socket.io')(server);
var ss = require('socket.io-stream');
var path = require('path');
var dl = require('delivery');

app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/socket.io-stream.js', function(req, res, next) {
    res.sendFile(__dirname + '/socket.io-stream.js');
});
app.get('/delivery.js', function(req, res, next) {
    res.sendFile(__dirname + '/delivery.js');
});
app.get('/style.css', function(req, res, next) {
    res.sendFile(__dirname + '/style.css');
});
app.get('/SpeechToText.js', function(req, res, next) {
    res.sendFile(__dirname + '/SpeechToText.js');
});
app.get('/ATC_Theme_-_Washington_Saxophone_Quartet_Version.mp3', function(req, res, next) {
    res.sendFile(__dirname + '/ATC_Theme_-_Washington_Saxophone_Quartet_Version.mp3');
});

// var port = 4200;
var port = 443;
server.listen(port);
console.log('server listening on port ' + port)

io.on('connection', function(client) {
    console.log('io on connection');

    client.on('join', function(data) {
        console.log(data);
    });

    client.on('messages', function(data) {
        console.log(data);
        client.emit('broad', data);
        client.broadcast.emit('broad', data);
    });

    client.on('client-stream-request', function(data) {
        var stream = ss.createStream();
        var filename = __dirname + '/ATC_Theme_-_Washington_Saxophone_Quartet_Version.mp3';
        ss(client).emit('audio-stream', stream, { name: filename });
        fs.createReadStream(filename).pipe(stream);
    });

});

io.sockets.on('connection', function(socket) {
    console.log('sockets on connection');

    // ss(socket).on('file', function(stream, data) {
    //     var filename = path.basename(data.name);
    //     stream.pipe(fs.createWriteStream());
    // });

    var delivery = dl.listen(socket);
    delivery.on('receive.success', function(file) {
        var params = file.params;
        fs.writeFile(file.name, file.buffer, function(err) {
            if (err) {
                console.log('File could not be saved.');
            } else {
                console.log('File saved.');
            };
        });

        for (var i in io.sockets.connected) {
            //don't send the stream back to the initiator
            if (io.sockets.connected[i].id != socket.id) {
                var socketTo = io.sockets.connected[i]
                var stream = ss.createStream();
                var filename = __dirname + '/' + file.name;
                ss(socketTo).emit('audio-stream', stream, { name: filename });
                fs.createReadStream(filename).pipe(stream);
            }
        }

        setTimeout(function() {
            fs.unlink(filename); //don't have to delete immediately just don't want to add a ton of files to my comp!
        }, 20000);

    });

    socket.on('disconnect', function() {
        console.log('Got disconnect!');
    });
});