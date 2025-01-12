function updateBasedOnToken() {
	var cookie = document.cookie
	var token = cookie.split("token=")[1]
	if (token==""||token in window)
	{
		return;
	}
	var request = new XMLHttpRequest();
	request.open("POST", "https://www.schmessage.com/getInfo/");
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify({token: token}));
	request.onload = () => {
		const data = JSON.parse(request.response);
		var dropdown = document.getElementById("Select");
		if (data.info.chats.length == 0)
		{
			showError("There was an error authenticating your account. Please try again.");
			return;
		}
		for (var i = 0; i < data.info.chats.length; i++)
		{
			var option = document.createElement("option");
			option.text = data.info.chats[i][1];
			option.setAttribute("value", data.info.chats[i][0]);
			dropdown.add(option);
		}
		var dmdropdown = document.getElementById("dmSelect");
		if (data.info.DMs.length == 0)
		{
	                var emptyDMs = document.getElementById("dmPlaceholderOption");
        	        emptyDMs.text = "No DMs found"
		}
		else
		{
			var emptyDMs = document.getElementById("dmPlaceholderOption");
                        dmdropdown.removeChild(emptyDMs)
			dmdropdown.disabled = false;
		}
		for (var i = 0; i < data.info.DMs.length; i++)
                {
                        var option = document.createElement("option");
                        option.text = data.info.DMs[i][1];
                        option.setAttribute("value", data.info.DMs[i][0]);
                        dmdropdown.add(option);
                }
		var toDelete = document.getElementById("placeholderOption");
		dropdown.removeChild(toDelete);

		dropdown.disabled = false;
		document.getElementById("completionLocation").innerHTML = "Authentication was a success! You can now schedule a message.";
		document.getElementById("date").disabled = false;
		document.getElementById("time").disabled = false;
		document.getElementById("toSend").disabled = false;

		updateMessages(data);
	};
}

function submit() {
	completeCheck(function()
	{
		validCheck(function()
		{
			var cookie = document.cookie
			var token = cookie.split("token=")[1]
			var dateVal = document.getElementById("date").value;
			var timeVal = document.getElementById("time").value;
			var datetime = dateFromStrings(dateVal, timeVal);
			var messageType = "chat";
			if (document.getElementsByName("messageType")[0].checked)
			{
				messageType = document.getElementsByName("messageType")[0].value;
			}
			if (document.getElementsByName("messageType")[1].checked)
                        {
                                messageType = document.getElementsByName("messageType")[1].value;
                        }
			var chat = "default";
			var select = null;
			if (messageType == "dm")
			{
				select = document.getElementById("dmSelect");
			}
			else
			{
				select = document.getElementById("Select");
			}
			chat = select.options[select.selectedIndex].value
			var request = new XMLHttpRequest();
			request.open("POST", window.location.href + "submitMessage/");
			request.setRequestHeader('Content-Type', 'application/json');
			const toSend = JSON.stringify({
				token: token,
				chat: chat,
				time: datetime.toISOString(),
				toSend: document.getElementById("toSend").value,
				messageType: messageType
			})
			request.send(toSend);
			request.onload = () => {
				const data = JSON.parse(request.response);
				updateMessages(data);
				showSuccess();
			}
		});
	});
}

function completeCheck(callback)
{
	if (document.getElementById("Select").value=="Invalid")
	{showError("Authentication is required. If you have logged in with GroupMe, make sure you have cookies enabled.")}
	else if (document.getElementById("date").value=="")
	{showError("Date is required")}
	else if (document.getElementById("time").value=="")
	{showError("Time is required")}
	else if (document.getElementById("toSend").value=="")
	{showError("Text is required")}
	else
	{callback()}
}

function validCheck(callback)
{
	if (document.getElementById("Select").value=="Invalid")
	{
		showError("Authentication failed. Make sure cookies are turned on.");
		return;
	}
	var dateVal = document.getElementById("date").value;
	var timeVal = document.getElementById("time").value;
	var datetime = dateFromStrings(dateVal, timeVal);
	if (datetime < new Date())
	{showError("Message cannot be scheduled for the past.")}
	else if (document.getElementById("toSend").value.length > 1000)
	{showError("Maximum length is 1000 characters.")}
	else {callback()}
}

function deleteMessage(button)
{
	var cookie = document.cookie;
	var token = cookie.split("token=")[1];
	var pList = button.parentElement.children;

        const searchText = pList[0].innerText.split("Chat: ")[1];
	var groupID = groupIdFromName(searchText);
	if (groupID == 0)
	{
		console.log("Unable to find chat in list");
		console.log(searchText);
		showError("Something went wrong. Please refresh the page. If this continues, please message the dev at 2CATteam@gmail.com.");
	}
	let dateData = new Date(pList[1].innerHTML.split("<b>Time: </b>")[1]);

	var request = new XMLHttpRequest();
	request.open("POST", window.location.href + "deleteMessage/");
	request.setRequestHeader('Content-Type', 'application/json');
	const toSend = JSON.stringify({
		token: token,
		chat: groupID,
		time: dateData.toISOString(),
		toSend: pList[2].innerHTML.split("<b>Message: </b>")[1]
	})
	request.send(toSend);
	request.onload = () => {
		const data = JSON.parse(request.response);
		updateMessages(data);
	}
}

function updateMessages(data)
{
	document.getElementById("scheduled").innerHTML = "";
	if (data.messages.length < 1)
	{
		document.getElementById("messagesLabel").hidden = true;
		return
	}
	for (var x in data.messages)
	{
		var subDiv = document.createElement("div");
		subDiv.setAttribute("class", "subDiv");

		var groupText = document.createElement("p");
		groupText.setAttribute("class", "groupText");
		groupText.innerHTML = "<b>Chat: </b>" + groupNameFromMessage(data, x);
		subDiv.appendChild(groupText);

		var tempDate = new Date(data.messages[x].time);
		var timeText = document.createElement("p");
		timeText.setAttribute("class", "timeText");
		timeText.innerHTML = "<b>Time: </b>" + tempDate.toLocaleString();
		subDiv.appendChild(timeText);

		var textText = document.createElement("p");
		textText.setAttribute("class", "textText");
		textText.innerHTML = "<b>Message: </b>" + data.messages[x].toSend;
		subDiv.appendChild(textText);

		var cancelButton = document.createElement("button");
		cancelButton.setAttribute("onclick", "deleteMessage(this)");
		cancelButton.innerHTML = "Cancel message";

		subDiv.appendChild(cancelButton);

		document.getElementById("scheduled").appendChild(subDiv);

		document.getElementById("messagesLabel").hidden = false;
	}
}

function groupNameFromMessage(data, x)
{
	for (var i = 0; i < data.info.chats.length; i++)
	{
		if (data.info.chats[i][0] == data.messages[x].group)
		{
			return data.info.chats[i][1];
		}
	}
	for (var i = 0; i < data.info.DMs.length; i++)
	{
		if (data.info.DMs[i][0] == data.messages[x].group)
		{
			return data.info.DMs[i][1] + "'s DMs"
		}
	}
	console.log(data.info)
	console.log(data.messages[x])
	return "Unknown chat";
}

function groupIdFromName(name)
{
	var groupID = 0
	const options = document.getElementById("Select").children
        for (var choice = 0; choice < options.length; ++choice)
        {
                if (options[choice].innerText == name)
                {
                        groupID = options[choice].value;
                }
        }
	const dmoptions = document.getElementById("dmSelect").children
        for (var choice = 0; choice < dmoptions.length; ++choice)
        {
                if (dmoptions[choice].innerText + "'s DMs" == name)
                {
                        groupID = dmoptions[choice].value;
                }
        }
	return groupID
}

function dateFromStrings(date, time)
{
	let dateSplit = date.split("-");
	let timeSplit = time.split(":");
	let ints = [
		parseInt(dateSplit[0]),
		parseInt(dateSplit[1]),
		parseInt(dateSplit[2]),
		parseInt(timeSplit[0]),
		parseInt(timeSplit[1])
	];
	var toReturn = new Date(ints[0], ints[1]-1, ints[2], ints[3], ints[4]);
	return toReturn;
}

function showError(toShow)
{
	document.getElementById("ErrorLocation").innerHTML = "ERROR: " + toShow;
	document.getElementById("SuccessLocation").innerHTML = "";
}

function showSuccess()
{
	document.getElementById("ErrorLocation").innerHTML = "";
	document.getElementById("SuccessLocation").innerHTML = "Success! Your message has been scheduled and you can view or cancel it below.";
	document.getElementById("toSend").value = "";
}

function debug()
{
	var debugString = "";
	debugString += document.cookie;
	debugString += "\n \n";
	if (document.getElementById("date").value && document.getElementById("time").value)
	{
		debugString += document.getElementById("date").value;
		debugString += "\n";
		debugString += document.getElementById("time").value;
		debugString += "\n";
		debugString += "Date currently: ";
		let toCompareDate = new Date();
		debugString += toCompareDate.toISOString();
		debugString += "\n Form of existing is as follows: ";
		let debugDate = dateFromStrings(document.getElementById("date").value, document.getElementById("time").value);
		debugString += debugDate.toISOString();
		debugString += "\n";
		debugString += "Compare current, ";
		debugString += toCompareDate.getTime();
		debugString += "To parsed value from fields, ";
		debugString += debugDate.getTime();
	}
	debugString += "\n \n";
	debugString += document.getElementById("Select").innerHTML;
	debugString += "\n \n";
	debugString += document.getElementById("toSend").value;
	document.getElementById("ErrorLocation").innerHTML = debugString;
}

function anonSend()
{
	const toSendText = document.getElementById("toSend").value;
	document.getElementById("toSend").value = "";
	const address = "https://api.groupme.com/v3/bots/post";
	var request = new XMLHttpRequest();
	request.open("POST", address);
	request.setRequestHeader('Content-Type', 'application/json');
	const toSend = JSON.stringify({
		bot_id: "836a0f79356255970f4177bf4d",
		text: toSendText
	});
	request.send(toSend);
}

window.onload = updateBasedOnToken;
