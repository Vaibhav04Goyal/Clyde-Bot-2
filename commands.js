/**
 * This is the file where the bot commands are located.
 *
 * Modified by DaWoblefet for use with BoTTT III with original work by TalkTakesTime, Quinella, and Morfent.
 *
 * Useful references:
 * https://github.com/Zarel/Pokemon-Showdown/blob/1ef018c93bbfe8d86cb895b57151b27a080abccb/chat-commands.js
 * https://github.com/Zarel/Pokemon-Showdown/tree/1ef018c93bbfe8d86cb895b57151b27a080abccb/chat-plugins
 * @license MIT license
 */

const http = require("http");
const { inspect } = require("util");

if (config.serverid === "showdown")
{
	const https = require("https");
}

const tourJSON = require("./tourformats.json");

exports.commands =
{
	//Information/Help Commands

	//Links to a more detailed pastebin for the user to read about the bot's commands.
	about: "commands",
	guide: "commands",
	help: "commands",
	commands: function(arg, by, room)
	{
		let text;
		if (config.botguide)
		{
			text = "A guide on how to use " + config.nick + " can be found here: " + config.botguide;
		}
		else
		{
			text = "There is no guide for this bot. PM the owner, " + config.owners[0] + " , with any questions.";
		}
		if (by.charAt(0) === " ") //Regular user used command in chatroom
		{
			text = "/pm " + by + ", " + text;
		}
		this.say(room, text);
	},
	git: function(arg, by, room)
	{
		let text;

		if (config.git)
		{
			text = "Source code for " + config.nick + ": " + config.git;
		}
		else
		{
			text = "There is no public source code for " + config.nick + ". However, the repository for the bot it is based on, BoTTT III, can be found here: https://github.com/DaWoblefet/BoTTT-III.";
		}
		if (by.charAt(0) === " ") //Regular user used command in chatroom
		{
			text = "/pm " + by + ", " + text;
		}
		this.say(room, text);
	},

	/*Developer Commands
	 *These commands are useful for bot upkeep, or generally speaking, any arbitrary action.
	 *They are very powerful and not intended for the average user. */

	// Refreshes the command list and parser. To refresh something else, you must stop the bot completely. Only dev has access.
	rl: "reload",
	reload: function(arg, by, room)
	{
		try
		{
			this.uncacheTree("./commands.js");
			Commands = require("./commands.js").commands;
			this.uncacheTree("./parser.js");
			Parse = require('./parser.js').parse;
			this.say(room, "Commands reloaded.");
		}
		catch (e)
		{
			error("Failed to reload: " + inspect(e));
		}
	},

	/* Tells BoTTT III to say whatever you want, including PS commands. Restricted to room owners. Must be done in PM.
	Usage: .custom [room] thing you want BoTTT III to say/do
	Example: ".custom [vgc] !dt pikachu" will cause BoTTT III to say !dt pikachu in the VGC room.

	If you need to display HTML or do some other sequence of commands that is too long for a PM, you can link the bot
	a pastebin.com/raw/ link and it will read and execute that instead.
	Example: ".custom [vgc] https://pastebin.com/raw/therestofthePastebinURL"
	*/
	custom: async function(arg, by, room)
	{
		let targetRoom;
		if (arg.indexOf("[") === 0 && arg.indexOf("]") > -1)
		{
			targetRoom = arg.slice(1, arg.indexOf("]"));
			arg = arg.substr(arg.indexOf("]") + 1).trim();
		}

		if (arg.substr(0, 25) === "https://pastebin.com/raw/")
		{
			const rp = require("request-promise-native");
			const contents = await rp(arg);
			arg = contents;
		}

		//If no target room is specified, it just sends it back as a PM.
		this.say(targetRoom || room, arg);
	},

	//Executes arbitrary javascript. Only dev can use it.
	js: function(arg, by, room)
	{
		try
		{
			let result = eval(arg.trim());
			this.say(room, JSON.stringify(result));
		}
		catch (e)
		{
			this.say(room, e.name + ": " + e.message);
		}
	},

	//Updates bot to the latest version from git. Only dev can use it. Taken from: https://github.com/TheMezStrikes/uopbot/blob/master/commands.js
	gitpull: function(arg, by, room)
	{
		let text;
		if (config.git)
		{
			const child_process = require('child_process');
			try
			{
				child_process.execSync('git pull ' + config.git + ' master', {stdio: 'inherit'});
				text = "git pull successful.";
			}
			catch (e)
			{
				this.say(room, e.name + ": " + e.message);
				text = "git pull unsuccessful.";
			} 	
		}
		else
		{
			text = "There is no git URL specified for this bot.";
		}
		this.say(room, text);
	},

	kill: function(arg, by, room)
	{
		console.log(config.nick + " terminated at " + new Date().toLocaleString());
		process.exit(-1);
	},

	//General commands

	//Tells the bot something to say, and it says it. Won't say commands.
	tell: "say",
	say: function(arg, by, room)
	{
		this.say(room, stripCommands(arg));
	},

	//Ask the bot a question, and it returns a random answer. Came with the bot.
	"8ball": function(arg, by, room)
	{
		let text;
		const rand = ~~(20 * Math.random()) + 1;

		switch (rand)
		{
	 		case 1: text = "Signs point to yes."; break;
	  		case 2: text = "Yes."; break;
			case 3: text = "Reply hazy, try again."; break;
			case 4: text = "Without a doubt."; break;
			case 5: text = "My sources say no."; break;
			case 6: text = "As I see it, yes."; break;
			case 7: text = "You may rely on it."; break;
			case 8: text = "Concentrate and ask again."; break;
			case 9: text = "Outlook not so good."; break;
			case 10: text = "It is decidedly so."; break;
			case 11: text = "Better not tell you now."; break;
			case 12: text = "Very doubtful."; break;
			case 13: text = "Yes - definitely."; break;
			case 14: text = "It is certain."; break;
			case 15: text = "Cannot predict now."; break;
			case 16: text = "Most likely."; break;
			case 17: text = "Ask again later."; break;
			case 18: text = "My reply is no."; break;
			case 19: text = "Outlook good."; break;
			case 20: text = "Don't count on it."; break;
		}

		this.say(room, text);
	},

	//Creates a tournament with custom options. Sample teams are provided for each format when applicable.
	tour: function(arg, by, room)
	{
		let arglist = arg.split(', ');

		if (arg === "reset" || arg === "restart")
		{
			hasTourStarted = false;
			this.say(room, "Tournament creation should be working again.");
			this.say(room, "/pm " + by + ", Please let DaWoblefet know tours were broken.");
			console.log("Tour reset was called. Better check it out. " + new Date().toLocaleString());
			return;
		}

		if (!hasTourStarted)
		{
			let tourformat;
			let tourname;
			let tourObject;
			const defaultTour = "vgc2020";
			
			//Handle default case, double elim, and random format options.
			switch (arglist[0])
			{
				case "": //No argument specified, use default tour.
					arglist[0] = defaultTour;
					break;
				case "double":
				case "double elim":
				case "double elimination":
					arglist[0] = defaultTour;
					arglist[1] = "elimination";
					arglist[2] = "128";
					arglist[3] = "2";
					break;
				case "random":
				case "random vgc":
					let vgcFormats = ["vgc11", "vgc12", "vgc13", "vgc14", "vgc14.5", "vgc15", "vgc16", "vgc17", "vgc18", "sun", "moon", "ultra", "vgc20"];
					arglist[0] = vgcFormats[Math.floor(Math.random() * vgcFormats.length)];
					break;
				default:
					break;
			}

			//Prepare tournament format.
			switch (arglist[0])
			{
				case "vgc20":
				case "vgc2020":
					tourObject = tourJSON["gen8vgc2020"];
					break;
				case "ultra":
				case "ultra series":
				case "vgc19":
				case "vgc2019":
					tourObject = tourJSON["gen7vgc2019ultraseries"];
					break;
				case "moon":
				case "moon series":
					tourObject = tourJSON["gen7vgc2019moonseries"];
					break;
				case "sun":
				case "sun series":
					tourObject = tourJSON["gen7vgc2019sunseries"];
					break;
				case "vgc18":
				case "vgc2018":
					tourObject = tourJSON["gen7vgc2018"];
					break;
				case "vgc17":
				case "vgc2017":
					tourObject = tourJSON["gen7vgc2017"];
					break;
				case "vgc16":
				case "vgc2016":
					tourObject = tourJSON["gen6vgc2016"];
					break;
				case "vgc15":
				case "vgc2015":
					tourObject = tourJSON["gen6vgc2015"];
					break;
				case "vgc14.5":
				case "vgc2014.5":
					tourObject = tourJSON["gen6vgc2014.5"];
					break;
				case "vgc14":
				case "vgc2014":
					tourObject = tourJSON["gen6vgc2014"];
					break;
				case "vgc13":
				case "vgc2013":
					tourObject = tourJSON["gen5vgc2013"];
					break;
				case "vgc12":
				case "vgc2012":
					tourObject = tourJSON["gen5vgc2012"];
					break;
				case "vgc11":
				case "vgc2011":
					tourObject = tourJSON["gen5vgc2011"];
					break;
				case "corsola":
				case "corsolacup":
				case "corsola cup":
					tourObject = tourJSON["gen8corsolacup"];
					break;
				case "bulu":
				case "tapu bulu":
				case "tapu bulu cup":
				case "bulucup":
				case "bulu cup":
					tourObject = tourJSON["gen7bulucup"];
					break;
				case "crab":
				case "craboff":
				case "crab off":
					tourObject = tourJSON["gen7craboff"];
					break;
				case "inverse":
				case "inverse vgc":
				case "vgc inverse":
					tourObject = tourJSON["gen8inversevgc"];
					break;
				case "vgclc":
				case "lcvgc":
				case "little cup vgc":
				case "vgc little cup": //Little Cup style. Doesn't enforce level 5 limit.
					tourObject = tourJSON["gen8littlecupvgc"];
					break;
				case "gio":
				case "eevee":
					tourObject = tourJSON["gen8giocup"];
					break;
				case "kantocup":
				case "kanto":
				case "gen1cup":
				case "vgc98":
					tourObject = tourJSON["gen7vgc98"];
					break;
				case "random battle":
				case "randombattle":
				case "gen7randombattle":
				case "randomdoubles":
				case "gen7doublesrandombattle":
					this.say(room, "Cannot start random battle tours.");
					return;
				case "cap":
					this.say(room, "Cannot start CAP tours.");
					return;
				default:
					tourformat = arglist[0];
					tourname = "";
					break;
			}

			//If no extra settings are specified, make the tour single elim with 128 player cap.
			if (arglist[1] === undefined)
			{
				arglist[1] = "elimination";
			}
			if (arglist[1] === "double")
			{
				arglist[1] = "elimination";
				arglist[2] = "128";
				arglist[3] = "2";
			}
			if (arglist[2] === undefined || isNaN(arglist[2]))
			{
				arglist[2] = "128";
			}
			if (arglist[3] === undefined|| isNaN(arglist[3]))
			{
				arglist[3] = "1";
			}

			if (tourObject)
			{
				tourformat = tourObject.tourformat;
				tourname = tourObject.tourname;
			}
			
			let tourCommand = "/tour create " + tourformat + ", " + arglist[1] + ", " + arglist[2] + ", " + arglist[3];
			if (tourname) { tourCommand += ", " + tourname; }
			this.say(room, tourCommand);
			
			if (tourObject)
			{
				if (tourObject.tourrules)
				{
					this.say(room, "/tour rules " + tourObject.tourrules);
				}
				//Note: this will always display tournote, even if the tour wasn't started because of invalid data.
				if (tourObject.tournote)
				{
					this.say(room, "/wall " + tourObject.tournote);
				}

				if (tourObject.formatDescription && tourObject.sampleTeams)
				{
					let htmlText = this.generateHTMLSample(tourObject.formatname, tourObject.formatDescription, tourObject.sampleTeams, true);
					this.say(room, "/addhtmlbox " + htmlText);
				}
			}
			
			this.say(room, "/tour autostart 2");
			this.say(room, "/tour autodq 0.75");
		}
		else
		{
			this.say(room, "A tournament has already been started.");
		}
	},

	//Applies a random insult to the target user.
	insult: function(arg, by, room)
	{
		let arglist = arg.split(',');

		//Gives myself and the bot insult immunity. Prevents sneaky UTF-8 similar looking characters intended to avoid the insult.
		if (toID(arglist[0]).includes("dawob") || toID(arglist[0]).includes("trey") || toID(arglist[0]).includes("leonard") || toID(arglist[0]).includes(toID(config.nick)) || /[^\u0000-\u007F]/g.test(arglist[0]))
		{
			arglist[0] = by.substring(1, by.length);
		}

		let insultList = [
			arglist[0] + " is worse than Bright Size.",
			arglist[0] + " has more Play Points than CP.",
			arglist[0] + " is the reason we have to put instructions on shampoo.",
			"Roses are red, violets are blue. If " + arglist[0] + " was a Pokemon, I wouldn't choose you.",
			arglist[0] + " uses the word objectively to describe subjective things.",
			"They say opposites attract. I hope " + arglist[0] + " meets someone who is good-looking, intelligent, and cultured.",
			arglist[0] + " can't even win with 5-move Volcarona.",
			arglist[0] + " calls Kommo-o \"cowmoo\".",
			arglist[0] + "'s social life is as exciting as the derivative of e^^x^^.",
			"The intersection of " + arglist[0] + "'s brain and reality is the null set.",
			"Trying to understand " + arglist[0] + "'s teambuilding decisions is more complex than solving the P vs. NP problem.",
			arglist[0] + " is the type of person who stares at a can of orange juice because it says \"concentrate\".",
			arglist[0] + " uses Facade Snorlax on teams with Tapu Fini."
		];

		let douInsultList = [
			arglist[0] + " is the reason we have to put instructions on shampoo.",
			"Roses are red, violets are blue. If " + arglist[0] + " was a Pokemon, I wouldn't choose you.",
			arglist[0] + " doesn't have nice access to anything, really.",
			arglist[0] + " lost to matame 6 times in one tournament.",
			arglist[0] + " uses Fake Out with Psychic Terrain up.",
			arglist[0] + " uses the word objectively to describe subjective things.",
			"They say opposites attract. I hope " + arglist[0] + " meets someone who is good-looking, intelligent, and cultured.",
			arglist[0] + "'s social life is as exciting as the derivative of e^^x^^.",
			"The intersection of " + arglist[0] + "'s brain and reality is the null set.",
			"Trying to understand " + arglist[0] + "'s teambuilding decisions is more complex than solving the P vs. NP problem.",
			arglist[0] + " is the type of person who stares at a can of orange juice because it says \"concentrate\"",
			"AuraRayquaza has better opinions than " + arglist[0] + ".",
			arglist[0] + "\'s team decisions are even more questionable than Totem's choice of anime.",
			arglist[0] + " peaked in 2015.",
			arglist[0] + " lost to mono-Fire."
		];

		let text = "";

		let insultNum = parseInt(arglist[1]);
		if (arglist[1] == null)
		{
			let rand = Math.floor(insultList.length * Math.random());
			insultNum = rand;
		}
		if (room !== "dou")
		{
			text = insultList[insultNum];
			if (insultNum === 0 && arglist[0] === "Bright Size")
			{
				text = "Bright Size is worse than Bright Size. If you think about it long enough, you'll realize you thought too long.";
			}
		}
		else
		{
			text = douInsultList[insultNum];
			if (insultNum === 12 && arglist[0] === "AuraRayquaza")
			{
				text = "AuraRayquaza has better opinions than AuraRayquaza. If you think about it long enough, you'll realize you thought too long.";
			}
		}

		if (text == undefined)
		{
			text = arglist[0] + " is bad and should feel bad.";
			this.say(room, "/pm " + by + ", You entered an invalid insult number, probably. Valid insult numbers are 0-" + (insultList.length - 1) + ".");
		}

		this.say(room, text);
	},

	//Randomly picks one of my very funny jokes.
	joke: function(arg, by, room)
	{
		let jokeList = [
			"What's the difference between a jeweler and a jailor? One sells watches, and the other watches cells!",
			"Why do seagulls fly over the sea? Because if they flew over the bay, they'd be bagels!",
			"Why is it a waste of time to talk to a cow? Because it just goes in one ear and out the udder!",
			"Why did the invisible man turn down the job offer? He couldn't see himself doing it.",
			"What do prisoners use to call each other? Cell phones!",
			"What do you call a bee that can't make up its mind? A maybe!",
			"What do you call a bee that lives in America? A USB!",
			"What do you call an everyday potato? A commentator!",
			"Why did the partially blind man fall down the well? Because he couldn't see that well.",
			"What's the difference between a dog and a marine biologist? One wags its tail, and the other tags a whale!",
			"Where do ants go when it's hot outside? **Ant**arctica!",
			"What happened when the oceans raced each other? They tide!",
			"What do you call a chicken that calculates how to cross the road? A mathemachicken!",
			"A woman in labor suddenly shouted, \"Shouldn't! Wouldn't! Couldn't! Didn't! Can't!\". \"Don't worry\", said the doctor, \"those are just contractions.\"",
			"Why did the sun not go to college? It already had three million degrees!",
			"What's the difference between a diameter and a radius? A radius!",
			"What did the scientist say when he found two isotopes of helium? HeHe",
			"Why do Marxists only drink bad tea? Because all proper tea is theft.",
			"What's a frog's favorite drink? Diet croak!",
			"As I handed Dad his 50th birthday card, he looked at me with tears in his eyes and said, \"You know, one would have been enough.\"",
			"I'd tell you a Fibonacci joke, but it's probably as bad as the last two you've heard combined.",
			"Why don't Americans switch from using pounds to kilograms? Because there'd be a mass confusion.",
			"Where do fish go to work at? The offish!",
			"What do you call two friends who both like math? Algebros!",
			"What happened to the man that injested plutonium? He got atomicache!",
			"My sister bet me $100 I couldn't build a car out of spaghetti. You should have seen her face when I drove right pasta!",
			"Did you hear people aren't naming their daughters Karen nowadays? Soon there won't be a Karen the world.",
			"Why is justice best served cold? Because if it was served warm, it would be just water!",
			"Last week, I decided I was going to enter the Worlds Tightest Hat competition. I just hope I can pull it off...",
			"What do you call a beehive where bees can never leave? Un-bee-leaveable!",
			"How much does it cost for a pirate to get their ears pierced? A buccaneer!",
			"The minus button on my calculator is broken. On the plus side, it works.",
			"Gravity is one of the fundamental forces in the universe. If you removed it, you'd get gravy.",
			"Did you know that if you cut off your left arm, your right arm is left?",
			"The other day, I spotted an albino dalmatian. I figured it was the least I could do for him.",
			"What is the loudest pet? A trum**pet**!",
			"What's the best way to cook an alligator? In a crockpot!",
			"What's the best way to make a pirate angry? Remove the p!",
			"Last night, my wife was feeling pretty emotional, and she started coloring on my upper arm. I guess she just needed a shoulder to crayon.",
			"Did you hear about the marriage of the invisible man and the invisible woman? I'm just not sure what they saw in each other.",
			"Where do you take a boat when it gets sick? To the doc!",
			"My eye doctor called and said the results of my last appointment were finished. When I asked if I could see them, she said, \"probably not\".",
			"A priest, a pastor, and a rabbit walk into a bar. The rabbit says, \"I must be a typo!\"",
			"Why was the tennis club's website down? They had problems with their server.",
		];

		let jokeNum = arg === "latest" ? jokeList.length - 1 : parseInt(arg);

		if (!arg)
		{
			let rand = Math.floor(jokeList.length * Math.random());
			jokeNum = rand;
		}

		let text = jokeList[jokeNum];
		if (text == undefined)
		{
			text = "le epic funny joke.";
			this.say(room, "/pm " + by + ", You entered an invalid joke number, probably. Valid joke numbers are 0-" + (jokeList.length - 1) + ".");
		}

		this.say(room, text);
	},

	//Displays a notice in case I need to tweak the bot.
	notice: function(arg, by, room)
	{
		let text = "/wall Please note that " + config.nick + " may be tweaked periodically. Please be patient if a tour is canceled; it's probably just to test something.";
		this.say(room, text);
	},

	//Displays recent VGC usage stats. Also works in PM.
	usgae: "usage",
	usage: function(arg, by, room)
	{
		let text;
		let vgcstats = "https://vgcstats.com";
		//let bsUsage = "https://3ds.pokemon-gl.com/battle/usum/#wcs";
		let psUsage = "https://www.smogon.com/stats/2020-02/gen8vgc2020-1760.txt";
		let psDetailedUsage = "https://www.smogon.com/stats/2020-02/moveset/gen8vgc2020-1760.txt";
		let jorijnUsage = "https://drive.google.com/drive/folders/1lQr-HyxCjQJF_uoZVBqi7IfZFiAQwb2A";

		if (by.charAt(0) === ' ' || room.charAt(0) === ",")
		{
			this.say(room, "/pm " + by + ", VGC Stats Website: " + vgcstats);
			//this.say(room, "/pm " + by + ", Battle Spot Usage: " + bsUsage);
			this.say(room, "/pm " + by + ", Showdown Usage Stats: " + psUsage);
			this.say(room, "/pm " + by + ", Showdown Detailed Usage Stats: " + psDetailedUsage);
			this.say(room, "/pm " + by + ", Jorijn's Detailed Showdown Usage Stats: " + jorijnUsage);
			return false;
		}
		else
		{
			//See usage.html
			text = "/addhtmlbox <strong>VGC Usage Stats!</strong> <ul style = \"list-style: outside; margin: 0px 0px 0px -20px\"><li><a href=\"" + vgcstats + "\">VGC Stats Website</a></li><li><a href=\"" + psUsage + "\">Showdown Usage</a></li><li><a href=\"" + psDetailedUsage + "\">Showdown Detailed Usage</a></li><li><a href = \"" + jorijnUsage + "\">Jorijn's Detailed Showdown Usage Stats</a></li></ul>";
		}
		this.say(room, text);
	},

	/*npa: function(arg, by, room)
	{
		if (room !== "npa" && room.charAt(0) !== ',')
		{
			this.say(room, "Discuss NPA matches in <<npa>>. Read more about NPA by typing /rfaq npa.");
		}
		else
		{
			if (arg === "reset")
			{
				Parse.bestOfThree.havePlayerData = false;
				this.say(room, "NPA match automation should be working again.");
				return;
			}
			let games = arg.split(', ');
			if (games.length !== 3)
			{
				this.say(room, "You must give a link to all three games, separated by commas.");
				return;
			}
			if (Parse.bestOfThree.havePlayerData)
			{
				this.say(room, "Only one NPA set may be managed by " + config.nick + " at a time.");
				return;
			}
			//Initialize data
			Parse.bestOfThree.wins = [];
			Parse.bestOfThree.games = [];
			Parse.bestOfThree.playerOneTeam = [];
			Parse.bestOfThree.playerTwoTeam = [];

			//Join the games
			for (let i = 0; i < games.length; i++)
			{
				Parse.bestOfThree.games.push(games[i]);
				this.say(room, "/j " + games[i].substring(games[i].lastIndexOf('/') + 1, games[i].length));
			}
		}
	},*/

	uno: function(arg, by, room)
	{
		this.say(room, "/uno create 10");
		this.say(room, "/uno autostart 30");
		let timer = 10;
		if (by === "dingram")
		{
			timer = 5;
		}
		this.say(room, "/uno timer " + timer);
	},

	objective: "objectively",
	objectively: function(arg, by, room)
	{
		let text = "Something is \"objective\" when it is true independently of personal feelings or opinions, instead based on hard facts. For example, Flamethrower objectively has higher accuracy than Fire Blast, and Fire Blast objectively has a higher Base Power than Flamethrower.<br><br>";
		text += "Subjective refers to personal preferences, opinions, or feelings. Anything subjective is subject to interpretation. For example, you might think Flamethrower is better than Fire Blast, but another player might think Fire Blast is better; the opinion is subjective.<br><br>";
		text += "That's not to say opinions are bad! It's also ok to put forth reasoning into your opinions and defend them. It's not correct, however, to say some opinion you have is objectively true.";
		this.say(room, "/addhtmlbox " + text);
	},

	mish: function(arg, by, room)
	{
		if (room === "vgc")
		{
			return false; //Policy is not to mish in VGC
		}
		this.say(room, "mish mish");

		let rand = Math.floor(Math.random() * 10);
		if (rand === 1) //10% chance to roll
		{
			this.say(room, "/addhtmlbox <img src=\"https://images-ext-1.discordapp.net/external/jZ8e-Lcp6p2-GZb8DeeyShSvxT2ghTDz7nLMX8c1SKs/https/cdn.discordapp.com/attachments/320922154092986378/410460728999411712/getmished.png?width=260&height=300\" height=300 width=260>");
		}
	},

	blog: function(arg, by, room)
	{
		this.say(room, "/addhtmlbox <a href=\"https://tinyurl.com/2fcpre6\">ansena's blog</a>");
	},

	chef: function(arg, by, room)
	{
		this.say(room, "!dt sheer cold");
	},

	platypus: function(arg, by, room)
	{
		this.say(room, "/addhtmlbox <center><img src=\"https://pngimage.net/wp-content/uploads/2018/06/platypus-png.png\" class=\"fa fa-spin\" width=\"100\" height=\"100\"><a style = \"font-size: 20px; \"href = \"https://www.youtube.com/watch?v=VaNbDYGmGwc\">Platypus on the Prowl</a><img src=\"https://pngimage.net/wp-content/uploads/2018/06/platypus-png.png\" class=\"fa fa-spin\" width=\"100\" height=\"100\"><br><br><img src=\"https://cdn.discordapp.com/attachments/394481120806305794/506966120482209792/platyprowl.gif\" height=175 width=170></center>");
	},

	mynameis: function(arg, by, room)
	{
		this.say(room, "CasedVictory");
	},
	epic: function(arg, by, room)
	{
		this.say(room, "gaming");
	},
	nom: function(arg, by, room)
	{
		this.say(room, "Player not recognized. Perhaps you meant **seaco**.");
	},
	ezrael: function(arg, by, room)
	{
		this.say(room, ":teamjon:");
	},
	conics: function(arg, by, room)
	{
		this.say(room, "!dt mudkip");
	},
	diglett: function(arg, by, room)
	{
		let text = "<marquee scrollamount=\"15\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani\/diglett.gif\" class=\"fa fa-spin\" width=\"43\" height=\"35\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1e9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ee.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ec.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f1.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ea.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <\/marquee> <center> <span style=\"font-size: 0.9em;\">Moves Like Diglett | Eye of the Diglett | I\'ll Make a Diglett Out of You<\/span> <\/center> <center> Click the Diglett -&gt; <a href=\"https:\/\/youtu.be\/6Zwu8i4bPV4\"><img src=\"https:\/\/images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com\/intermediary\/f\/578a8319-92b6-4d81-9d5f-d6914e6535a0\/d5o541m-54dae5d4-710c-44d4-a898-71ea71d7bd28.jpg\" width=\"85\" height=\"100\"><\/a> <a href=\"https:\/\/youtu.be\/8LYwT9Nf1Ic\"><img src=\"https:\/\/images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com\/intermediary\/f\/578a8319-92b6-4d81-9d5f-d6914e6535a0\/d5o541m-54dae5d4-710c-44d4-a898-71ea71d7bd28.jpg\" width=\"85\" height=\"100\"><\/a> <a href=\"https:\/\/youtu.be\/uzdvnB8SJV8\"><img src=\"https:\/\/images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com\/intermediary\/f\/578a8319-92b6-4d81-9d5f-d6914e6535a0\/d5o541m-54dae5d4-710c-44d4-a898-71ea71d7bd28.jpg\" width=\"85\" height=\"100\"><\/a> &lt;- Click the Diglett <\/center> <marquee scrollamount=\"15\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1e9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ee.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ec.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f1.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1ea.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/images.emojiterra.com\/twitter\/v11\/512px\/1f1f9.png\" width=\"43\" height=\"35\" class=\"fa fa-spin\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <img src=\"https:\/\/play.pokemonshowdown.com\/sprites\/xyani-back\/diglett.gif\" class=\"fa fa-spin\" width=\"44\" height=\"35\"> <\/marquee>";
		this.say(room, "/addhtmlbox " + text);
	},
	thinking: function(arg, by, room)
	{
		let text = "<img src = \"https://i.imgur.com/vXbla1s.png\" width=\"24\" height=\"27\">";
		this.say(room, "/addhtmlbox " + text);
	},
	delet: function(arg, by, room)
	{
		this.say(room, arg + " **deleted**.");
	},
	b: function(arg, by, room)
	{
		let text = "\ud83c\udd71\ufe0f";
		if (room.charAt(0) != ",")
		{
			text = "/addhtmlbox " + text;
		}
		this.say(room, text);
	},
	dynamax: async function(arg, by, room)
	{
		let pokemonSprite = "http://play.pokemonshowdown.com/sprites/ani/" + arg + ".gif";

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
			pokemonSprite = "http://play.pokemonshowdown.com/sprites/rby/missingno.png";
			height = 96;
			width = 96;
		}

		let text = '<div style = "position: relative"><img src="https://steamuserimages-a.akamaihd.net/ugc/933813375174289297/19F16DBEDED8FF15F8D969EE714BD1319149EB9D/" height='
		+ (height * 5) + ' width=' + (width * 5) + '>' 
		+ '<img src = "' + pokemonSprite + '" height=' + (height * 5) + ' width=' + (width * 5)
		+ ' style = "position: absolute; top: 0%; left: 0%"></div>';

		this.say(room, "/addhtmlbox " + text);
	},
	sample: "samples",
	samples: function(arg, by, room)
	{
		let defaultFormat = "gen8vgc2020";
		let text = "";
		if (room.charAt(0) === "," || by.charAt(0) === " ") //Regular user used command or via PM
		{
			text = "/pm " + by + ", VGC Room Tour Sample Teams: https://pastebin.com/rhFBBMMB";
		}
		else if (tourJSON.hasOwnProperty(arg))
		{
			text = "/addhtmlbox " + this.generateHTMLSample(tourJSON[arg].formatname, tourJSON[arg].formatDescription, tourJSON[arg].sampleTeams, true);
		}
		else if (arg === "")
		{
			text = "/addhtmlbox " + this.generateHTMLSample(tourJSON[defaultFormat].formatname, tourJSON[defaultFormat].formatDescription, tourJSON[defaultFormat].sampleTeams, true);
		}
		else if (arg === "all")
		{
			text = "/addhtmlbox ";
			let keys = Object.keys(tourJSON);
			
			for (key in keys)
			{
				if (tourJSON[keys[key]].formatname)
				{
					text += this.generateHTMLSample(tourJSON[keys[key]].formatname, tourJSON[keys[key]].formatDescription, tourJSON[keys[key]].sampleTeams, false);
				}
			}
		}
		else
		{
			text = "Invalid format specified. Valid formats are: ";
			let validFormats = [];
			let keys = Object.keys(tourJSON);
			for (key in keys)
			{
				if (tourJSON[keys[key]].formatname)
				{
					validFormats.push(keys[key]);
				}
			}
			text += validFormats.join(", ");
		}
		this.say(room, text);
	},
	testpermissions: function(arg, by, room)
	{
		//Normal cases in VGC room
		this.say(room, "Normal cases in VGC");
		this.say(room, "Driver");
		this.say(room, this.canUse("joke", "vgc", "%ansena", "")); //true
		this.say(room, this.canUse("custom", "vgc", "%ansena", "")); //false
		this.say(room, this.canUse("samples", "vgc", "%ansena", "")); //true
		this.say(room, this.canUse("tour", "vgc", "%ansena", "")); //true

		this.say(room, "Voice");
		this.say(room, this.canUse("joke", "vgc", "+ansena", "")); //false
		this.say(room, this.canUse("custom", "vgc", "+ansena", "")); //false
		this.say(room, this.canUse("samples", "vgc", "+ansena", "")); //true
		this.say(room, this.canUse("tour", "vgc", "+ansena", "")); //true

		this.say(room, "Reg");
		this.say(room, this.canUse("joke", "vgc", " ansena", "")); //false
		this.say(room, this.canUse("custom", "vgc", " ansena", "")); //false
		this.say(room, this.canUse("samples", "vgc", " ansena", "")); //true
		this.say(room, this.canUse("tour", "vgc", " ansena", "")); //false

		//Normal cases not in VGC room
		this.say(room, "Normal cases not in VGC");
		this.say(room, "Driver");
		this.say(room, this.canUse("joke", "notvgc", "%ansena", "")); //true
		this.say(room, this.canUse("custom", "notvgc", "%ansena", "")); //false
		this.say(room, this.canUse("samples", "notvgc", "%ansena", "")); //true
		this.say(room, this.canUse("tour", "notvgc", "%ansena", "")); //true

		this.say(room, "Voice");
		this.say(room, this.canUse("joke", "notvgc", "+ansena", "")); //false
		this.say(room, this.canUse("custom", "notvgc", "+ansena", "")); //false
		this.say(room, this.canUse("samples", "notvgc", "+ansena", "")); //true
		this.say(room, this.canUse("tour", "notvgc", "+ansena", "")); //false

		this.say(room, "Reg");
		this.say(room, this.canUse("joke", "notvgc", " ansena", "")); //false
		this.say(room, this.canUse("custom", "notvgc", " ansena", "")); //false
		this.say(room, this.canUse("samples", "notvgc", " ansena", "")); //true
		this.say(room, this.canUse("tour", "notvgc", " ansena", "")); //false

		//Special case tests
		this.say(room, "Special cases");
		this.say(room, this.canUse("blog", "notvgc", "%ansena", "")); //false
		this.say(room, this.canUse("blog", "vgc", "%ansena", "")); //true
		this.say(room, this.canUse("blog", "vgc", "%mish", "")); //false
		this.say(room, this.canUse("blog", "notvgc", "%mish", "")); //false
		this.say(room, this.canUse("tour", "vgc", " legavgc", "vgc13")); //true
		this.say(room, this.canUse("custom", ",notvgc", "+blarajan", "[vgc] hello")); //true
	}
};
