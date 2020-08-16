/**
 * This is the file where commands get parsed.
 *
 * Modified by DaWoblefet for use with BoTTT III with original work by TalkTakesTime, Quinella, and Morfent.
 *
 * Some parts of this code are taken from the PokÃ©mon Showdown server code, so
 * credits also go to Guangcong Luo and other PokÃ©mon Showdown contributors.
 * https://github.com/Zarel/Pokemon-Showdown
 *
 * @license MIT license
 */

const { inspect } = require("util");
const https = require("https");
const url = require("url");

const ACTION_COOLDOWN = 3*1000;
const FLOOD_MESSAGE_NUM = 5;
const FLOOD_PER_MSG_MIN = 500; //This is the minimum time between messages for legitimate spam. It's used to determine what "flooding" is caused by lag
const FLOOD_MESSAGE_TIME = 6*1000;
const MIN_CAPS_LENGTH = 18;
const MIN_CAPS_PROPORTION = 0.8;

let ranks = " +%@*&#";
let rankMap = new Map();
for (let i = 0, len = ranks.length; i < len; i++)
{
	rankMap.set(ranks.charAt(i), i);
}

const commandsJSON = require("./commandpermissions.json");

exports.parse =
{
	actionUrl: url.parse("https://play.pokemonshowdown.com/~~" + config.serverid + "/action.php"),
	room: "lobby",
	mostRecentUserPM: "DaWoblefet",
	chatData: {},
	ranks: {},
	msgQueue: [],

	data: function(data)
	{
		if (data.substr(0, 1) === 'a')
		{
			data = JSON.parse(data.substr(1));
			if (data instanceof Array)
			{
				for (let i = 0, len = data.length; i < len; i++)
				{
					this.splitMessage(data[i]);
				}
			}
			else
			{
				this.splitMessage(data);
			}
		}
	},
	splitMessage: function(message)
	{
		if (!message) return;

		let room = "lobby";
		if (message.indexOf("\n") < 0) return this.message(message, room);

		let spl = message.split("\n");
		if (spl[0].charAt(0) === '>')
		{
			if (spl[1].substr(1, 4) === "init")
			{
				let roomJoined = spl[1].substr(6);
				if (roomJoined === "battle")
				{
					ok("joined battle " + spl[2].substr(7));
				}
				else
				{
					return ok("joined " + spl[2].substr(7));
				}
			}
			room = spl.shift().substr(1);
		}

		for (let i = 0, len = spl.length; i < len; i++)
		{
			this.message(spl[i], room);
		}
	},

	/*Showdown chat messages are handled by sending a string with data separated by the | character.
	Read more here: https://github.com/Zarel/Pokemon-Showdown/blob/167dce1ca67a1530449c0c777df8a5312f65fe26/PROTOCOL.md
	*/

	message: function(message, room)
	{
		//console.log(message);
		let spl = message.split('|');
		let by; //The user sending the message
		switch (spl[1])
		{
			case "challstr":
				info("received challstr, logging in...");
				let id = spl[2];
				let str = spl[3];

				let requestOptions =
				{
					hostname: this.actionUrl.hostname,
					port: this.actionUrl.port,
					path: this.actionUrl.pathname,
					agent: false
				};

				let data = "";
				if (!config.pass)
				{
					requestOptions.method = "GET";
					requestOptions.path += "?act=getassertion&userid=" + toID(config.nick) + "&challengekeyid=" + id + "&challenge=" + str;
				}
				else
				{
					requestOptions.method = "POST";
					data = "act=login&name=" + config.nick + "&pass=" + config.pass + "&challengekeyid=" + id + "&challenge=" + str;
					requestOptions.headers =
					{
						"Content-Type": "application/x-www-form-urlencoded",
						"Content-Length": data.length
					};
				}

				let req = https.request(requestOptions, function(res)
				{
					res.setEncoding("utf8");
					data = "";
					res.on("data", function(chunk)
					{
						data += chunk;
					});
					res.on("end", function()
					{
						if (data === ';')
						{
							error("failed to log in; nick is registered - invalid or no password given");
							process.exit(-1);
						}
						if (data.length < 50)
						{
							error("failed to log in: " + data);
							process.exit(-1);
						}

						if (data.indexOf("heavy load") !== -1)
						{
							error("the login server is under heavy load; trying again in one minute");
							setTimeout(function()
							{
								this.message(message);
							}.bind(this), 60 * 1000);
							return;
						}

						if (data.substr(0, 16) === "<!DOCTYPE html>")
						{
							error("Connection error 522; trying again in one minute");
							setTimeout(function()
							{
								this.message(message);
							}.bind(this), 60 * 1000);
							return;
						}

						try
						{
							data = JSON.parse(data.substr(1));
							if (data.actionsuccess)
							{
								data = data.assertion;
							}
							else
							{
								error("could not log in; action was not successful: " + JSON.stringify(data));
								process.exit(-1);
							}
						}
						catch (e) {}
						send("|/trn " + config.nick + ",0," + data);
					}.bind(this));
				}.bind(this));

				req.on("error", function(err)
				{
					error("login error: " + inspect(err));
				});

				if (data) req.write(data);
				req.end();
				break;
			case "updateuser":	
				if (toID(spl[2]) !== toID(config.nick)) return;

				if (spl[3] !== '1')
				{
					error("failed to log in, still guest");
					process.exit(-1);
				}

				ok("logged in as " + spl[2]);
				if (config.avatar)
				{
					send("|/avatar " + config.avatar);
				}
				if (config.status)
				{
					send("|/status " + config.status);
				}

				//Joining the rooms
				for (let i = 0, len = config.rooms.length; i < len; i++)
				{
					let room = config.rooms[i];
					send("|/join " + room);
				}
				for (let i = 0, len = config.privaterooms.length; i < len; i++)
				{
					let room = config.privaterooms[i];
					send("|/join " + room);
				}
				setInterval(this.cleanChatData.bind(this), 30 * 60 * 1000);
				break;
			case 'c': //Dev messages, punishments, global stuff
				by = spl[2];
				this.chatMessage(spl[3], by, room);
				break;
			case "c:": //Normal chat
				by = spl[3];
				this.processChatData(toID(by), room, spl[4], by.charAt(0));
				this.chatMessage(spl[4], by, room);
				break;
			case "pm":
				by = spl[2];
				if (toID(by) === toID(config.nick) && ranks.indexOf(by.charAt(0)) > -1)
				{
					this.ranks[room] = by.charAt(0);
				}
				if (toID(by) !== toID(config.nick))
				{
					console.log("PM from " + by + " at " + new Date().toLocaleString() + ": " + spl[4]); //Logs PMs to BoTTT III in the console.
					if (toID(spl[4]) === "mish")
					{
						send("|/pm " + toID(by) + ", mish mish");
					}
				}
				this.chatMessage(spl[4], by, ',' + by);
				break;
			case 'N': //Name changes with /nick or using the button
				by = spl[2];
				if (toID(by) === toID(config.nick) && ranks.indexOf(by.charAt(0)) > -1)
				{
					this.ranks[room] = by.charAt(0);
				}
				by = this.trimStatus(by);
				break;
			case 'J': case 'j': //User joining the room
				by = spl[2];
				if (toID(by) === toID(config.nick) && ranks.indexOf(by.charAt(0)) > -1)
				{
					this.ranks[room] = by.charAt(0);
				}
				break;
			case 'l': case 'L': //User leaving the room
				break;
			case "tournament":
				if (spl[2] === "update" || spl[2] === "create")
				{
					hasTourStarted = true;
				}
				if (spl[2] === "end" || spl[2] === "forceend")
				{
					hasTourStarted = false;
				}
				break;
			case "html": //HTML was received
				break;
			case "raw":
				if (spl[2].startsWith("<strong class=\"message-throttle-notice\">"))
				{
					error("Message sent too fast at: " + new Date().toLocaleString() + ". MESSAGE_THROTTLE in main.js is likely set too low.");
				}
				break;
			case "error": //this protocol is triggered whenever Showdown's errorReply() function is called
				if (spl[2].includes("valid tournament"))
				{
					this.say(room, spl[2]);
				}
				if (spl[2].includes("who are not in this room"))
				{
					send("|/pm " + this.mostRecentUserPM + ", You must be in the <<vgc>> room for this command to work in PMs (sorry, blame Showdown).");
				}
				error(new Date().toLocaleString() + ": Error message from Showdown: " + spl[2]);
				break;
			case "win":
				this.say(room, "/leave");
				break;
		}
	},
	chatMessage: function(message, by, room)
	{
		let cmdrMessage = "[\"" + room + '|' + by + '|' + message + "\"]";
		message = message.trim();

		//Auto-accepts invites to rooms if the global rank is % or higher.
		if (room.charAt(0) === ',' && message.substr(0,8) === "/invite " && this.hasRank(by, "%@*&~"))
		{
			send("|/join " + message.substr(8));
		}

		//If it's not a command or BoTTT III is saying a message, don't go any farther
		if (message.substr(0, config.commandcharacter.length) !== config.commandcharacter || toID(by) === toID(config.nick)) return;

		message = message.substr(config.commandcharacter.length);
		let index = message.indexOf(" ");
		let arg = "";
		let cmd;

		//Separate the command from its arguments, if any.
		if (index > -1)
		{
			cmd = message.substr(0, index);
			arg = message.substr(index + 1).trim();
		}
		else
		{
			cmd = message;
		}

		if (Commands[cmd])
		{
			//Accounts for aliases
			while (typeof Commands[cmd] !== "function")
			{
				cmd = Commands[cmd];
			}
			if (typeof Commands[cmd] === "function")
			{
				cmdr(cmdrMessage); //Logs the command information if specified in config.

				if (this.canUse(cmd, room, by, arg))
				{
					Commands[cmd].call(this, arg, by, room); //Run the command from commands.js
				}
				else
				{
					this.say(room, "You don't have access to this command.");
				}
			}
			else
			{
				error("invalid command type for " + cmd + ": " + (typeof Commands[cmd]));
			}
		}
	},
	say: function(room, text)
	{
		let msg;
		if (room.charAt(0) !== ',')
		{
			msg = room + '|' + text;
			send(msg);
		}
		else //if room has a comma, it was done in PM
		{
			room = room.substr(1);
			text = text.split('\n');
			for (i = 0; i < text.length; i++)
			{
				msg = "|/pm " + room + ", " + text[i];
				send(msg);
			}
			
		}
	},


	//If the user has the specified rank or is on the command exception list, return true
	hasRank: function(user, rank)
	{
		return rank.split("").indexOf(user.charAt(0)) !== -1;
	},

	//Modified by DaWoblefet
	canUse: function(cmd, room, user, arg)
	{
		let canUse = false;
		let userRank;
		let userID = toID(this.trimStatus(user));
		let commandsObject;
		let globalCommandsObject = commandsJSON["global"];

		//0 = regular user, 1 = voice, 2 = driver, 3 = mod, 4 = bot, 5 = leader, 6 = room owner, 7 = admin
		if (rankMap.get(user.charAt(0)) === -1)
		{
			userRank = 0;
		}
		else
		{
			userRank = rankMap.get(user.charAt(0));
		}

		commandsObject = commandsJSON[room] ? commandsJSON[room] : false;

		if (commandsObject)
		{
			//Check if the room has a direct rank for the command
			if (commandsObject[cmd])
			{
				if (userRank >= commandsObject[cmd]["rank"])
				{
					canUse = true;
				}
			}
			//Check if the room has a special user/arg condition for the command
			if (!canUse && commandsObject["special"][cmd])
			{
				//TODO: make more generic
				let userList = commandsObject["special"][cmd]["users"];
				let specialArg = commandsObject["special"][cmd]["arg"];
				if (specialArg === undefined) {specialArg = "";}

				if (userList.indexOf(userID) >= 0 && specialArg.indexOf(arg) >= 0)
				{
					canUse = true;
				}
			}			
		}
		//Check that room owners of a room can use .custom in PMs
		if (!canUse && cmd === "custom" && room.charAt(0) === ",")
		{
			if (arg.indexOf("[") === 0 && arg.indexOf("]") > -1)
			{
				targetRoom = arg.slice(1, arg.indexOf("]"));
				if (commandsJSON[targetRoom])
				{
					let userList = commandsJSON[targetRoom]["roomowners"];
					if (userList.indexOf(userID) >= 0)
					{
						canUse = true;
					}
				}
			}
		}
		//Fallback on global command settings if no local room commands were set
		if (!canUse && globalCommandsObject[cmd])
		{
			if (userRank >= globalCommandsObject[cmd]["rank"])
			{
				canUse = true;
			}
		}

		//Owners have access to every command.
		if (config.owners)
		{
			for (i = 0; i < config.owners.length; i++)
			{
				if (userID === toID(config.owners[i]))
				{
					canUse = true;
					break;
				}
			}
		}	

		return canUse;
	},

	processChatData: function(user, room, msg, auth)
	{
		if (!user || room.charAt(0) === ',') return;

		msg = msg.trim().replace(/[ \u0000\u200B-\u200F]+/g, " "); //Removes extra spaces and null characters so messages that should trigger stretching do so

		let now = Date.now();
		if (!this.chatData[user])
		{
			this.chatData[user] =
			{
				zeroTol: 0,
			};
		}
		let userData = this.chatData[user];

		if (!this.chatData[user][room])
		{
			this.chatData[user][room] =
			{
				times: [],
				points: 0,
				lastAction: 0,
				triggeredAutocorrect: 0
			};
		}
		let roomData = userData[room];

		roomData.times.push(now);

		//This deals with punishing rulebreakers. Note that the bot can't think, however, so it might make mistakes. It will not punish drivers+.
		if (config.allowmute && config.whitelist.indexOf(user) === -1 && "%@*&#~".indexOf(auth) === -1)
		{
			let pointVal = 0;
			let muteMessage = "";

			//Moderation for flooding (more than x lines in y seconds)
			let times = roomData.times;
			let timesLen = times.length;
			let isFlooding = (timesLen >= FLOOD_MESSAGE_NUM && (now - times[timesLen - FLOOD_MESSAGE_NUM]) < FLOOD_MESSAGE_TIME
				&& (now - times[timesLen - FLOOD_MESSAGE_NUM]) > (FLOOD_PER_MSG_MIN * FLOOD_MESSAGE_NUM));

			if (isFlooding)
			{
				if (pointVal < 2)
				{
					pointVal = 2;
					muteMessage = ", Stop spamming the chat";
				}
			}
			//Moderation for caps (over x% of the letters in a line of y characters are capital)
			let capsMatch = msg.replace(/[^A-Za-z]/g, "").match(/[A-Z]/g);
			if (capsMatch && toID(msg).length > MIN_CAPS_LENGTH && (capsMatch.length >= ~~(toID(msg).length * MIN_CAPS_PROPORTION)))
			{
				if (pointVal < 1)
				{
					pointVal = 1;
					muteMessage = ", Watch the caps";
				}
			}
			//Moderation for stretching (over x consecutive characters in the message are the same)
			let stretchMatch = /(.)\1{7,}/gi.test(msg) || /(..+)\1{4,}/gi.test(msg); //Matches the same character (or group of characters) 8 (or 5) or more times in a row
			if (stretchMatch)
			{
				if (pointVal < 1)
				{
					pointVal = 1;
					muteMessage = ", Don't stretch out what you type";
				}
			}

			/*//Autocorrect regexes and corresponding autocorrections
			let autocorrectRegexes = [
				/(A|a)m(o|oo)ngus([^s]|$)/,
				/(b|B)abytron/,
				/(c|C)owmoo/,
				/(d|d)a(w|W)obblefet/,
				/(d|D)racofish/,
				/(g|G)roundon/,
				/(m|M)eowstick/,
				/(n|N)in(tales|etails|tails|tailes)/,
				/(p|P)olitoad/,
				/(s|S)hedninja/,
				/(s|S)norelax/,
				/(t|T)(c|C)(p|P)(i|I)/,
				/(t|T)oxitricity/,
				/tylee/,
				/(vcg|VCG|Vcg)/,
				/(w|W)olfie/
			];
			let autocorrectMessages = [
				"Amoonguss",
				"Babbytron",
				"Kommo-o",
				"DaWoblefet",
				"Dracovish",
				"Groudon",
				"Meowstic",
				"Ninetales",
				"Politoed",
				"Shedinja",
				"Snorlax",
				"TPCi",
				"Toxtricity",
				"tlyee",
				"VGC",
				"Wolfey",
			];

			for (let i = 0; i < autocorrectRegexes.length; i++)
			{
				if (autocorrectRegexes[i].test(msg)) //If the message contains the regular expression
				{
					this.say(room, "*" + autocorrectMessages[i]);
					roomData.triggeredAutocorrect++;
				}
			}*/

			/* Room policy changed to not autocorrect on Pdon:
			/(p|P)(d|D)(o|O)(n|N)([^(z|Z)]|$)/ (for Pdon -> Primal Groudon; needed to account for Pd0nZ's name)
			Came with this PM bc of its controversial nature: Please do not use the abbreviation \"pdon\" for Primal Groudon. Say it out loud and you'll realize why. You can just say Groudon or don, and everyone will know what Pokemon you're talking about.
			*/

			if (((pointVal > 0 || roomData.triggeredAutocorrect >= 3)&& now - roomData.lastAction >= ACTION_COOLDOWN))
			{
				let cmd = "mute";
				//Defaults to the next punishment in config.punishVals instead of repeating the same action (so a second warn-worthy offense would result in a mute instead of a warn, and the third an hourmute, etc)
				if (roomData.points >= pointVal && pointVal < 4)
				{
					roomData.points++;
					cmd = config.punishvals[roomData.points] || cmd;
				}
				else //If the action hasn't been done before (is worth more points), it will be the one picked
				{
					cmd = config.punishvals[pointVal] || cmd;
					roomData.points = pointVal; // next action will be one level higher than this one (in most cases)
				}
				//Can't warn in private rooms
				if (config.privaterooms.indexOf(room) > -1 && cmd === "warn")
				{
					cmd = "mute";
				}

				//If the bot has % instead of @ or %, it will default to hourmuting as its highest level of punishment instead of roombanning
				if (roomData.points >= 4 && !this.hasRank(this.ranks[room] || " ", "@*&#~"))
				{
					cmd = "hourmute";
				}

				if (roomData.triggeredAutocorrect >= 3)
				{
					cmd = "warn";
					muteMessage = ", Stop triggering the autocorrect intentionally.";
					roomData.triggeredAutocorrect = 2; //resets the count so it won't continually spam warnings
				}

				//If zero tolerance users break a rule, they get an instant roomban or hourmute
				if (userData.zeroTol > 4)
				{
					muteMessage = ", Automated response: zero tolerance user";
					cmd = this.hasRank(this.ranks[room] || " ", "@*&#~") ? "roomban" : "hourmute";
				}
				if (roomData.points > 1)
				{
					userData.zeroTol++; //Getting muted or higher increases your zero tolerance level (warns do not)
				}
				roomData.lastAction = now;
				this.say(room, '/' + cmd + " " + user + muteMessage);
				console.log(cmd + ": " + user + " at " + new Date().toLocaleString());
			}
		}
	},
	cleanChatData: function()
	{
		let chatData = this.chatData;
		for (user in chatData)
		{
			for (room in chatData[user])
			{
				let roomData = chatData[user][room];
				if (!Object.isObject(roomData)) continue;

				if (!roomData.times || !roomData.times.length)
				{
					delete chatData[user][room];
					continue;
				}
				let newTimes = [];
				let now = Date.now();
				let times = roomData.times;
				for (let i = 0, len = times.length; i < len; i++)
				{
					if (now - times[i] < 5 * 1000)
					{
						newTimes.push(times[i]);
					}
				}
				newTimes.sort(function (a, b)
				{
					return a - b;
				});
				roomData.times = newTimes;
				if (roomData.points > 0 && roomData.points < 4)
				{
					roomData.points--;
				}
			}
		}
	},
	uncacheTree: function(root)
	{
		let uncache = [require.resolve(root)];
		do
		{
			let newuncache = [];
			for (let i = 0; i < uncache.length; ++i)
			{
				if (require.cache[uncache[i]])
				{
					newuncache.push.apply(newuncache,
						require.cache[uncache[i]].children.map(function(module)
						{
							return module.filename;
						})
					);
					delete require.cache[uncache[i]];
				}
			}
			uncache = newuncache;
		} while (uncache.length > 0);
	},
	trimStatus: function(username)
	{
		let result;
		username = username.split('@');

		if (username[0].charAt(0) === '') //this was a mod applying their status
		{
			result = username[1];
		}
		else //this was anyone else applying a status
		{
			result = username[0];
		}

		return result;
	},
	isRegUserOrPM: function(by, room)
	{
		return (by.charAt(0) === ' ' || room.charAt(0) === ',');
	},
	isRegUser: function(by)
	{
		return by.charAt(0) === ' ';
	},
	isPM: function(room)
	{
		return room.charAt(0) === ',';
	},
	
	generateHTMLSample: function(formatname, formatDescription, sampleTeams, isOpen, isPM)
	{
		let htmlText = "<strong>" + formatname + "</strong> <br> <details> <summary>Rules for " + formatname + " (click to view)</summary> " + formatDescription +  "</details> <details" + (isOpen ? " open" : "") + "> <summary>Sample Teams</summary>";
		
		for (let i = 0; i < sampleTeams.length; i++)
		{
			let j;
			for (j = 0; j < 6; j++)
			{
				htmlText += "<psicon ";
				if (isPM) {htmlText += "style = 'width: 35px;'";}
				htmlText += "pokemon='" + sampleTeams[i][j] + "'></psicon>";
				if (j !== 5) {htmlText += "|";}
			}
			htmlText += "<a href= '" + sampleTeams[i][j] + "'>"; //pokepaste link
			htmlText += "<span style = 'font-size: x-small'>(" + sampleTeams[i][j+1] + ")</span></a> <br>"; //description
			if (isPM && (i !== sampleTeams.length - 1)) {htmlText += "<br>";}
		}
		htmlText += "</details>";
		return htmlText;
	},
	generateHTMLContentCreators: function(creatorData, isPM)
	{
		const twitchlogo = "https://pngimg.com/uploads/twitch/twitch_PNG49.png";
		const youtubeLogo = "https://image.flaticon.com/icons/svg/1384/1384060.svg";
		const twitterLogo = "https://image.flaticon.com/icons/svg/124/124021.svg";
		const socialMediaLineSize = 13;

		let htmlText = "<center style = 'margin-bottom: 10px;'><h2 style = 'margin: 0'>Sample of VGC Content Creators</h2>";
		htmlText += "<em style = 'font-style: italic;'>Click the arrows to see links to a content creator's YouTube, Twitch, and Twitter!</em></center>";
		for (j = 0; j < 2; j++)
		{
			if (!isPM) {htmlText += "<div style = 'width: 50%; float: left;'>";}
			for (let i = j === 0 ? 0 : 1; i < creatorData.length; i = i + 2)
			{
				htmlText += "<details><summary><psicon pokemon = \"" + creatorData[i][0] + "\">" + creatorData[i][1] + "</summary>";
				htmlText += "<ul style = 'list-style-type: none; padding: 0;'>";

				if (creatorData[i][2]) //If they have a Twitch
				{
					htmlText += "<li>";
					htmlText += "<img src = \"" + twitchlogo + "\" height=" + socialMediaLineSize + " width=" + socialMediaLineSize + ">";
					htmlText += " <a href = \"" + creatorData[i][2] + "\">" + creatorData[i][3] + "</a> ";
					htmlText += "</li>";
				}
				if (creatorData[i][4]) //If they have a YouTube
				{
					htmlText += "<li>";
					htmlText += "<img src = \"" + youtubeLogo + "\" height=" + socialMediaLineSize + " width=" + socialMediaLineSize + ">";
					htmlText += " <a href = \"" + creatorData[i][4] + "\">" + creatorData[i][5] + "</a>";
					htmlText += "</li>";
				}
				if (creatorData[i][6]) //If they have a Twitter
				{
					htmlText += "<li>";
					htmlText += "<img src = \"" + twitterLogo + "\" height=" + socialMediaLineSize + " width=" + socialMediaLineSize + ">";
					htmlText += " <a href = \"" + creatorData[i][6] + "\">" + creatorData[i][7] + "</a>";
					htmlText += "</li>";
				}
				htmlText += "</ul></details>";
			}
			if (!isPM) {htmlText += "</div>";}
		}
		htmlText += "<div><p style = 'font-size: x-small';>Note: This list is not comprehensive.</p></div>";
		return htmlText;
	},
	generateHTMLUsage: async function(usageJSON, currentMonth, lastMonthRank)
	{
		let htmlText = "";
		let pokemon = usageJSON.pokemon;
		let rank = usageJSON.rank;
		let usagePercent = usageJSON.usage;
		let abilities = usageJSON.abilities;
		let items = usageJSON.items;
		let moves = usageJSON.moves;
		let spreads = usageJSON.spreads;
		let color;
		let rankDifference;

		if (Object.keys(abilities).length === 0) //if a Pokemon doesn't have ability data, it's not really being used
		{
			return "No usage data found for " + pokemon + ".";
		}

		let pokemonSprite;
		//Obtain sprite info
		if (pokemon.toLowerCase().includes("urshifu"))
		{
			pokemonSprite = toID(pokemon).includes("rapidstrike") ? "https://play.pokemonshowdown.com/sprites/gen5/urshifu-rapidstrike.png" : "https://play.pokemonshowdown.com/sprites/gen5/urshifu.png";
		}
		else 
		{
			pokemonSprite = "https://play.pokemonshowdown.com/sprites/ani/" + pokemon.toLowerCase().replace("'", "") + ".gif";
		}
		let probe = require('probe-image-size');
		let height;
		let width;
		try
		{
			await probe(pokemonSprite).then(result =>
			{
				height = result.height;
				width = result.width;
			});
		}
		catch (err)
		{
			pokemonSprite = "https://play.pokemonshowdown.com/sprites/rby/missingno.png";
			height = 96;
			width = 96;
		}

		//Rank since last month
		if (rank - lastMonthRank < 0)
		{
			color = "green";
			rankDifference = "+" + (lastMonthRank - rank);
		}
		else if (rank - lastMonthRank > 0)
		{
			color = "red";
			rankDifference = "-" + (rank - lastMonthRank);
		}
		else
		{
			color = "darkblue";
			rankDifference = "±0";
		}

		//Months
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let usageMonth =  months[currentMonth - 1];

		//Name and sprite
		htmlText += "<div><div style = 'float: left; border-right: 1px solid black;'><center style = 'margin-right: 5px;'>";
		htmlText += "<h2 style = 'margin: 0'>" + pokemon + "</h2>";
		htmlText += "<img src = \"" + pokemonSprite + "\" height=\"" + height + "\" width=\"" + width + "\"></center></div>";

		//Ranking information
		htmlText += "<div style = 'float: left; width: 55%;'><div style = 'margin-left: 5px;'>";
		htmlText += "<div style = 'float: right;'><h3 style = 'margin: 0'>Showdown Rank (" + usageMonth + ") - #" + rank + "</h3></div><div style = 'clear: both;'></div>";
		htmlText += "<span style = 'float: right;'><span style = 'float: right;'><span style = 'color: " + color + ";'><strong>" + rankDifference + "</strong></span> since " + (months !== 1 ? months[currentMonth - 2] : "December") + "</span>";
		htmlText += "<br><strong>" + usagePercent  + " usage</strong></span><div style = 'clear: both'></div><br>";

		//Abilities
		htmlText += "<details open><summary style = 'font-size: 14px'><strong>Abilities</strong></summary><ul style = 'margin: 0; padding-left: 18px'>"
		let abilityNames = Object.keys(abilities);
		for (i = 0; i < abilityNames.length; i++)
		{
			htmlText += "<li>" + abilityNames[i] + " - "  + abilities[abilityNames[i]] + "</li>";
		}
		htmlText += "</ul></details></div></div><div style = 'clear: both;'></div>";

		//Moves
		htmlText += "<div style = 'float: left;  width: 40%;'><div style = 'margin-right: 5px;'>";
		htmlText += "<details><summary style = 'font-size: 14px'><strong>Moves</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let moveNames = Object.keys(moves);
		for (i = 0; i < moveNames.length; i++)
		{
			htmlText += "<li>" + moveNames[i] + " - "  + moves[moveNames[i]] + "</li>";
		}
		htmlText += "</ul></details></div></div>";

		//Items
		htmlText += "<div style = 'float: left;  width: 40%;'><div style = 'margin-right: 5px;'>";
		htmlText += "<details><summary style = 'font-size: 14px'><strong>Items</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let itemNames = Object.keys(items);
		for (i = 0; i < itemNames.length; i++)
		{
			htmlText += "<li>" + itemNames[i] + " - "  + items[itemNames[i]] + "</li>";
		}
		htmlText += "</ul></details></div></div><div style = 'clear: both;'></div>";

		//EV spreads
		htmlText += "<div style = 'float: left;'><div style = 'margin-right: 5px;'>";
		htmlText += "<details><summary style = 'font-size: 14px'><strong>EV Spreads</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let natures = Object.keys(spreads);
		for (i = 0; i < natures.length; i++)
		{	
			if (natures[i] !== "Other")
			{
				let particularNature = spreads[natures[i]];
				let evs = Object.keys(particularNature);
				for (j = 0; j < evs.length; j++)
				{
					htmlText += "<li>" + natures[i] + ": "  + evs[j] + " - " + particularNature[evs[j]] + "</li>";
				}
			}
			else //Other is formatted differently.
			{
				htmlText += "<li>" + natures[i] + ": " + spreads[natures[i]] + "</li>";
			}
				
		}
		htmlText += "</ul></details></div></div></div>";

		return htmlText;
	},
	//TODO refactor this into the normal usage command with an extra argument
	generateHTMLUsagePM: async function(usageJSON, currentMonth, lastMonthRank)
	{
		let htmlText = "";
		let pokemon = usageJSON.pokemon;
		let rank = usageJSON.rank;
		let usagePercent = usageJSON.usage;
		let abilities = usageJSON.abilities;
		let items = usageJSON.items;
		let moves = usageJSON.moves;
		let spreads = usageJSON.spreads;
		let color;
		let rankDifference;

		if (Object.keys(abilities).length === 0) //if a Pokemon doesn't have ability data, it's not really being used
		{
			return "No usage data found for " + pokemon + ".";
		}

		//Rank since last month
		if (rank - lastMonthRank < 0)
		{
			color = "green";
			rankDifference = "+" + (lastMonthRank - rank);
		}
		else if (rank - lastMonthRank > 0)
		{
			color = "red";
			rankDifference = "-" + (rank - lastMonthRank);
		}
		else
		{
			color = "darkblue";
			rankDifference = "±0";
		}

		//Months
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let usageMonth =  months[currentMonth - 1];

		//Name and sprite
		htmlText += "<center>";
		htmlText += "<psicon pokemon = \"" + pokemon + "\"></psicon>";
		htmlText += "<h2 style = 'display: inline-block;'>" + pokemon + "</h2><br>";

		//Ranking information
		htmlText += "<strong>Showdown Rank (" + usageMonth + ") - #" + rank + "</strong><br>";
		htmlText += "<span style = 'color: " + color + ";'><strong>" + rankDifference + "</strong></span> since " + (months !== 1 ? months[currentMonth - 2] : "December");
		htmlText += "<br><strong>" + usagePercent  + " usage</strong>";
		htmlText += "</center><br>";

		//Abilities
		htmlText += "<details><summary style = 'font-size: 14px'><strong>Abilities</strong></summary><ul style = 'margin: 0; padding-left: 18px'>"
		let abilityNames = Object.keys(abilities);
		for (i = 0; i < abilityNames.length; i++)
		{
			htmlText += "<li>" + abilityNames[i] + " - "  + abilities[abilityNames[i]] + "</li>";
		}
		htmlText += "</ul></details>";

		//Moves
		htmlText += "<details><summary style = 'font-size: 14px'><strong>Moves</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let moveNames = Object.keys(moves);
		for (i = 0; i < moveNames.length; i++)
		{
			htmlText += "<li>" + moveNames[i] + " - "  + moves[moveNames[i]] + "</li>";
		}
		htmlText += "</ul></details>";

		//Items
		htmlText += "<details><summary style = 'font-size: 14px'><strong>Items</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let itemNames = Object.keys(items);
		for (i = 0; i < itemNames.length; i++)
		{
			htmlText += "<li>" + itemNames[i] + " - "  + items[itemNames[i]] + "</li>";
		}
		htmlText += "</ul></details>";

		//EV spreads
		htmlText += "<details><summary style = 'font-size: 14px'><strong>EV Spreads</strong></summary><ul style = 'margin: 0; padding-left: 18px'>";
		let natures = Object.keys(spreads);
		for (i = 0; i < natures.length; i++)
		{	
			if (natures[i] !== "Other")
			{
				let particularNature = spreads[natures[i]];
				let evs = Object.keys(particularNature);
				for (j = 0; j < evs.length; j++)
				{
					htmlText += "<li>" + natures[i] + ": "  + evs[j] + " - " + particularNature[evs[j]] + "</li>";
				}
			}
			else //Other is formatted differently.
			{
				htmlText += "<li>" + natures[i] + ": " + spreads[natures[i]] + "</li>";
			}
				
		}
		htmlText += "</ul></details>";

		return htmlText;
	},
	generateTextUsage: async function(usageJSON, currentMonth, lastMonthRank)
	{
		let text = "";
		let pokemon = usageJSON.pokemon;
		let rank = usageJSON.rank;
		let usagePercent = usageJSON.usage;
		let abilities = usageJSON.abilities;
		let items = usageJSON.items;
		let moves = usageJSON.moves;
		let spreads = usageJSON.spreads;
		let rankDifference;

		if (Object.keys(abilities).length === 0) //if a Pokemon doesn't have ability data, it's not really being used
		{
			return "No usage data found for " + pokemon + ".";
		}


		//Rank since last month
		if (rank - lastMonthRank < 0)
		{
			rankDifference = "+" + (lastMonthRank - rank);
		}
		else if (rank - lastMonthRank > 0)
		{
			rankDifference = "-" + (rank - lastMonthRank);
		}
		else
		{
			rankDifference = "±0";
		}

		//Months
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let usageMonth =  months[currentMonth - 1];

		text += usageMonth + " Usage Stats for **" + pokemon + "** (Rank " + rank + ")\n";
		text += pokemon + " was on " + usagePercent + " of teams; its rank has adjusted by " + rankDifference + " since " + (months !== 1 ? months[currentMonth - 2] : "December") + ".\n";
		text += "**Abilities**:";
		let abilityNames = Object.keys(abilities);
		for (i = 0; i < abilityNames.length; i++)
		{
			text += abilityNames[i] + " - "  + abilities[abilityNames[i]] + "; ";
		}
		text += "\n";

		text += "**Moves**:";
		let moveNames = Object.keys(moves);
		for (i = 0; i < moveNames.length; i++)
		{
			text += moveNames[i] + " - "  + moves[moveNames[i]] + "; ";
			if (i % 3 === 0 && i !== 0)
			{
				text += "\n";
			}
		}
		text += "\n";

		text += "**Items**:";
		let itemNames = Object.keys(items);
		for (i = 0; i < itemNames.length; i++)
		{
			text += itemNames[i] + " - "  + items[itemNames[i]] + "; ";
			if (i % 3 === 0 && i !== 0)
			{
				text += "\n";
			}
		}
		text += "\n";

		text += "**EV Spreads**:";
		let natures = Object.keys(spreads);
		for (i = 0; i < natures.length; i++)
		{	
			if (natures[i] !== "Other")
			{
				let particularNature = spreads[natures[i]];
				let evs = Object.keys(particularNature);
				for (j = 0; j < evs.length; j++)
				{
					text += natures[i] + ": "  + evs[j] + " - " + particularNature[evs[j]] + "; ";
				}
			}
			else //Other is formatted differently.
			{
				text += natures[i] + ": " + spreads[natures[i]] + "; ";
			}
			if (i !== natures.length - 1) {text += "\n";}		
		}

		return text;
	},
	//B emoji: \ud83c\udd71\ufe0f
};
