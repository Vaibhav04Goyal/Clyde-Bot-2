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

const NONE = 0;
const VOICE = 1;
const DRIVER = 2;
const MODERATOR = 3;
const BOT = 4;
const LEADER = 5;
const ROOMOWNER = 6;
const ADMIN = 7;

let ranks = " +%@*&#~";
let rankMap = new Map();
for (let i = 0, len = ranks.length; i < len; i++)
{
	rankMap.set(ranks.charAt(i), i);
}

exports.parse =
{
	actionUrl: url.parse("https://play.pokemonshowdown.com/~~" + config.serverid + "/action.php"),
	room: "lobby",
	chatData: {},
	ranks: {},
	msgQueue: [],

	/*bestOfThree:
	{
		havePlayerData: false,
		playerOne: "Player 1",
		playerOneTeam: [],
		playerTwo: "Player 2",
		playerTwoTeam: [],
		games: [],
		wins: []
	},*/

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
					if (room === "lobby" && config.serverid === "showdown") continue; //Policy is to not auto-join lobby
					send("|/join " + room);
				}
				for (let i = 0, len = config.privaterooms.length; i < len; i++)
				{
					let room = config.privaterooms[i];
					if (room === "lobby" && config.serverid === "showdown") continue; //Policy is to not auto-join lobby
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
						send("|/pm " + toID(by) + ", mish");
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
					console.log("Message sent too fast at: " + new Date().toLocaleString() + ". MESSAGE_THROTTLE in main.js is likely set too low.");
				}
				break;
			case "error": //this protocol is triggered whenever Showdown's errorReply() function is called
				console.log("Error message from Showdown: " + spl[2]);
				break;
			case "win":
				//this.bestOfThree.wins.push(spl[2]);
				this.say(room, "/leave");
				//this.displayNPAbox();
				break;
			case "player":
				/*if (spl[2] === "p1")
				{
					this.bestOfThree.playerOne = spl[3];
				}
				else
				{
					this.bestOfThree.playerTwo = spl[3];
				}*/
				break;
			case "poke":
				/*if (!this.bestOfThree.havePlayerData)
				{
					if (spl[2] === "p1")
					{
						this.bestOfThree.playerOneTeam.push(spl[3].substring(0, spl[3].indexOf(',')));
					}
					else
					{
						this.bestOfThree.playerTwoTeam.push(spl[3].substring(0, spl[3].indexOf(',')));
						if (this.bestOfThree.playerTwoTeam.length === 6)
						{
							this.bestOfThree.havePlayerData = true;
							this.displayNPAbox();
						}
					}
				}*/
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
			this.say("", "/join " + message.substr(8));
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
					this.say(room, "/pm " + by + ", You don't have access to this command.");
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
			msg = (room !== "lobby" ? room : "") + '|' + text;
		}
		else //if room has a comma, it was done in PM
		{
			room = room.substr(1);
			msg = "|/pm " + room + ", " + text;
		}
		send(msg);
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

		if (rankMap.get(user.charAt(0)) === -1)
		{
			userRank = NONE;
		}
		else
		{
			userRank = rankMap.get(user.charAt(0));
		}

		if (userRank >= NONE)
		{
			if(["commands", "git", "usage", "samples"].indexOf(cmd) >= 0)
			{
				canUse = true;
			}
		}

		if (userRank >= VOICE)
		{
			if (["tour", "notice", "usage", "thinking", "b", "epic"].indexOf(cmd) >= 0)
			{
				canUse = true;
			}
		}

		if (userRank >= DRIVER)
		{
			if (["insult", "8ball", "say", "objectively", "joke", "mish", "uno", "chef", "platypus", "mynameis", "nom", "diglett", "ezrael", "conics", "dynamax", "delet"].indexOf(cmd) >= 0)
			{
				canUse = true;
			}
		}

		/*if (cmd === "npa" && room.charAt(0) === ',')
		{
			if (["chalkey", "dualistx", "tan", "acenowak", "avatarfede", "azazelthegod", "cablevgc", "drfidget", "fumitobr", "gramgus", "jeanmarc", "kingofmars", "pd0nz", "platypusvgc", "pokealex", "renevgc", "rufflesbag", "tman", "xenobladehero"].indexOf(toID(room)) >= 0);
			{
				canUse = true;
			}
		}*/

		let roomOwners = ["dawoblefet", "blarajan"];
		if (userRank === ROOMOWNER || roomOwners.indexOf(toID(room)) >= 0)
		{
			if (cmd === "custom")
			{
				canUse = true;
			}
		}

		//Special cases
		switch (cmd)
		{
			case "tour":
				if ((userID === "legavgc" && arg === "vgc13") || (userID === "dorian0404" && (!arg || arg === "vgc18"))) {canUse = true;}
				break;
			case "blog":
				if (userID === "ansena") {canUse = true;}
				break;
			case "chef":
				if (userID.substr(0,4) === "chef") {canUse = true;}
				break;
			case "platypus":
				if (userID === "platypusvgc" || userID === "awesomeplatypus") {canUse = true;}
				break;
			case "mynameis":
				if (userID === "casedvictory") {canUse = true;}
				break;
			case "nom":
				if (userID === "seaco") {canUse = true;}
				break;
			case "ezrael":
				if (userID === "ezrael") {canUse = true;}
				break;
			case "epic":
				if (userID === "animus" || userID === "joeux9") {canUse = true;}
				break;
			case "uno":
				if (userID === "dingram") {canUse = true;}
				break;
			default:
				break;
		}

		//Owners have access to every command.
		if (config.owners) //Sanity check
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

			//Autocorrect regexes and corresponding autocorrections
			let autocorrectRegexes = [/(n|N)in(tales|etails|tails)/,/(m|M)eowstick/, /(c|C)owmoo/, /tylee/, /(w|W)olfie/, /(A|a)m(o|oo)ngus([^s]|$)/, /(s|S)hedninja/, /(d|d)a(w|W)obblefet/, /(s|S)norelax/, /(d|D)racofish/, /(b|B)abytron/];
			let autocorrectMessages = ["Ninetales", "Meowstic", "Kommo-o", "tlyee", "Wolfey", "Amoonguss", "Shedinja", "DaWoblefet", "Snorlax", "Dracovish", "Babbytron"];

			for (let i = 0; i < autocorrectRegexes.length; i++)
			{
				if (autocorrectRegexes[i].test(msg)) //If the message contains the regular expression
				{
					this.say(room, "*" + autocorrectMessages[i]);
					roomData.triggeredAutocorrect++;
				}
			}

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
	/* HTML boiler plate for tour helper
	<b>VGC 20XX</b>
	<br>
	<details>
		<summary>Rules for VGC 20XX</summary>
		y e e t
	</details>
	<details>
		<summary>Sample Teams</summary>
		<psicon pokemon=""></psicon> |
		<psicon pokemon=""></psicon> |
		<psicon pokemon=""></psicon> |
		<psicon pokemon=""></psicon> |
		<psicon pokemon=""></psicon> |
		<psicon pokemon=""></psicon> -
		<a href = "pokepastelink"><font size = "1">description</font></a>
		<br>
	</details> */
	generateHTMLSample: function(formatname, formatDescription, sampleTeams, isOpen)
	{
		let htmlText = "<b>" + formatname + "</b> <br> <details> <summary>Rules for " + formatname + " (click to view)</summary> " + formatDescription +  "</details> <details" + (isOpen ? " open" : "") + "> <summary>Sample Teams</summary>";
		let numSampleTeams = sampleTeams.length / 8;

		for (let i = 0; i < sampleTeams.length; i++)
		{
			let j;
			for (j = 0; j < 5; j++)
			{
				htmlText += "<psicon pokemon=\"" + sampleTeams[i][j] + "\"></psicon>|";
			}
			htmlText += "<psicon pokemon=\"" + sampleTeams[i][j] + "\"></psicon>";
			htmlText += "<a href= \"" + sampleTeams[i][j+1] + "\">"; //pokepaste link
			htmlText += "<font size = \"1\">(" + sampleTeams[i][j+2] + ")</font></a> <br>"; //description
		}
		htmlText += "</details>";
		return htmlText;
	},
	/*displayNPAbox: function()
	{
		let htmlText = "<center> <img src=\"https:\/\/i.imgur.com\/YzEVGvU.png\" width=\"30\" height=\"30\"> &nbsp;&nbsp; <span style=\"font-weight: bold; font-size: 20px; text-decoration: underline\">";
		htmlText += this.bestOfThree.playerOne + " vs. " + this.bestOfThree.playerTwo;
		htmlText += "<\/span> &nbsp;&nbsp; <img src=\"https:\/\/i.imgur.com\/YzEVGvU.png\" width=\"30\" height=\"30\"> <\/center> <br> <center>";
		for (let i = 0; i < 6; i++)
		{
			htmlText += "<psicon pokemon = \"" + this.bestOfThree.playerOneTeam[i] + "\"><\/psicon>";
		}
		htmlText += "|";
		for (let i = 0; i < 6; i++)
		{
			htmlText += "<psicon pokemon = \"" + this.bestOfThree.playerTwoTeam[i] + "\"><\/psicon>";
		}
		htmlText += "<\/center> <center style=\"font-size: 15px\">";
		for (let i = 0; i < 3; i++)
		{
			htmlText += "<a href=\"" + this.bestOfThree.games[i] + "\">Game " + (i+1) + "<\/a>";
			if (this.bestOfThree.wins[i] !== undefined)
			{
				htmlText += " (" + this.bestOfThree.wins[i] + " - <span style=\"font-weight: bold; color:green\"> Win<\/span>)"
			}
			htmlText += "<br>";
		}

		//logic for checking if bo3 is complete
		if (this.bestOfThree.wins.length == 3 || (this.bestOfThree.wins.length === 2 && this.bestOfThree.wins[0] === this.bestOfThree.wins[1]))
		{
			if (this.bestOfThree.wins[0] === this.bestOfThree.wins[1]) //if it was a 2-0
			{
				this.say(this.bestOfThree.games[2].substring(this.bestOfThree.games[2].lastIndexOf('/') + 1, this.bestOfThree.games[2].length), "/leave"); //leave game three if it was a 2-0
				htmlText += "<br>" + this.bestOfThree.wins[0] + " wins!";
			}
			else
			{
				htmlText += "<br>" + this.bestOfThree.wins[2] + " wins!";
			}
			this.bestOfThree.havePlayerData = false;

		}
		htmlText += "</center>";
		this.say("npa", "/addhtmlbox " + htmlText);
	},*/
	//B emoji: \ud83c\udd71\ufe0f
};
