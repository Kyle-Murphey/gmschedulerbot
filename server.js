'use strict';

const express = require('express')
const app = express()
const path = require('path')
const https = require('https')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const url = require('url')
const port = 443

var sender = require('./lib/MessageSender');
var schedulerFile = require('./lib/MessageScheduler');
var scheduler = new schedulerFile();

const testToken = "cXojGY947qrZhTXiPxLGBqnalisd5aJxdOHYnjF9"
const testGroupID = "14538582"
const testMessageID = "154710840693462940"

app.use(cookieParser());
app.use(express.static('views'));

app.get('/', (req, res) => 
{
	res.sendFile(path.join(__dirname + '/views/baseView.html'))
});

app.get('/authenticate/?', (req, res) => 
{
	res.cookie('token', req.query.access_token);
	res.redirect("/");
});

app.post('/schedule/', (req, res) =>
{
	res.sendFile(path.join(__dirname + '/views/addView2.html'))
});

app.post('/getInfo/', (req, res) =>
{
	var info = "";
	req.on('data', (chunk) =>
	{
		info += chunk;
	});
	req.on('end', () =>
	{
		const infoJson = JSON.parse(info);
		const messages = scheduler.getMessages(infoJson.token);
		sender.getChats(infoJson.token, function(returnValue) {
			const toSend = {
				chats: returnValue,
				messages: messages
			};
			res.end(JSON.stringify(toSend));
		});
	});
});

app.post('/submitMessage/', (req, res) =>
{
	var info = "";
	req.on('data', (chunk) =>
	{
		info += chunk;
	});
	req.on('end', () =>
	{
		const infoJson = JSON.parse(info);
		var date = new Date(infoJson.time);
		scheduler.scheduleMessage(infoJson.token, infoJson.chat, date, infoJson.toSend);
		const messages = scheduler.getMessages(infoJson.token);
		sender.getChats(infoJson.token, function(returnValue) {
			const toSend = {
				chats: returnValue,
				messages: messages
			};
			res.end(JSON.stringify(toSend));
		});
	});
});

app.post('/deleteMessage/', (req, res) =>
{
	var info = "";
	req.on('data', (chunk) =>
	{
		info += chunk;
	});
	req.on('end', () =>
	{
		const infoJson = JSON.parse(info);
		var date = new Date(infoJson.time);
		scheduler.unscheduleMessage(infoJson.token, infoJson.chat, date, infoJson.toSend);
		const messages = scheduler.getMessages(infoJson.token);
		sender.getChats(infoJson.token, function(returnValue) {
			const toSend = {
				chats: returnValue,
				messages: messages
			};
			res.end(JSON.stringify(toSend));
		});
	});
});

const httpsOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt')
}

const server = https.createServer(httpsOptions, app).listen(port, () => console.log(`Example app listening on port ${port}!`))