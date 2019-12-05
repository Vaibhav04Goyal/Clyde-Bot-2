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
		if (by.charAt(0) === " ")
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
		if (by.charAt(0) === " ")
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
		let arglist = arg.split(',');

		if (arg === "reset" || arg === "restart")
		{
			hasTourStarted = false;
			this.say(room, "Tournament creation should be working again.");
			this.say(room, "/pm " + by + ", Please let DaWoblefet know tours were broken.");
			console.log("Tour reset was called. Better check it out. " + new Date().toLocaleString());
			return;
		}

		if (arg === "samples")
		{
			let text = "";
			if (by.charAt(0) === " ")
			{
				text = "/pm " + by + ", ";
			}
			text += "VGC Room Tour Sample Teams: https://pastebin.com/rhFBBMMB";
			this.say(room, text);
			return;
		}

		if (!hasTourStarted)
		{
			let tourformat;
			let tourname;
			let tourrules;
			let tournote;
			let formatname;
			let formatDescription;
			let sampleTeams; //2D Array with each array having 6 team members, followed by pokepaste link, followed by description.
			const defaultTour = "ultra";
			
			//Handle default case, double elim, and random format options.
			switch (arglist[0])
			{
				case "": //No argument specified, use default tour.
					arglist[0] = defaultTour;
					if (Math.random() < 0.5)
					{
						tourrules = "-guard split, -minimize";
					}
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
				case "gen8vgc2020":
					tourformat = "gen8vgc2020";
					tourname = "[Gen 8] VGC 2020";
					break;
				case "ultra":
				case "ultra series":
					tourformat = "gen7vgc2019ultraseries";
					tourname = "[Gen 7] VGC 2019 Ultra Series";
					formatname = "VGC 2019 Ultra Series";
					formatDescription = "Ultra Series allows up to two restricted Pokemon, in addition to Mega Evolution, Primal Orbs, and Z-crystals, unlike previous series in VGC 2019.";
					sampleTeams = [
						["groudonprimal", "lunala", "salamencemega", "incineroar", "tapufini", "stakataka", "https://pokepast.es/6ca7e058260024d2", "Penguin2142's 1st Place Worlds Team"],
						["kyogreprimal", "rayquazamega", "gengarmega", "incineroar", "celesteela", "tapukoko", "https://pokepast.es/3c95421eaa24efe4", "Wolfe Glick's 1st Place US Internationals Team"],
						["xerneas", "kyogreprimal", "kartana", "tornadus", "amoonguss", "incineroar", "https://pokepast.es/fe935379b10de53a", "Jamesspeed1's Top 4 Worlds Team"],
						["xerneas", "rayquazamega", "nihilego", "incineroar", "tapufini", "amoonguss", "https://pokepast.es/2e2c22371e2cdcdd", "Pado's 1st Place Europe Internationals Team"],
						["xerneas", "groudonprimal", "kangaskhanmega", "mawilemega", "tornadus", "kommoo", "https://pokepast.es/245146eaaf615889", "Animus's Top 8 US Internationals Team"],
						["xerneas", "necrozmaultra", "salamencemega", "salazzle", "tapukoko", "breloom", "https://pokepast.es/c28982cdb66faa17", "MrJellyLegs's Top 16 Worlds Team"],
						["rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "https://trainertower.com/vgc19-ultra-series-sample-teams/", "More Ultra Series Samples"]
					];
					break;
				case "moon":
				case "moon series":
					tourformat = "gen7vgc2019ultraseries";
					formatname = "VGC 2019 Moon Series";
					tourname = "[Gen 7] VGC 2019 Moon Series";
					tourrules = "-red orb, -blue orb, -dragon ascent, -ultranecroziumz, -Abomasite, -Absolite, -Aerodactylite, -Aggronite, -Alakazite, -Altarianite, -Ampharosite, -Audinite, -Banettite, -Beedrillite, -Blastoisinite, -Blazikenite, -Cameruptite, -Charizardite X, -Charizardite Y, -Crucibellite, -Diancite, -Galladite, -Garchompite, -Gardevoirite, -Gengarite, -Glalitite, -Gyaradosite, -Heracronite, -Houndoominite, -Kangaskhanite, -Latiasite, -Latiosite, -Lopunnite, -Lucarionite, -Manectite, -Mawilite, -Medichamite, -Metagrossite, -Mewtwonite X, -Mewtwonite Y, -Pidgeotite, -Pinsirite, -Sablenite, -Salamencite, -Sceptilite, -Scizorite, -Sharpedonite, -Slowbronite, -Steelixite, -Swampertite, -Tyranitarite, -Venusaurite";
					formatDescription = "Moon Series allowed up to two restricted legendary Pokemon, and unlike Sun Series, Z-moves are allowed. However, Mega Evolutions, Primal Orbs, and Ultra Necrozma are all banned.";
					sampleTeams = [
						["xerneas", "lunala", "smeargle", "incineroar", "stakataka", "tsareena", "https://pokepast.es/dcd39a7c47343e97", "EmbC's 1st Place Australia Internationals Team"],
						["xerneas", "groudon", "incineroar", "tapukoko", "amoonguss", "volcarona", "https://pokepast.es/219d14b47c930571", "Spurrific's Top 4 Australia Internationals Team"],
						["lunala", "groudon", "incineroar", "tapufini", "stakataka", "tsareena", "https://pokepast.es/e5fe7bd11d94cffd", "Lexicon's 2nd Place Regionals Team"],
						["kyogre", "hooh", "ludicolo", "raichu", "incineroar", "ferrothorn", "https://pokepast.es/e57dd4e6e100974d", "Weeblewobs's 1st Place Regionals Team"],
						["rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "https://trainertower.com/vgc19-moon-series-sample-teams/", "More Moon Series Samples"]
					];
					break;
				case "sun":
				case "sun series":
					tourformat = "gen7vgc2019ultraseries";
					tourname = "[Gen 7] VGC 2019 Sun Series";
					tourrules = "-red orb, -blue orb, -dragon ascent, -BuginiumZ, -DarkiniumZ, -DragoniumZ, -ElectriumZ, -FairiumZ, -FightiniumZ, -FiriumZ, -FlyiniumZ, -GhostiumZ, -GrassiumZ, -GroundiumZ, -IciumZ, -LunaliumZ, -NormaliumZ, -PoisoniumZ, -PsychiumZ, -RockiumZ, -SolganiumZ, -SteeliumZ, -UltranecroziumZ, -WateriumZ, -Abomasite, -Absolite, -Aerodactylite, -Aggronite, -Alakazite, -Altarianite, -Ampharosite, -Audinite, -Banettite, -Beedrillite, -Blastoisinite, -Blazikenite, -Cameruptite, -Charizardite X, -Charizardite Y, -Crucibellite, -Diancite, -Galladite, -Garchompite, -Gardevoirite, -Gengarite, -Glalitite, -Gyaradosite, -Heracronite, -Houndoominite, -Kangaskhanite, -Latiasite, -Latiosite, -Lopunnite, -Lucarionite, -Manectite, -Mawilite, -Medichamite, -Metagrossite, -Mewtwonite X, -Mewtwonite Y, -Pidgeotite, -Pinsirite, -Sablenite, -Salamencite, -Sceptilite, -Scizorite, -Sharpedonite, -Slowbronite, -Steelixite, -Swampertite, -Tyranitarite, -Venusaurite, -oranguru+symbiosis, -passimian+defiant, -custap berry, -micle berry, -jaboca berry, -rowap berry";
					//tourrules = "-oranguru+symbiosis, -passimian+defiant, -custap berry, -micle berry, -jaboca berry, -rowap berry";
					formatname = "VGC 2019 Sun Series";
					formatDescription = "The first third of VGC 2019 was Sun Series. Like all three formats in VGC 2019, you can use up to two restricted legendary Pokemon per team (e.g. Kyogre, Xerneas, Lunala, etc.). However, all Z-moves, Mega Evolutions, and the Primal Orbs are banned.";
					sampleTeams = [
						["xerneas", "lunala", "smeargle", "incineroar", "toxicroak", "crobat", "https://pokepast.es/2df03edea0be2ce3", "linkyoshimario's 1st Place Latam Internationals Team"],
						["xerneas", "kyogre", "incineroar", "amoonguss", "kartana", "tornadus", "https://pokepast.es/d51d9f1f9aeb7cd9", "GENGARboi's 1st Place Regionals Team"],
						["kyogre", "yveltal", "incineroar", "toxicroak", "stakataka", "tapulele", "https://pokepast.es/f1920b826ec13ed8", "Spurrific's 1st Place Regionals Team"],
						["xerneas", "groudon", "incineroar", "venusaur", "kartana", "heatran", "https://pokepast.es/e490e7d567ecfc72", "Angel Miranda's Top 4 Regionals Team"],
						["groudon", "yveltal", "incineroar", "venusaur", "stakataka", "tapukoko", "https://pokepast.es/48ba4f586289ec2b", "HamstermaniaCZ's Top 8 Regionals Team"],
						["rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "rhydon", "https://trainertower.com/vgc19-sun-series-sample-teams/", "More Sun Series Samples"]
					];
					break;
				case "vgc18":
				case "vgc2018":
					tourformat = "gen7vgc2018";
					tourname = "[Gen 7] VGC 2018";
					tourules = "-Custap Berry, -Micle Berry, -Jaboca Berry, -Rowap Berry, -Passimian+Defiant, -Oranguru+Symbiosis";
					formatname = "VGC 2018";
					formatDescription = "VGC 2018 was the National Pokedex format for Generation VII. The \"black clover\" rule ensured players could only use Pokemon obtained in Generation VII, which regrettably banned Unown, because it is obtainable in neither Sun/Moon nor Ultra Sun/Ultra Moon without transferring.";
					sampleTeams = [
						["salamencemega", "tapukoko", "incineroar", "gastrodon", "snorlax", "kartana", "https://pokepast.es/ace78bf31ab5ab8c", "ralfdude90's 1st Place Worlds Team"],
						["metagrossmega", "zapdos", "tapufini", "amoonguss", "landorustherian", "incineroar", "https://pokepast.es/14f9a5ff2d99be8a", "Yuri Boschetto's Top 16 Worlds Team"],
						["kangaskhanmega", "heatran", "cresselia", "tapufini", "kartana", "landorustherian", "https://pokepast.es/e1e8250102b5ad35", "pwny person's Top 4 US Internationals Team"],
						["gengarmega", "kommoo", "tapubulu", "incineroar", "azumarill", "clefairy", "https://pokepast.es/731fdacb52678f83", "Jamesspeed1's 1st Place Regionals Team"],
						["gengarmega", "incineroar", "tapufini", "kartana", "landorustherian", "tyranitar", "https://pokepast.es/cbe0f7dad64383ec", "Animus's Top 16 US Internationals Team"],
						["charizardmegay", "landorustherian", "tapufini", "cresselia", "snorlax", "nihilego", "https://pokepast.es/3ab85ee4c78d34f9", "DaWoblefet's Top 16 US Internationals Team"]
					];
					break;
				case "vgc17":
				case "vgc2017":
					tourformat = "gen7vgc2017";
					tourname = "[Gen 7] VGC 2017";
					tourrules = "-Incineroar+Intimidate, -Torracat+Intimidate, -Litten+Intimidate, -Decidueye+Long Reach, -Dartrix+Long Reach, -Rowlet+Long Reach, -Primarina+Liquid Voice, -Brionne+Liquid Voice, -Popplio+Liquid Voice, -Custap Berry, -Micle Berry, -Jaboca Berry, -Rowap Berry, -Passimian+Defiant, -Oranguru+Symbiosis";
					formatname = "VGC 2017";
					formatDescription = "VGC 2017 was played on Pokemon Sun and Moon, and like VGC 2011 and VGC 2014 before it, it was the Regional Pokedex format of the generation. All USUM move tutor moves and other unreleased Abilities (e.g. Intimidate Incineroar) were disallowed. The new \"black clover\" replaced the old blue pentagon, forcing players to only use Pokemon obtained in Pokemon Sun and Moon for VGC 2017.";
					sampleTeams = [
						["krookodile", "tapufini", "whimsicott", "marowakalola", "celesteela", "tapukoko", "https://pokepast.es/900155cf35b48481", "barudoru's 1st Place Worlds Team"],
						["garchomp", "mandibuzz", "tapulele", "xurkitree", "ninetalesalola", "arcanine", "https://pokepast.es/01839147b3ed34b8", "Zelda's 2nd Place Worlds Team"],
						["drifblim", "tapulele", "pheromosa", "garchomp", "gyarados", "magnezone", "https://pokepast.es/14c422f6a2a9599c", "SHADEviera's 1st Place ONOG Invitational Team"],
						["eevee", "smeargle", "clefairy", "whimsicott", "krookodile", "espeon", "https://pokepast.es/7ffe3560138f54a9", "Serapis's 1st Place Regionals Team"],
						["tapufini", "arcanine", "kartana", "tapukoko", "porygon2", "gigalith", "https://pokepast.es/2dc8dba415903a68", "Generic FAKEPG"],
						["ninetalesalola", "garchomp", "arcanine", "celesteela", "tapukoko", "snorlax", "https://pokepast.es/6d2693d41b12e86f", "Generic Ninetales GACT"]
					];
					break;
				case "vgc16":
				case "vgc2016":
					tourformat = "gen6vgc2016";
					tourname = "[Gen 6] VGC 2016";
					formatname = "VGC 2016";
					formatDescription = "VGC 2016 was played in ORAS and allowed up to 2 restricted legendary Pokemon on a team, opening up the door to Primal Groudon, Primal Kyogre, Mega Rayquaza, Xerneas, and more.";
					sampleTeams = [
						["kyogreprimal", "rayquazamega", "gengarmega", "hitmontop", "raichu", "bronzong", "https://pokepast.es/a5ae2ef12c116c9c", "Wolfey's 1st Place Worlds Team"],
						["groudonprimal", "xerneas", "kangaskhanmega", "thundurus", "bronzong", "hitmontop", "https://pokepast.es/fce8508852da17cb", "EmbC's Top 4 Worlds Team"],
						["groudonprimal", "xerneas", "salamencemega", "cresselia", "smeargle", "bronzong", "https://pokepast.es/601c5dc420a40b93", "Unreality's Top 8 Worlds Team"],
						["groudonprimal", "kyogreprimal", "kangaskhanmega", "salamencemega", "thundurus", "bronzong", "https://pokepast.es/e8137755ddfc4151", "Generic Dual Primals"],
						["groudonprimal", "xerneas", "kangaskhanmega", "salamencemega", "smeargle", "talonflame", "https://pokepast.es/d64710292f98a6d6", "Generic Big 6"]
						//Ezrael Worlds: https://pokepast.es/8fe6e9dce1c6f675
					];
					break;
				case "vgc15":
				case "vgc2015":
					tourformat = "gen6battlespotdoubles";
					tourname = "[Gen 6] VGC 2015";
					formatname = "VGC 2015";
					formatDescription = "VGC 2015 was Generation VI's National Pokedex format, played on ORAS. Like in 2014, the new blue pentagon rule only allowed Pokemon that were caught in Generation VI to be used. Create teams for VGC 2015 by selecting \"[Gen 6] Battle Spot Doubles\" in the teambuilder.";
					sampleTeams = [
						["kangaskhanmega", "cresselia", "heatran", "amoonguss", "landorustherian", "thundurus", "https://pokepast.es/ca89718c1c6e9077", "SHADEviera's 1st Place Worlds Team"],
						["gardevoirmega", "amoonguss", "thundurus", "landorustherian", "heatran", "tyranitar", "https://pokepast.es/7c3400921e6e41fa", "Scar's Top 8 Worlds Team"],
						["metagrossmega", "hydreigon", "thundurus", "landorustherian", "jellicent", "terrakion", "https://pokepast.es/33a335a3f3e37e05", "Braverius's 2nd Place Regionals Team"],
						["charizardmegay", "conkeldurr", "sylveon", "thundurus", "aegislash", "landorustherian", "https://pokepast.es/ccc18f1fa23e7dab", "Bopper's Top 4 US Nationals Team"],
						["gengarmega", "scrafty", "gothitelle", "dewgong", "clefairy", "arcanine", "https://pokepast.es/faea84a50bd5a971", "Dr. J's 1st Battle Spot Ladder Team"]
					];
					break;
				case "vgc14.5":
				case "vgc2014.5":
					tourformat = "gen6battlespotdoubles";
					tourname = "[Gen 6] VGC 2014.5";
					tourrules = "-rattata, -raticate, -clefairy, -clefable, -vulpix, -ninetales, -paras, -parasect, -venonat, -venomoth, -meowth, -persian, -mankey, -primeape, -growlithe, -arcanine, -ponyta, -rapidash, -seel, -dewgong, -grimer, -muk, -drowzee, -hypno, -krabby, -kingler, -hitmonlee, -hitmonchan, -koffing, -weezing, -chansey, -tangela, -electabuzz, -magmar, -porygon, -omanyte, -omastar, -kabuto, -kabutops, -chikorita, -bayleef, -meganium, -cyndaquil, -quilava, -typhlosion, -totodile, -croconaw, -feraligatr, -cleffa, -togepi, -togetic, -natu, -xatu, -aipom, -sunkern, -sunflora, -misdreavus, -unown, -girafarig, -pineco, -forretress, -phanpy, -donphan, -porygon2, -stantler, -tyrogue, -hitmontop, -elekid, -magby, -miltank, -blissey, -raikou, -entei, -suicune, -treecko, -grovyle, -sceptile, -torchic, -combusken, -blaziken, -blazikenmega, -mudkip, -marshtomp, -swampert, -wurmple, -silcoon, -beautifly, -cascoon, -dustox, -seedot, -nuzleaf, -shiftry, -shroomish, -breloom, -slakoth, -vigoroth, -slaking, -volbeat, -illumise, -carvanha, -sharpedo, -numel, -camerupt, -cacnea, -cacturne, -baltoy, -claydol, -lileep, -cradily, -anorith, -armaldo, -feebas, -milotic, -castform, -duskull, -dusclops, -tropius, -snorunt, -glalie, -spheal, -sealeo, -walrein, -beldum, -metang, -metagross, -regirock, -regice, -registeel, -latias, -latios, -turtwig, -grotle, -torterra, -chimchar, -monferno, -infernape, -piplup, -prinplup, -empoleon, -kricketot, -kricketune, -shinx, -luxio, -luxray, -cranidos, -rampardos, -shieldon, -bastiodon, -cherubi, -cherrim, -shellos, -gastrodon, -ambipom, -buneary, -lopunny, -mismagius, -glameow, -purugly, -stunky, -skuntank, -bronzor, -bronzong, -happiny, -spiritomb, -finneon, -lumineon, -tangrowth, -electivire, -magmortar, -togekiss, -porygonz, -dusknoir, -froslass, -uxie, -mesprit, -azelf, -heatran, -regigigas, -cresselia, -snivy, -servine, -serperior, -tepig, -pignite, -emboar, -oshawott, -dewott, -samurott, -lillipup, -herdier, -stoutland, -munna, -musharna, -pidove, -tranquill, -unfezant, -blitzle, -zebstrika, -drilbur, -excadrill, -tympole, -palpitoad, -seismitoad, -sewaddle, -swadloon, -leavanny, -cottonee, -whimsicott, -petilil, -lilligant, -darumaka, -darmanitan, -maractus, -yamask, -cofagrigus, -tirtouga, -carracosta, -archen, -archeops, -minccino, -cinccino, -deerling, -sawsbuck, -frillish, -jellicent, -joltik, -galvantula, -klink, -klang, -klinklang, -tynamo, -eelektrik, -eelektross, -elgyem, -beheeyem, -bouffalant, -rufflet, -braviary, -vullaby, -mandibuzz, -larvesta, -volcarona, -cobalion, -terrakion, -virizion, -tornadus, -thundurus, -landorus, -gengar+sludgewave, -raichu+endeavor, -zapdos+static, -articuno+snowcloak, -moltres+flamebody, -Beedrillite, -Audinite, -Pidgeotite, -Steelixite, -Galladite, -Slowbronite, -Sablenite, -Sharpedonite, -Salamencite";
					formatname = "VGC 2014.5";
					formatDescription = "Like VGC 2014, you are only allowed to use Pokemon from the Kalos Pokedex. Unlike VGC 14, VGC 14.5 allows ORAS tutor moves (e.g. Hyper Voice Sylveon). This was played in late 2014 at Premier Challenges. Create teams for VGC 2014.5 by selecting \"[Gen 6] Battle Spot Doubles\" in the teambuilder.";
					sampleTeams = [
						["charizardmegay", "mawilemega", "sylveon", "conkeldurr", "tyranitar", "zapdos", "https://pokepast.es/15301a4155f436a0", "Darkeness's PC Multi-1st Place Team"],
						["kangaskhanmega", "garchomp", "sylveon", "gengar", "rotomheat", "salamence", "https://pokepast.es/84988d24b45184f7", "13Yoshi37's Arena Cup Bremen 1st Place Team"],
					];
					break;
				case "vgc14":
				case "vgc2014":
					tourformat = "gen6battlespotdoubles";
					tourname = "[Gen 6] VGC 2014";
					formatname = "VGC 2014";
					tourrules = "-rattata, -raticate, -clefairy, -clefable, -vulpix, -ninetales, -paras, -parasect, -venonat, -venomoth, -meowth, -persian, -mankey, -primeape, -growlithe, -arcanine, -ponyta, -rapidash, -seel, -dewgong, -grimer, -muk, -drowzee, -hypno, -krabby, -kingler, -hitmonlee, -hitmonchan, -koffing, -weezing, -chansey, -tangela, -electabuzz, -magmar, -porygon, -omanyte, -omastar, -kabuto, -kabutops, -chikorita, -bayleef, -meganium, -cyndaquil, -quilava, -typhlosion, -totodile, -croconaw, -feraligatr, -cleffa, -togepi, -togetic, -natu, -xatu, -aipom, -sunkern, -sunflora, -misdreavus, -unown, -girafarig, -pineco, -forretress, -phanpy, -donphan, -porygon2, -stantler, -tyrogue, -hitmontop, -elekid, -magby, -miltank, -blissey, -raikou, -entei, -suicune, -treecko, -grovyle, -sceptile, -torchic, -combusken, -blaziken, -blazikenmega, -mudkip, -marshtomp, -swampert, -wurmple, -silcoon, -beautifly, -cascoon, -dustox, -seedot, -nuzleaf, -shiftry, -shroomish, -breloom, -slakoth, -vigoroth, -slaking, -volbeat, -illumise, -carvanha, -sharpedo, -numel, -camerupt, -cacnea, -cacturne, -baltoy, -claydol, -lileep, -cradily, -anorith, -armaldo, -feebas, -milotic, -castform, -duskull, -dusclops, -tropius, -snorunt, -glalie, -spheal, -sealeo, -walrein, -beldum, -metang, -metagross, -regirock, -regice, -registeel, -latias, -latios, -turtwig, -grotle, -torterra, -chimchar, -monferno, -infernape, -piplup, -prinplup, -empoleon, -kricketot, -kricketune, -shinx, -luxio, -luxray, -cranidos, -rampardos, -shieldon, -bastiodon, -cherubi, -cherrim, -shellos, -gastrodon, -ambipom, -buneary, -lopunny, -mismagius, -glameow, -purugly, -stunky, -skuntank, -bronzor, -bronzong, -happiny, -spiritomb, -finneon, -lumineon, -tangrowth, -electivire, -magmortar, -togekiss, -porygonz, -dusknoir, -froslass, -uxie, -mesprit, -azelf, -heatran, -regigigas, -cresselia, -snivy, -servine, -serperior, -tepig, -pignite, -emboar, -oshawott, -dewott, -samurott, -lillipup, -herdier, -stoutland, -munna, -musharna, -pidove, -tranquill, -unfezant, -blitzle, -zebstrika, -drilbur, -excadrill, -tympole, -palpitoad, -seismitoad, -sewaddle, -swadloon, -leavanny, -cottonee, -whimsicott, -petilil, -lilligant, -darumaka, -darmanitan, -maractus, -yamask, -cofagrigus, -tirtouga, -carracosta, -archen, -archeops, -minccino, -cinccino, -deerling, -sawsbuck, -frillish, -jellicent, -joltik, -galvantula, -klink, -klang, -klinklang, -tynamo, -eelektrik, -eelektross, -elgyem, -beheeyem, -bouffalant, -rufflet, -braviary, -vullaby, -mandibuzz, -larvesta, -volcarona, -cobalion, -terrakion, -virizion, -tornadus, -thundurus, -landorus, -Beedrillite, -Audinite, -Pidgeotite, -Steelixite, -Galladite, -Slowbronite, -Sablenite, -Sharpedonite, -Salamencite, -gengar+sludgewave, -raichu+endeavor, -zapdos+static, -articuno+snowcloak, -moltres+flamebody, -dragalge+adaptability, -tyrantrum+rockhead, -aurorus+snowwarning, -accelgor+bugbite, -carnivine+bugbite, -gliscor+bugbite, -aggron+dragonpulse, -flygon+dragonpulse, -garchomp+dragonpulse, -gyarados+dragonpulse, -heliolisk+dragonpulse, -krookodile+dragonpulse, -lucario+dragonpulse, -nidoking+dragonpulse, -nidoqueen+dragonpulse, -rhyperior+dragonpulse, -scrafty+dragonpulse, -steelix+dragonpulse, -tyranitar+dragonpulse, -tyrantrum+dragonpulse, -alakazam+drainpunch, -aromatisse+drainpunch, -bellossom+drainpunch, -chesnaught+drainpunch, -gallade+drainpunch, -garbodor+drainpunch, -gengar+drainpunch, -golurk+drainpunch, -grumpig+drainpunch, -jynx+drainpunch, -lucario+drainpunch, -ludicolo+drainpunch, -mr.mime+drainpunch, -pangoro+drainpunch, -reuniclus+drainpunch, -slowbro+drainpunch, -slowking+drainpunch, -slurpuff+drainpunch, -trevenant+drainpunch, -vileplume+drainpunch, -wigglytuff+drainpunch, -beedrill+drillrun, -nidoking+drillrun, -nidoqueen+drillrun, -seaking+drillrun, -aggron+earthpower, -aurorus+earthpower, -barbaracle+earthpower, -diggersby+earthpower, -dugtrio+earthpower, -garchomp+earthpower, -gigalith+earthpower, -gliscor+earthpower, -golem+earthpower, -golurk+earthpower, -hippowdon+earthpower, -krookodile+earthpower, -mamoswine+earthpower, -marowak+earthpower, -quagsire+earthpower, -rhyperior+earthpower, -sandslash+earthpower, -steelix+earthpower, -sudowoodo+earthpower, -tyranitar+earthpower, -tyrantrum+earthpower, -wormadam+earthpower, -beedrill+electroweb, -butterfree+electroweb, -magnezone+electroweb, -rotom+electroweb, -stunfisk+electroweb, -aggron+firepunch, -charizard+firepunch, -conkeldurr+firepunch, -delphox+firepunch, -diggersby+firepunch, -exploud+firepunch, -flygon+firepunch, -furret+firepunch, -gallade+firepunch, -gardevoir+firepunch, -golem+firepunch, -golurk+firepunch, -goodra+firepunch, -granbull+firepunch, -hariyama+firepunch, -heliolisk+firepunch, -lickilicky+firepunch, -ludicolo+firepunch, -marowak+firepunch, -mr.mime+firepunch, -nidoking+firepunch, -nidoqueen+firepunch, -pangoro+firepunch, -probopass+firepunch, -reuniclus+firepunch, -rhyperior+firepunch, -snorlax+firepunch, -sudowoodo+firepunch, -swalot+firepunch, -tyranitar+firepunch, -ursaring+firepunch, -watchog+firepunch, -wigglytuff+firepunch, -alakazam+foulplay, -amoonguss+foulplay, -ariados+foulplay, -banette+foulplay, -bisharp+foulplay, -delphox+foulplay, -diggersby+foulplay, -electrode+foulplay, -gengar+foulplay, -gothitelle+foulplay, -gourgeist+foulplay, -mightyena+foulplay, -mr.mime+foulplay, -scrafty+foulplay, -slowbro+foulplay, -slowking+foulplay, -sudowoodo+foulplay, -toxicroak+foulplay, -trevenant+foulplay, -tyranitar+foulplay, -umbreon+foulplay, -weavile+foulplay, -abomasnow+gigadrain, -ariados+gigadrain, -beedrill+gigadrain, -bellossom+gigadrain, -butterfree+gigadrain, -chesnaught+gigadrain, -escavalier+gigadrain, -ferrothorn+gigadrain, -florges+gigadrain, -flygon+gigadrain, -garbodor+gigadrain, -gengar+gigadrain, -gogoat+gigadrain, -gourgeist+gigadrain, -heatmor+gigadrain, -illumise+gigadrain, -ledian+gigadrain, -masquerain+gigadrain, -mothim+gigadrain, -ninjask+gigadrain, -seviper+gigadrain, -shedinja+gigadrain, -simisage+gigadrain, -swalot+gigadrain, -swoobat+gigadrain, -tentacruel+gigadrain, -trevenant+gigadrain, -vivillon+gigadrain, -volbeat+gigadrain, -wormadamplant+gigadrain, -yanmega+gigadrain, -zangoose+gigadrain, -delibird+gunkshot, -dragalge+gunkshot, -druddigon+gunkshot, -greninja+gunkshot, -liepard+gunkshot, -linoone+gunkshot, -mantine+gunkshot, -pachirisu+gunkshot, -pangoro+gunkshot, -pelipper+gunkshot, -simipour+gunkshot, -simisage+gunkshot, -simisear+gunkshot, -snorlax+gunkshot, -toxicroak+gunkshot, -ursaring+gunkshot, -watchog+gunkshot, -altaria+heatwave, -crobat+heatwave, -dragonite+heatwave, -fearow+heatwave, -flareon+heatwave, -flygon+heatwave, -honchkrow+heatwave, -houndoom+heatwave, -hydreigon+heatwave, -noctowl+heatwave, -noivern+heatwave, -pidgeot+heatwave, -pyroar+heatwave, -salamence+heatwave, -staraptor+heatwave, -swellow+heatwave, -swoobat+heatwave, -talonflame+heatwave, -aromatisse+helpinghand, -chesnaught+helpinghand, -chimecho+helpinghand, -conkeldurr+helpinghand, -florges+helpinghand, -gardevoir+helpinghand, -gothitelle+helpinghand, -jynx+helpinghand, -lucario+helpinghand, -machamp+helpinghand, -mantine+helpinghand, -medicham+helpinghand, -mienshao+helpinghand, -mr.mime+helpinghand, -pangoro+helpinghand, -politoed+helpinghand, -poliwrath+helpinghand, -pyroar+helpinghand, -raichu+helpinghand, -simipour+helpinghand, -simisage+helpinghand, -simisear+helpinghand, -slurpuff+helpinghand, -sudowoodo+helpinghand, -toxicroak+helpinghand, -watchog+helpinghand, -wigglytuff+helpinghand, -audino+hypervoice, -aurorus+hypervoice, -azumarill+hypervoice, -chimecho+hypervoice, -delcatty+hypervoice, -espeon+hypervoice, -flareon+hypervoice, -furfrou+hypervoice, -gallade+hypervoice, -gardevoir+hypervoice, -glaceon+hypervoice, -granbull+hypervoice, -heliolisk+hypervoice, -houndoom+hypervoice, -jolteon+hypervoice, -jynx+hypervoice, -lapras+hypervoice, -leafeon+hypervoice, -liepard+hypervoice, -linoone+hypervoice, -ludicolo+hypervoice, -mightyena+hypervoice, -noctowl+hypervoice, -noivern+hypervoice, -pangoro+hypervoice, -salamence+hypervoice, -snorlax+hypervoice, -sylveon+hypervoice, -tyrantrum+hypervoice, -umbreon+hypervoice, -ursaring+hypervoice, -vaporeon+hypervoice, -wailord+hypervoice, -zoroark+hypervoice, -aggron+icepunch, - audino+icepunch, -azumarill+icepunch, -blastoise+icepunch, -conkeldurr+icepunch, -diggersby+icepunch, -dragonite+icepunch, -exploud+icepunch, -floatzel+icepunch, -furret+icepunch, -gallade+icepunch, -gardevoir+icepunch, -golduck+icepunch, -golurk+icepunch, -granbull+icepunch, -greninja+icepunch, -hariyama+icepunch,-illumise+icepunch, -kangaskhan+icepunch, -kecleon+icepunch, -ledian+icepunch, -lickilicky+icepunch, -lucario+icepunch, -ludicolo+icepunch, -mawile+icepunch, -miltank+icepunch, -mr.mime+icepunch, -nidoking+icepunch, -nidoqueen+icepunch, -pangoro+icepunch, -politoed+icepunch, -poliwrath+icepunch, -probopass+icepunch, -quagsire+icepunch, -reuniclus+icepunch, - rhyperior+icepunch, -sableye+icepunch, -sawk+icepunch, -simipour+icepunch, -slowbro+icepunch, -slowking+icepunch, -snorlax+icepunch, -sudowoodo+icepunch, -swalot+icepunch, -throh+icepunch, -toxicroak+icepunch, -ursaring+icepunch, -volbeat+icepunch, -watchog+icepunch, -wigglytuff+icepunch, -zangoose+icepunch, -aggron+icywind, -azumarill+icywind, -banette+icywind, -barbaracle+icywind, -bibarel+icywind, -blastoise+icywind, -chimecho+icywind, -clawitzer+icywind, -cloyster+icywind, -crawdaunt+icywind, -delcatty+icywind, -dragalge+icywind, -dragonite+icywind, -drifblim+icywind, -exploud+icywind, -floatzel+icywind, -gardevoir+icywind, -gengar+icywind, -golduck+icywind, -golurk+icywind, -gorebyss+icywind, -greninja+icywind, -grumpig+icywind, -gyarados+icywind, -honchkrow+icywind, -huntail+icywind, -jynx+icywind, -kingdra+icywind, -lanturn+icywind, -lickilicky+icywind, -linoone+icywind, -ludicolo+icywind, -mantine+icywind, -marowak+icywind, -masquerain+icywind, -nidoking+icywind, -nidoqueen+icywind, -octillery+icywind, -pelipper+icywind, -politoed+icywind, -poliwrath+icywind, -quagsire+icywind, -rhyperior+icywind, -seaking+icywind, -sharpedo+icywind, -simipour+icywind, -slowbro+icywind, -slowking+icywind, -snorlax+icywind, -starmie+icywind, -swanna+icywind, -tentacruel+icywind, -toxicroak+icywind, -vaporeon+icywind, -wailord+icywind, -whiscash+icywind, -wigglytuff+icywind, -aurorus+ironhead, -avalugg+ironhead, -chesnaught+ironhead, -diggersby+ironhead, -dragonite+ironhead, -druddigon+ironhead, -gigalith+ironhead, -golem+ironhead, -gyarados+ironhead, -hariyama+ironhead, -hawlucha+ironhead, -hippowdon+ironhead, -kingdra+ironhead, -lapras+ironhead, -lunatone+ironhead, -magnezone+ironhead, -mamoswine+ironhead, -mantine+ironhead, -miltank+ironhead, -pangoro+ironhead, -probopass+ironhead, -rhyperior+ironhead, -scrafty+ironhead, -skarmory+ironhead, -snorlax+ironhead, -solrock+ironhead, -steelix+ironhead, -tauros+ironhead, -tyrantrum+ironhead, -wailord+ironhead, -accelgor+knockoff, -azumarill+knockoff, -beedrill+knockoff, -bisharp+knockoff, -carnivine+knockoff, -chimecho+knockoff, -conkeldurr+knockoff, -crustle+knockoff, -diggersby+knockoff, -dodrio+knockoff, -drapion+knockoff, -drifblim+knockoff, -ferrothorn+knockoff, -furret+knockoff, -gallade+knockoff, -gengar+knockoff, -krookodile+knockoff, -leafeon+knockoff, -liepard+knockoff, -malamar+knockoff, -mamoswine+knockoff, -marowak+knockoff, -pangoro+knockoff, -raichu+knockoff, -reuniclus+knockoff, -sandslash+knockoff, -scizor+knockoff, -scrafty+knockoff, -seaking+knockoff, -simipour+knockoff, -simisage+knockoff, -simisear+knockoff, -tentacruel+knockoff, -toxicroak+knockoff, -venusaur+knockoff, -watchog+knockoff, -weavile+knockoff, -wigglytuff+knockoff, -zoroark+knockoff, -aggron+lowkick, -barbaracle+lowkick, -beartic+lowkick, -bisharp+lowkick, -chesnaught+lowkick, -delphox+lowkick, -diggersby+lowkick, -exeggutor+lowkick, -exploud+lowkick, -floatzel+lowkick, -gallade+lowkick, -golduck+lowkick, -golurk+lowkick, -granbull+lowkick, -greninja+lowkick, -hariyama+lowkick, -haxorus+lowkick, -heliolisk+lowkick, -krookodile+lowkick, -marowak+lowkick, -medicham+lowkick, -pangoro+lowkick, -toxicroak+lowkick, -tyranitar+lowkick, -ursaring+lowkick, -weavile+lowkick, -zoroark+lowkick, -banette+skillswap, -butterfree+skillswap, -delphox+skillswap, -drifblim+skillswap, -espeon+skillswap, -gengar+skillswap, -gothitelle+skillswap, -gourgeist+skillswap, -grumpig+skillswap, -jynx+skillswap, -mothim+skillswap, -mrmime+skillswap, -slowbro+skillswap, -slowking+skillswap, -swoobat+skillswap, -trevenant+skillswap, -absol+superpower, -avalugg+superpower, -barbaracle+superpower, -basculin+superpower, -chesnaught+superpower, -diggersby+superpower, -dragonite+superpower, -durant+superpower, -flareon+superpower, -gigalith+superpower, -gogoat+superpower, -golduck+superpower, -golem+superpower, -golurk+superpower, -goodra+superpower, -granbull+superpower, -hariyama+superpower, -hawlucha+superpower, -haxorus+superpower, -heatmor+superpower, -hippowdon+superpower, -honchkrow+superpower, -hydreigon+superpower, -krookodile+superpower, -machamp+superpower, -mamoswine+superpower, -nidoking+superpower, -pangoro+superpower, -reuniclus+superpower, -rhyperior+superpower, -sawk+superpower, -scizor+superpower, -scolipede+superpower, -simipour+superpower, -simisear+superpower, -simipour+superpower, -snorlax+superpower, -tyranitar+superpower, -tyrantrum+superpower, -ursaring+superpower, -altaria+tailwind, -beedrill+tailwind, -charizard+tailwind, -chatot+tailwind, -crobat+tailwind, -dragonite+tailwind, -emolga+tailwind, -farfetchd+tailwind, -fearow+tailwind, -flygon+tailwind, -gliscor+tailwind, -hawlucha+tailwind, -honchkrow+tailwind, -hydreigon+tailwind, -illumise+tailwind, -ledian+tailwind, -mantine+tailwind, -masquerain+tailwind, -moltres+tailwind, -mothim+tailwind, -noctowl+tailwind, -salamence+tailwind, -scizor+tailwind, -skarmory+tailwind, -staraptor+tailwind, -swellow+tailwind, -swoobat+tailwind, -vespiquen+tailwind, -vivillon+tailwind, -volbeat+tailwind, -yanmega+tailwind, -zapdos+tailwind, -aggron+thunderpunch, -charizard+thunderpunch, -chesnaught+thunderpunch, -conkeldurr+thunderpunch, -delphox+thunderpunch, -diggersby+thunderpunch, -exploud+thunderpunch, -flygon+thunderpunch, -furret+thunderpunch, -gallade+thunderpunch, -gardevoir+thunderpunch, -golem+thunderpunch, -golurk+thunderpunch, -goodra+thunderpunch, -granbull+thunderpunch, -grumpig+thunderpunch, -hariyama+thunderpunch, -heliolisk+thunderpunch, -ledian+thunderpunch, -lickilicky+thunderpunch, -lucario+thunderpunch, -ludicolo+thunderpunch, -marowak+thunderpunch, -mrmime+thunderpunch, -nidoking+thunderpunch, -nidoqueen+thunderpunch, -pangoro+thunderpunch, -probopass+thunderpunch, -reuniclus+thunderpunch, -rhyperior+thunderpunch, -snorlax+thunderpunch, -sudowoodo+thunderpunch, -swalot+thunderpunch, -toxicroak+thunderpunch, -tyranitar+thunderpunch, -ursaring+thunderpunch, -watchog+thunderpunch, -wigglytuff+thunderpunch, -chandelure+trick, -chimecho+trick, -delphox+trick, -drifblim+trick, -espeon+trick, -gallade+trick, -gardevoir+trick, -gothitelle+trick, -jynx+trick, -liepard+trick, -medicham+trick, -meowstic+trick, -meowsticf+trick, -shedinja+trick, -sigilyph+trick, -slowbro+trick, -slowking+trick, -starmie+trick, -swoobat+trick, -trevenant+trick, -zoroark+trick, -alakazam+zenheadbutt, -audino+zenheadbutt, -aurorus+zenheadbutt, -basculin+zenheadbutt, -basculinbluestriped+zenheadbutt, -blastoise+zenheadbutt, -chesnaught+zenheadbutt, -chimecho+zenheadbutt, -delphox+zenheadbutt, -dunsparce+zenheadbutt, -espeon+zenheadbutt, -exeggutor+zenheadbutt, -exploud+zenheadbutt, -furfrou+zenheadbutt, -gallade+zenheadbutt, -gardevoir+zenheadbutt, -gogoat+zenheadbutt, -golurk+zenheadbutt, -gothitelle+zenheadbutt, -hydreigon+zenheadbutt, -jynx+zenheadbutt, -lucario+zenheadbutt, -lunatone+zenheadbutt, -meowstic+zenheadbutt, -meowstic-f+zenheadbutt, -mr.mime+zenheadbutt, -pangoro+zenheadbutt, -reuniclus+zenheadbutt, -sawk+zenheadbutt, -sharpedo+zenheadbutt, -solrock+zenheadbutt, -swoobat+zenheadbutt, -throh+zenheadbutt, -tyrantrum+zenheadbutt, -watchog+zenheadbutt";
					formatDescription = "VGC 2014 only allowed Pokemon from the Kalos Pokedex. Because VGC 2014 was on Pokemon X and Y, all ORAS Mega Evolutions and move tutor moves are banned. Additionally, the new \"blue pentagon\" rule only allowed players to use Pokemon obtained in X and Y. Create teams for VGC 2014 by selecting \"[Gen 6] Battle Spot Doubles\" in the teambuilder.";
					sampleTeams = [
						["gyaradosmega", "pachirisu", "gothitelle", "gardevoir", "garchomp", "talonflame", "https://pokepast.es/35e1f41321d981cd", "Sejun Park's 1st Place Worlds Team"],
						["charizardmegay", "lucariomega", "garchomp", "tyranitar", "salamence", "rotommow", "https://pokepast.es/d24b093c27d47ed5", "SoulSur's 2nd Place Worlds Team"],
						["kangaskhanmega", "mawilemega", "garchomp", "salamence", "rotomheat", "gengar", "https://pokepast.es/407035b849776583", "13Yoshi37's 1st Place German Nationals Team"],
						["kangaskhanmega", "politoed", "ludicolo", "talonflame", "aegislash", "hydreigon", "https://pokepast.es/7d9841644cefc2a5", "Evan Falco's 1st Place US Nationals Team"],
						["mawilemega", "politoed", "ludicolo", "gothitelle", "scrafty", "hydreigon", "https://pokepast.es/2b439540bae471c5", "Wolfey's 9th Place Worlds Team"],
						["tyranitarmega", "raichu", "azumarill", "amoonguss", "aegislash", "talonflame", "https://pokepast.es/986e23007de8f81b", "Baz Anderson's 1st Place NB Invitational Team"],
						["charizardmegay", "sawk", "weavile", "gengar", "aggron", "staraptor", "https://pokepast.es/c8c8278dda9fb868", "linkyoshimario's Top 16 Worlds Team"]
					];
					break;
				case "vgc13":
				case "vgc2013":
					tourformat = "gen5gbudoubles";
					tourname = "[Gen 5] VGC 2013";
					formatname = "VGC 2013";
					formatDescription = "The final year of VGC played in Generation V, VGC 2013 was a National Pokedex format that allowed the Therian formes of the Genies, BW2 move tutors, and all the released Hidden Abilities. Create teams for VGC 2013 by selecting \"[Gen 5] GBU Doubles\" in the teambuilder.";
					sampleTeams = [
						["mamoswine", "tornadus", "latios", "amoonguss", "heatran", "conkeldurr", "https://pokepast.es/adae1559f253e904", "Mean's 1st Place Worlds Team"],
						["cresselia", "rotomwash", "landorustherian", "tyranitar", "conkeldurr", "heatran", "https://pokepast.es/5a030f66117a7096", "Cybertron's Top 4 Worlds Team"],
						["politoed", "kingdra", "hydreigon", "breloom", "scizor", "thundurus", "https://pokepast.es/eb2eb5cc8f0d4543", "Gini Rain, 1st Germany and Italy Nationals"],
						["tyranitar", "gyarados", "amoonguss", "cresselia", "thundurustherian", "excadrill", "https://pokepast.es/27fa3851f0feb27d", "Bopper's 1st Place NB Invitational Team"],
						["liepard", "scizor", "breloom", "cresselia", "terrakion", "thundurus", "https://pokepast.es/ad7be91ffa3f7a04", "Baz Anderson's 9th Place Worlds Team"]
					];
					break;
				case "vgc12":
				case "vgc2012":
					tourformat = "gen5gbudoubles";
					tourname = "[Gen 5] VGC 2012";
					formatname = "VGC 2012";
					tourrules = "-tornadus+defiant, -thundurus+defiant, -landorus+sheerforce, -tornadustherian, -thundurustherian, -landorustherian, -politoed+drizzle+icywind, -politoed+drizzle+helpinghand, -snivy+contrary, -servine+contrary, -serperior+contrary, -tepig+thickfat, -pignite+thickfat, -emboar+reckless, -oshawott+shellarmor, -dewott+shellarmor, -samurott+shellarmor, -patrat+analytic, -watchog+analytic, -lillipup+runaway, -herdier+scrappy, -stoutland+scrappy, -purrloin+prankster, -liepard+prankster, -pansage+overgrow, -simisage+overgrow, -pansear+blaze, -simisear+blaze, -panpour+torrent, -simipour+torrent, -tympole+waterabsorb, -palpitoad+waterabsorb, -seismitoad+waterabsorb, -cottonee+chlorophyll, -whimsicott+chlorophyll, -petilil+leafguard, -lilligant+leafguard, -karrablast+noguard, -escavalier+overcoat, -shelmet+overcoat, -accelgor+unburden, -venipede+quickfeet, -whirlipede+quickfeet, -scolipede+quickfeet, -pidove+rivalry, -tranquill+rivalry, -unfezant+rivalry, -sigilyph+tintedlens, -ducklett+hydration, -swanna+hydration, -emolga+motordrive, -basculin+moldbreaker, -basculinbluestriped+moldbreaker, -alomomola+regenerator, -stunfisk+sandveil, -tirtouga+swiftswim, -carracosta+swiftswim, -elgyem+analytic, -beheeyem+analytic, -pawniard+pressure, -bisharp+pressure, -joltik+swarm, -galvantula+swarm, -solosis+regenerator, -duosion+regenerator, -reuniclus+regenerator, -golett+noguard, -golurk+noguard, -heatmor+whitesmoke, -durant+truant, -maractus+stormdrain, -dwebble+weakarmor, -crustle+weakarmor, -sandile+angerpoint, -krokorok+angerpoint, -krookodile+angerpoint, -drilbur+moldbreaker, -excadrill+moldbreaker, - druddigon+moldbreaker, -vanillite+weakarmor, -vanillish+weakarmor, -vanilluxe+weakarmor, -klang+clearbody, -klinklang+clearbody, -axew+unnerve, -fraxure+unnerve, -haxorus+unnerve, -audino+klutz, -throh+moldbreaker, -sawk+moldbreaker, -scraggy+intimidate, -scrafty+intimidate, -timburr+ironfist, -gurdurr+ironfist, -conkeldurr+ironfist, -beedrill+sniper, -weedle+runaway, -paras+damp, -parasect+damp, -venonat+runaway, -venomoth+wonderskin, -grimer+poisontouch, -muk+poisontouch, -pineco+overcoat, -forretress+overcoat, -wurmple+runaway, -beautifly+rivalry, -dustox+compoundeyes, -seedot+pickpocket, -nuzleaf+pickpocket, -shiftry+pickpocket, -nincada+runaway, -ninjask+infiltrator, -gulpin+gluttony, -swalot+gluttony, -kricketot+runaway, -kricketune+technician, -combee+hustle, -vespiquen+unnerve, -ekans+unnerve, -arbok+unnerve, -aipom+skilllink, -ambipom+skilllink, -shroomish+quickfeet, -breloom+technician, -budew+leafguard, -roselia+leafguard, -roserade+technician, -zangoose+toxicboost, -seviper+infiltrator, -pinsir+moxie, -snorlax+gluttony, -heracross+moxie, -turtwig+shellarmor, -grotle+shellarmor, -torterra+shellarmor, -chimchar+ironfist, -monferno+ironfist, -infernape+ironfist, -piplup+defiant, -prinplup+defiant, -empoleon+defiant, -gothita+shadowtag, -gothorita+shadowtag, -gothitelle+shadowtag, -serperior+dragonpulse, -emboar+firepunch, -emboar+helpinghand, -emboar+heatwave, -emboar+ironhead, -emboar+lowkick, -emboar+superpower, -emboar+thunderpunch, -samurott+helpinghand, -samurott+icywind, -samurott+superpower, -watchog+firepunch, -watchog+helpinghand, -watchog+icepunch, -watchog+lowkick, -watchog+thunderpunch, -watchog+zenheadbutt, -stoutland+ironhead, -stoutland+superpower, -liepard+darkpulse, -liepard+foulplay, -liepard+trick, -simisage+gigadrain, -simisage+helpinghand, -simisage+lowkick, -simisage+superpower, -simisear+firepunch, -simisear+heatwave, -simisear+helpinghand, -simisear+lowkick, -simisear+superpower, -simipour+helpinghand, -simipour+icepunch, -simipour+icywind, -simipour+lowkick, -simipour+superpower, -musharna+helpinghand, -musharna+skillswap, -musharna+trick, -unfezant+heatwave, -gigalith+earthpower, -gigalith+ironhead, -gigalith+superpower, -swoobat+gigadrain, -swoobat+heatwave, -swoobat+helpinghand, -swoobat+roost, -swoobat+skillswap, -swoobat+skyattack, -swoobat+tailwind, -swoobat+trick, -swoobat+zenheadbutt, -excadrill+earthpower, -excadrill+ironhead, -audino+firepunch, -audino+helpinghand, -audino+icepunch, -audino+icywind, -audino+lowkick, -audino+skillswap, -audino+thunderpunch, -audino+zenheadbutt, -conkeldurr+firepunch, -conkeldurr+helpinghand, -conkeldurr+icepunch, -conkeldurr+thunderpunch, -seismitoad+earthpower, -seismitoad+icepunch, -seismitoad+icywind, -seismitoad+lowkick, -throh+firepunch, -throh+helpinghand, -throh+icepunch, -throh+lowkick, -throh+superpower, -throh+thunderpunch, -sawk+firepunch, -sawk+helpinghand, -sawk+icepunch, -sawk+lowkick, -sawk+superpower, -sawk+thunderpunch, -leavanny+gigadrain, -leavanny+helpinghand, -scolipede+superpower, -scolipede+bug bite, -basculin+icywind, -basculin+superpower, -basculin+zenheadbutt, -basculinbluestriped+icywind, -basculinbluestriped+superpower, -basculinbluestriped+zenheadbutt, -krookodile+darkpulse, -krookodile+dragonpulse, -krookodile+earthpower, -krookodile+lowkick, -krookodile+superpower, -darmanitan+firepunch, -darmanitan+heatwave, -darmanitan+superpower, -darmanitan+zenheadbutt, -maractus+helpinghand, -crustle+bugbite, -scrafty+darkpulse, -scrafty+dragonpulse, -scrafty+firepunch, -scrafty+foulplay, -scrafty+icepunch, -scrafty+ironhead, -scrafty+lowkick, -scrafty+thunderpunch, -scrafty+zenheadbutt, -sigilyph+darkpulse, -sigilyph+heatwave, -sigilyph+icywind, -sigilyph+roost, -sigilyph+skillswap, -sigilyph+skyattack, -sigilyph+tailwind, -sigilyph+trick, -sigilyph+zenheadbutt, -cofagrigus+darkpulse, -cofagrigus+skillswap, -cofagrigus+trick, -carracosta+earthpower, -carracosta+icywind, -carracosta+ironhead, -carracosta+lowkick, -carracosta+superpower, -archeops+dragonpulse, -archeops+earthpower, -archeops+heatwave, -archeops+roost, -archeops+skyattack, -archeops+tailwind, -garbodor+darkpulse, -garbodor+gigadrain, -zoroark+darkpulse, -zoroark+foulplay, -zoroark+lowkick, -zoroark+trick, -cinccino+helpinghand, -gothitelle+foulplay, -gothitelle+helpinghand, -gothitelle+skillswap, -gothitelle+trick, -gothitelle+zenheadbutt, -reuniclus+firepunch, -reuniclus+helpinghand, -reuniclus+icepunch, -reuniclus+skillswap, -reuniclus+superpower, -reuniclus+thunderpunch, -reuniclus+trick, -reuniclus+zenheadbutt, -swanna+icywind, -swanna+roost, -swanna+skyattack, -swanna+tailwind, -vanilluxe+icywind, -sawsbuck+gigadrain, -emolga+helpinghand, -emolga+roost, -emolga+tailwind, -amoonguss+foulplay, -jellicent+darkpulse, -jellicent+gigadrain, -jellicent+icywind, -jellicent+trick, -alomomola+helpinghand, -alomomola+icywind, -galvantula+bugbite, -galvantula+gigadrain, -ferrothorn+gigadrain, -eelektross+firepunch, -eelektross+gigadrain, -eelektross+superpower, -eelektross+thunderpunch, -beheeyem+trick, -haxorus+superpower, -haxorus+lowkick, -beartic+lowkick, -accelgor+bugbite, -stunfisk+electroweb, -stunfisk+foulplay, -mienshao+helpinghand, -druddigon+firepunch, -druddigon+heatwave, -druddigon+ironhead, -druddigon+thunderpunch, -golurk+drainpunch, -golurk+firepunch, -golurk+icepunch, -golurk+icywind, -golurk+lowkick, -golurk+superpower, -golurk+thunderpunch, -golurk+zenheadbutt, -bisharp+foulplay, -bisharp+lowkick, -bouffalant+superpower, -bouffalant+zenheadbutt, -braviary+heatwave, -braviary+superpower, -mandibuzz+foulplay, -mandibuzz+heatwave, --heatmor+gigadrain, -durant+endeavor, -durant+superpower, -hydreigon+heatwave, -hydreigon+roost, -hydreigon+superpower, -hydreigon+tailwind, -volcarona+gigadrain, -volcarona+roost, -volcarona+tailwind, -cobalion+zenheadbutt, -terrakion+zenheadbutt, -terrakion+ironhead, -virizion+superpower, -virizion+zenheadbutt, -tornadus+foulplay, -tornadus+heatwave, -tornadus+icywind, -tornadus+superpower, -thundurus+foulplay, -thundurus+superpower, -thundurus+thunderpunch, -landorus+earthpower, -landorus+superpower, -beedrill+drillrun, -dewgong+drillrun, -lapras+drillrun, -nidoking+drillrun, -rapidash+drillrun, -seaking+drillrun, -dunsparce+drillrun, -forretress+drillrun, -hitmontop+drillrun, -claydol+drillrun, -escavalier+drillrun, -alakazam+foulplay, -hypno+foulplay, -electrode+foulplay, -gengar+foulplay, -persian+foulplay, -mr.mime+foulplay, -ninetales+foulplay, -porygon-z+foulplay, -slowbro+foulplay, -slowking+foulplay, -ariados+foulplay, -porygon2+foulplay, -xatu+foulplay, -sudowoodo+foulplay, -ambipom+foulplay, -umbreon+foulplay, -weavile+foulplay, -tyranitar+foulplay, -mightyena+foulplay, -mawile+foulplay, -cacturne+foulplay, -banette+foulplay, -absol+foulplay, -mismagius+foulplay, -purugly+foulplay, -spiritomb+foulplay, -toxicroak+foulplay, -rotom+foulplay, -rotom-wash+foulplay, -rotom-frost+foulplay, -rotom-heat+foulplay, -rotom-cut+foulplay, -rotom-fan+foulplay, -squirtle+followme, -wartortle+followme, -blastoise+followme, -venusaur+weatherball, -sableye+octazooka, -custapberry";
					formatDescription = "VGC 2012 was a National Pokedex format like 2013. It was played on Black and White, since BW2 had not been released yet outside of Japan. Notably, there was no access to Therian formes of the Genies, Hidden Abilities of the Genies, Breloom, Conkeldurr, and many other Unova Pokemon, and no access to BW2 move tutor moves. Create teams for VGC 2012 by selecting \"[Gen 5] GBU Doubles\" in the teambuilder.";
					sampleTeams = [
						["cresselia", "metagross", "hydreigon", "garchomp", "tyranitar", "rotomwash", "https://pokepast.es/7b7face31d5575cf", "Ray Rizzo's 1st Place Worlds Team"],
						["garchomp", "hitmontop", "tyranitar", "thundurus", "scizor", "cresselia", "https://pokepast.es/0379951974375701", "Cybertron's 1st Place Seniors Nationals Team"],
						["cresselia", "thundurus", "latios", "hitmontop", "metagross", "tyranitar", "https://pokepast.es/ebdd1f8bd9d13dd7", "Flash's Top 4 Worlds Team"],
						["politoed", "kingdra", "cresselia", "metagross", "hydreigon", "hitmontop", "https://pokepast.es/69f483f1139856fc", "Skarm's 2nd Place CA Nationals team"],
						["abomasnow", "gyarados", "gastrodoneast", "rotomfrost", "scizor", "rhyperior", "https://pokepast.es/c26e627bbca8f11a", "Huy's 10th Place Worlds Team"]
					];
					break;
				case "vgc11":
				case "vgc2011":
					tourformat = "gen5gbudoubles";
					tourname = "[Gen 5] VGC 2011";
					tourrules = "-beedrill, -dragonair, -gengar, -seviper, -gyarados, -nuzleaf, -lombre, -zubat, -sneasel, -cloyster, -ariados, -grumpig, -swinub, -persian, -treecko, -registeel, -cherrim, -wooper, -azelf, -sandslash, -whismur, -quagsire, -charizard, -starmie, -combee, -swampert, -dugtrio, -quilava, -togepi, -kabuto, -sylveon, -spiritomb, -feraligatr, -nidorina, -shiftry, -wynaut, -nidorino, -roselia, -lileep, -roserade, -yanma, -aipom, -cradily, -gardevoir, -houndoom, -toxicroak, -gliscor, -scizor, -igglybuff, -wailord, -arcanine, -tangrowth, -mismagius, -butterfree, -blastoise, -pidgey, -gible, -unown, -numel, -bibarel, -feebas, -glalie, -lotad, -skarmory, -lunatone, -floatzel, -qwilfish, -rhydon, -raikou, -ambipom, -drowzee, -skorupi, -electivire, -primeape, -bidoof, -crobat, -clefairy,  -relicanth, -hippowdon, -empoleon, -suicune, -lanturn, -lapras, -ninetales, -latias, -whiscash, -combusken, -rattata, -gabite, -claydol, -ampharos, -forretress, -buizel, -cubone, -gastrodon, -metang, -cacnea, -gligar, -plusle, -venusaur, -regirock, -jumpluff, -poliwag, -bellsprout,  -phanpy, -camerupt, -chimchar, -glameow, -smeargle, -masquerain, -gulpin, -golem, -manectric, -happiny, -aron, -meganium, -marill, -solrock, -piplup, -cleffa, -snorlax, -lopunny,  -staryu, -poliwhirl, -clamperl, -cherubi, -stantler, -marshtomp, -pinsir, -mareep, -girafarig, -honchkrow, -raichu, -pichu, -tauros, -noctowl, -torkoal, -breloom, -surskit, -arbok, -ledian, -thundurustherian, -slowking, -munchlax, -lairon, -bayleef, -hypno, -donphan, -slowbro, -bagon, -regigigas, -delibird, -tornadustherian, -abomasnow, -pidgeotto, -granbull, -heracross, -sableye, -mantine, -pupitar, -espeon, -castform, -tropius, -rotomfan, -chikorita, -shellos, -politoed,  -medicham, -misdreavus, -gallade, -venonat, -landorustherian, -metapod, -loudred, -pidgeot,  -gastly, -buneary, -venomoth, -porygon, -croconaw, -baltoy, -golbat, -rotomwash, -beautifly, -delcatty, -sandshrew, -entei, -golduck, -elekid, -hoothoot, -krabby, -chimecho, -wormadam, -flaaffy, -exploud, -slugma, -meditite, -seadra, -chingling, -exeggcute, -staravia, -swablu, -kingdra, -machoke, -heatran, -natu, -charmeleon, -eevee, -skiploom, -koffing, -luxray, -magikarp, -milotic, -clawitzer, -probopass, -hoppip, -mothim, -jynx, -ludicolo, -barboach, -houndour, -mimejr, -rotom, -huntail, -graveler, -kadabra, -grotle, -flareon, -spearow, -wailmer, -sudowoodo, -zigzagoon, -latios, -rampardos, -articuno, -vileplume, -rhyhorn, -chansey, -mesprit, -metagross, -wartortle, -oddish, -dusclops, -dragonite, -shinx, -cyndaquil, -vespiquen, -sentret, -lumineon, -banette, -blaziken, -doduo, -altaria, -moltres, -beldum, -alakazam, -sunkern, -drifloon, -sharpedo, -meowth, -bronzong, -cacturne, -poliwrath, -haunter, -absol,  -luvdisc, -ursaring, -dhelmise, -miltank, -froslass, -rotomheat, -omastar, -marowak, -clefable, -typhlosion, -murkrow, -pelipper, -victreebel, -vigoroth, -grubbin, -trapinch, -furret, -carvanha, -voltorb, -swirlix, -wormadamtrash, -wurmple, -croagunk, -electabuzz, -magmar, -pachirisu, -tentacool, -caterpie, -dewgong, -hariyama, -pikachu, -wingull, -pineco, -heliolisk, -mawile, -fearow, -hippopotas, -kecleon, -geodude, -shuppet, -teddiursa, -drifblim, -aerodactyl, -hitmonchan, -garchomp, -dratini, -corphish, -skitty, -crawdaunt, -poipole, -piloswine, -octillery, -ralts, -seaking, -mudkip, -wobbuffet, -monferno, -regice, -slakoth, -azurill, -swalot, -finneon, -mankey, -dustox, -swellow, -infernape, -kabutops, -omanyte, -sunflora, -shedinja, -rapidash, -duskull, -remoraid, -zangoose, -snubbull, -makuhita, -cranidos, -stunky, -porygonz, -lickitung, -starly, -smoochum, -silcoon, -armaldo, -glaceon, -cascoon, -salamence, -nincada, -shroomish, -kricketune, -goodra, -sceptile, -helioptile, -magcargo, -shellder, -kricketot, -dodrio, -electrode, -weavile, -weezing, -magnemite, -charmander, -rotomfrost, -tangela, -seedot, -chatot, -totodile, -nidoqueen, -torterra, -burmy, -mamoswine, -slaking, -turtwig, -grimer, -torchic, -ninjask, -lickilicky, -abra, -nidoking, -ekans, -dunsparce, -vaporeon, -porygon2, -seel, -aggron, -bonsly, -gloom, -wigglytuff, -minun, -slowpoke, -jigglypuff, -spoink, -lucario, -kingler, -ledyba, -nidoranf,  -tentacruel, -anorith, -nidoranm, -blissey, -ponyta, -sealeo, -volbeat, -bastiodon, -spinda,  -jolteon, -poochyena, -togetic, -squirtle, -magby, -prinplup, -walrein, -uxie, -paras, -magneton, -riolu, -taillow, -weedle, -kakuna, -scyther, -nosepass, -purugly, -ditto, -ivysaur, -flygon, -vulpix, -xatu, -spinarak, -skuntank, -hitmonlee, -machamp, -grovyle, -machop, -mrmime, -gorebyss, -shuckle, -steelix, -mantyke, -farfetchd, -tyrogue, -exeggutor, -togekiss, -linoone, -rhyperior, -wormadamsandy, -psyduck, -yanmega, -goldeen, -vibrava, -chinchou, -dusknoir, -raticate, -rotommow, -spheal, -luxio, -magnezone, -growlithe, -budew, -onix, -shieldon, -braixen,  -staraptor, -kirlia, -drapion, -tyranitar, -illumise, -bronzor, -carnivine, -electrike, -diglett, -magmortar, -muk, -pheromosa, -zapdos, -decidueye, -bellossom, -snorunt, -umbreon, -snover, -hitmontop, -kangaskhan, -larvitar, -azumarill, -mightyena, -bulbasaur, -leafeon, -shelgon, -horsea, -parasect, -weepinbell, -corsola, -tornadus+defiant, -thundurus+defiant, -landorus+sheerforce, -snivy+contrary, -servine+contrary, -serperior+contrary, -tepig+thickfat, -pignite+thickfat, -emboar+reckless, -oshawott+shellarmor, -dewott+shellarmor, -samurott+shellarmor, -patrat+analytic, -watchog+analytic, -lillipup+runaway, -herdier+scrappy, -stoutland+scrappy, -purrloin+prankster, -liepard+prankster, -pansage+overgrow, -simisage+overgrow, -pansear+blaze, -simisear+blaze, -panpour+torrent, -simipour+torrent, -tympole+waterabsorb, -palpitoad+waterabsorb, -seismitoad+waterabsorb, -cottonee+chlorophyll, -whimsicott+chlorophyll, -petilil+leafguard, -lilligant+leafguard, -karrablast+noguard, -escavalier+overcoat, -shelmet+overcoat, -accelgor+unburden, -venipede+quickfeet, -whirlipede+quickfeet, -scolipede+quickfeet, -pidove+rivalry, -tranquill+rivalry, -unfezant+rivalry, -sigilyph+tintedlens, -ducklett+hydration, -swanna+hydration, -emolga+motordrive, -basculin+moldbreaker, -basculinbluestriped+moldbreaker, -alomomola+regenerator, -stunfisk+sandveil, -tirtouga+swiftswim, -carracosta+swiftswim, -elgyem+analytic, -beheeyem+analytic, -pawniard+pressure, -bisharp+pressure, -joltik+swarm, -galvantula+swarm, -solosis+regenerator, -duosion+regenerator, -reuniclus+regenerator, -golett+noguard, -golurk+noguard, -heatmor+whitesmoke, -durant+truant, -maractus+stormdrain, -dwebble+weakarmor, -crustle+weakarmor, -sandile+angerpoint, -krokorok+angerpoint, -krookodile+angerpoint, -drilbur+moldbreaker, -excadrill+moldbreaker, - druddigon+moldbreaker, -vanillite+weakarmor, -vanillish+weakarmor, -vanilluxe+weakarmor, -klang+clearbody, -klinklang+clearbody, -axew+unnerve, -fraxure+unnerve, -haxorus+unnerve, -audino+klutz, -throh+moldbreaker, -sawk+moldbreaker, -scraggy+intimidate, -scrafty+intimidate, -timburr+ironfist, -gurdurr+ironfist, -conkeldurr+ironfist, -serperior+gigadrain, -serperior+dragonpulse, -emboar+firepunch, -emboar+helpinghand, -emboar+heatwave, -emboar+ironhead, -emboar+lowkick, -emboar+superpower, -emboar+thunderpunch, -samurott+helpinghand, -samurott+icywind, -samurott+superpower, -watchog+firepunch, -watchog+helpinghand, -watchog+icepunch, -watchog+lowkick, -watchog+thunderpunch, -watchog+zenheadbutt, -stoutland+helpinghand, -stoutland+ironhead, -stoutland+superpower, -liepard+darkpulse, -liepard+foulplay, -liepard+trick, -simisage+gigadrain, -simisage+helpinghand, -simisage+lowkick, -simisage+superpower, -simisear+firepunch, -simisear+heatwave, -simisear+helpinghand, -simisear+lowkick, -simisear+superpower, -simipour+helpinghand, -simipour+icepunch, -simipour+icywind, -simipour+lowkick, -simipour+superpower, -musharna+helpinghand, -musharna+skillswap, -musharna+trick, -musharna+zenheadbutt, -unfezant+heatwave, -unfezant+roost, -unfezant+skyattack, -unfezant+tailwind, -gigalith+earthpower, -gigalith+ironhead, -gigalith+superpower, -swoobat+gigadrain, -swoobat+heatwave, -swoobat+helpinghand, -swoobat+roost, -swoobat+skillswap, -swoobat+skyattack, -swoobat+tailwind, -swoobat+trick, -swoobat+zenheadbutt, -escavalier+drillrun, -excadrill+earthpower, -excadrill+ironhead, -audino+firepunch, -audino+helpinghand, -audino+icepunch, -audino+icywind, -audino+lowkick, -audino+skillswap, -audino+thunderpunch, -audino+zenheadbutt, -conkeldurr+firepunch, -conkeldurr+helpinghand, -conkeldurr+icepunch, -conkeldurr+thunderpunch, -seismitoad+earthpower, -seismitoad+icepunch, -seismitoad+icywind, -seismitoad+lowkick, -throh+firepunch, -throh+helpinghand, -throh+icepunch, -throh+lowkick, -throh+superpower, -throh+thunderpunch, -sawk+firepunch, -sawk+helpinghand, -sawk+icepunch, -sawk+lowkick, -sawk+superpower, -sawk+thunderpunch, -leavanny+gigadrain, -leavanny+helpinghand, -scolipede+superpower, -scolipede+bug bite, -lilligant+gigadrain, -lilligant+helpinghand, -basculin+icywind, -basculin+superpower, -basculin+zenheadbutt, -basculinbluestriped+icywind, -basculinbluestriped+superpower, -basculinbluestriped+zenheadbutt, -krookodile+darkpulse, -krookodile+dragonpulse, -krookodile+earthpower, -krookodile+lowkick, -krookodile+superpower, -darmanitan+firepunch, -darmanitan+heatwave, -darmanitan+superpower, -darmanitan+zenheadbutt, -maractus+helpinghand, -crustle+bugbite, -scrafty+darkpulse, -scrafty+dragonpulse, -scrafty+firepunch, -scrafty+foulplay, -scrafty+icepunch, -scrafty+ironhead, -scrafty+lowkick, -scrafty+thunderpunch, -scrafty+zenheadbutt, -sigilyph+darkpulse, -sigilyph+heatwave, -sigilyph+icywind, -sigilyph+roost, -sigilyph+skillswap, -sigilyph+skyattack, -sigilyph+tailwind, -sigilyph+trick, -sigilyph+zenheadbutt, -cofagrigus+darkpulse, -cofagrigus+skillswap, -cofagrigus+trick, -carracosta+earthpower, -carracosta+icywind, -carracosta+ironhead, -carracosta+lowkick, -carracosta+superpower, -archeops+dragonpulse, -archeops+earthpower, -archeops+heatwave, -archeops+roost, -archeops+skyattack, -archeops+tailwind, -garbodor+darkpulse, -garbodor+gigadrain, -zoroark+darkpulse, -zoroark+foulplay, -zoroark+lowkick, -zoroark+trick, -cinccino+helpinghand, -gothitelle+foulplay, -gothitelle+helpinghand, -gothitelle+skillswap, -gothitelle+trick, -gothitelle+zenheadbutt, -reuniclus+firepunch, -reuniclus+helpinghand, -reuniclus+icepunch, -reuniclus+skillswap, -reuniclus+superpower, -reuniclus+thunderpunch, -reuniclus+trick, -reuniclus+zenheadbutt, -swanna+icywind, -swanna+roost, -swanna+skyattack, -swanna+tailwind, -vanilluxe+icywind, -sawsbuck+gigadrain, -emolga+helpinghand, -emolga+roost, -emolga+tailwind, -amoonguss+foulplay, -jellicent+darkpulse, -jellicent+gigadrain, -jellicent+icywind, -jellicent+trick, -alomomola+helpinghand, -alomomola+icywind, -galvantula+bugbite, -galvantula+gigadrain, -ferrothorn+gigadrain, -eelektross+firepunch, -eelektross+gigadrain, -eelektross+superpower, -eelektross+thunderpunch, -beheeyem+trick, -haxorus+superpower, -haxorus+lowkick, -beartic+lowkick, -accelgor+bugbite, -stunfisk+electroweb, -stunfisk+foulplay, -mienshao+helpinghand, -druddigon+firepunch, -druddigon+heatwave, -druddigon+ironhead, -druddigon+thunderpunch, -golurk+drainpunch, -golurk+firepunch, -golurk+icepunch, -golurk+icywind, -golurk+lowkick, -golurk+superpower, -golurk+thunderpunch, -golurk+zenheadbutt, -bisharp+foulplay, -bisharp+lowkick, -bouffalant+superpower, -bouffalant+zenheadbutt, -braviary+heatwave, -braviary+superpower, -mandibuzz+foulplay, -mandibuzz+heatwave, --heatmor+gigadrain, -durant+endeavor, -durant+superpower, -hydreigon+heatwave, -hydreigon+roost, -hydreigon+superpower, -hydreigon+tailwind, -volcarona+gigadrain, -volcarona+roost, -volcarona+tailwind, -cobalion+zenheadbutt, -terrakion+zenheadbutt, -terrakion+ironhead, -virizion+superpower, -virizion+zenheadbutt, -tornadus+foulplay, -tornadus+heatwave, -tornadus+icywind, -tornadus+superpower, -thundurus+foulplay, -thundurus+superpower, -thundurus+thunderpunch, -landorus+earthpower, -landorus+superpower, -custapberry, -Snarl";
					formatname = "VGC 2011";
					formatDescription = "VGC 2011 was played on Pokemon Black and White, and you could only use Pokemon from the Unova Pokedex. BW2 move tutor moves and most Hidden Abilities are banned, because they were unreleased at the time. Create teams for VGC 2011 by selecting \"[Gen 5] GBU Doubles\" in the teambuilder.";
					sampleTeams = [
						["gothitelle", "thundurus", "terrakion", "hydreigon", "escavalier", "conkeldurr", "https://pokepast.es/81e1a1b26fbcf536", "Ray Rizzo's 1st Place Worlds Team"],
						["krookodile", "thundurus", "tornadus", "krookodile", "scrafty", "eelektross", "https://pokepast.es/6db94e5e6af31877", "Matty's 2nd Place Worlds Team"],
						["scrafty", "amoonguss", "jellicent", "tornadus", "terrakion", "thundurus", "https://pokepast.es/2d17b779cae664ef", "RubeNCB's Top 4 Worlds Team"],
						["amoonguss", "cofagrigus", "whimsicott", "gigalith", "jellicent", "conkeldurr", "https://pokepast.es/71bd8e687834292e", "CakeOfSpan's Regional Trick Room Team"],
						["whimsicott", "terrakion", "thundurus", "tornadus", "scrafty", "jellicent", "https://pokepast.es/683eed7f443c962e", "Generic TerraCott Team"]
					];
					break;
				case "corsola":
				case "corsolacup":
				case "corsola cup":
					tourformat = "gen71v1";
					tourname = "[Gen 7] Corsola Cup";
					tourrules = "-uber, -ou, -uubl, -uu, -rubl, -ru, -nubl, -nu, -publ, -pu, -zu, -nfe, -lc, -lc uber, +Corsola, +Focus Sash,  -Hidden Power, -Waterium Z, -Groundium Z, -Rockium Z, -Natural Gift, !evasion moves clause, !accuracy moves clause";
					tournote = "Corsola only! Waterium Z, Groundium Z, Rockium Z, Natural Gift, and Hidden Power are banned. Create teams in the [Gen 7] 1v1 format, and make sure it's level 100! Sample team: http://pokepast.es/4ecf64b1bb612848";
					break;
				case "bulu":
				case "tapu bulu":
				case "tapu bulu cup":
				case "bulucup":
				case "bulu cup":
					tourformat = "gen71v1";
					tourname = "[Gen 7] Tapu Bulu  Cup";
					tourrules = "-uber, -ou, -uubl, -uu, -rubl, -ru, -nubl, -nu, -publ, -pu, -zu, -nfe, -lc, -lc uber, +Tapu Bulu, +Focus Sash, -Hidden Power, !evasion moves clause, !accuracy moves clause";
					tournote = "Tapu Bulu only! Hidden Power is banned. Create teams in the [Gen 7] 1v1 format, and make sure it's level 100! Sample team: https://pokepast.es/9abdac8c09b0538e";
					break;
				case "crab":
				case "craboff":
				case "crab off":
					tourformat = "gen7vgc2018";
					tourname = "[Gen 7] Crab Off VGC";
					tourrules = "-uber, -ou, -uubl, -uu, -rubl, -ru, -nubl, -nu, -publ, -pu, -zu, -nfe, -lc, -lc uber, +Armaldo, +Clawitzer, +Crabominable, +Crawdaunt, +Crustle, +Kingler, +Parasect, +Anorith, +Clauncher, +Corphish, +Crabrawler, +Krabby, +Paras, +Dwebble, !species clause, !item clause";
					tournote = "Crab off! No Species or Item Clause! Legal Pokemon are: Armaldo, Clawitzer, Crabominable, Crawdaunt, Crustle, Kingler, Parasect, and their pre-evolutions.";
					break;
				case "inverse":
				case "inverse vgc":
				case "vgc inverse":
					tourformat = defaultTour;
					tourname = "[Gen 7] VGC 2019 Inverse Battle";
					tourrules = "inverse mod";
					tournote = "VGC Inverse Battles! Type matchups are inverted. Now Fire-type attacks are super-effective against Water-type Pokemon!";
					break;
				case "vgclc":
				case "lcvgc":
				case "little cup vgc":
				case "vgc little cup": //Little Cup style. Doesn't enforce level 5 limit.
					tourformat = "gen7vgc2018";
					tourname = "[Gen 7] VGC Little Cup";
					tourrules = "Little Cup, !Item Clause";
					tournote = "Teams for this tournament must only use Pokemon that are the first in their evolution family, while also having the potential to evolve.";
					break;
				case "kantocup":
				case "kanto":
				case "gen1cup":
				case "vgc98":
					tourformat = "gen7vgc2018";
					tourname = "[Gen 7] VGC Kanto Cup";
					tourrules = "-uber, -ou, -uubl, -uu, -rubl, -ru, -nubl, -nu, -publ, -pu, -zu, -nfe, -lc, -lc uber, +Bulbasaur, +Ivysaur, +Venusaur, +Charmander, +Charmeleon, +Charizard, +Squirtle, +Wartortle, +Blastoise, +Caterpie, +Metapod, +Butterfree, +Weedle, +Kakuna, +Beedrill, +Pidgey, +Pidgeotto, +Pidgeot, +Rattata, +Raticate, +Spearow, +Fearow, +Ekans, +Arbok, +Pikachu, +Raichu, +Sandshrew, +Sandslash, +Nidoran♀, +Nidorina, +Nidoqueen, +Nidoran♂, +Nidorino, +Nidoking, +Clefairy, +Clefable, +Vulpix, +Ninetales, +Jigglypuff, +Wigglytuff, +Zubat, +Golbat, +Oddish, +Gloom, +Vileplume, +Paras, +Parasect, +Venonat, +Venomoth, +Diglett, +Dugtrio, +Meowth, +Persian, +Psyduck, +Golduck, +Mankey, +Primeape, +Growlithe, +Arcanine, +Poliwag, +Poliwhirl, +Poliwrath, +Abra, +Kadabra, +Alakazam, +Machop, +Machoke, +Machamp, +Bellsprout, +Weepinbell, +Victreebel, +Tentacool, +Tentacruel, +Geodude, +Graveler, +Golem, +Ponyta, +Rapidash, +Slowpoke, +Slowbro, +Magnemite, +Magneton, +Farfetch’d, +Doduo, +Dodrio, +Seel, +Dewgong, +Grimer, +Muk, +Shellder, +Cloyster, +Gastly, +Haunter, +Gengar, +Onix, +Drowzee, +Hypno, +Krabby, +Kingler, +Voltorb, +Electrode, +Exeggcute, +Exeggutor, +Cubone, +Marowak, +Hitmonlee, +Hitmonchan, +Lickitung, +Koffing, +Weezing, +Rhyhorn, +Rhydon, +Chansey, +Tangela, +Kangaskhan, +Horsea, +Seadra, +Goldeen, +Seaking, +Staryu, +Starmie, +Mr. Mime, +Scyther, +Jynx, +Electabuzz, +Magmar, +Pinsir, +Tauros, +Magikarp, +Gyarados, +Lapras, +Ditto, +Eevee, +Vaporeon, +Jolteon, +Flareon, +Porygon, +Omanyte, +Omastar, +Kabuto, +Kabutops, +Aerodactyl, +Snorlax, +Articuno, +Zapdos, +Moltres, +Dratini, +Dragonair, +Dragonite";
					tournote = "Teams for this tournament can only use Pokemon from the Kanto region (dex numbers #1-149). Alolan versions, Megas, and Z-crystals are allowed.";
					break;
				case "gio":
				case "eevee":
					tourformat = "gen71v1";
					tourname = "[Gen 7] Gio Cup";
					tourrules = "-uber, -ou, -uubl, -uu, -rubl, -ru, -nubl, -nu, -publ, -pu, -zu, -nfe, -lc, -lc uber, +Eevee, +Flareon, +Vaporeon, +Jolteon, +Espeon, +Umbreon, +Leafeon, +Glaceon, +Sylveon, !evasion moves clause, !accuracy moves clause, +Focus Sash, +Detect+Fightinium Z"; 
					tournote = "Only Eevee Evolutions allowed! Bring as many Eeveelutions as you want, but you can only choose 1 per battle!";
					break;
				case "hackmons":
				case "vgc hackmons":
				case "hackmons vgc": //Impossible to implement completely with current PS tour system.
					tourformat = "gen7doublesubers";
					tourname = "[Gen 7] Doubles Hackmons";
					tourrules = "/tour rules +Illegal, +Unreleased, !Species Clause";
					tournote = "Anything that can be hacked in-game and is usable in local battles is allowed!";
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
					break;
			}

			//If no extra settings are specified, make the tour single elim with 128 player cap.
			if (arglist[1] === undefined)
			{
				arglist[1] = "elimination";
			}
			if (arglist[2] === undefined || isNaN(arglist[2]))
			{
				arglist[2] = "128";
			}
			if (arglist[3] === undefined|| isNaN(arglist[3]))
			{
				arglist[3] = "1";
			}
			if (tourname === undefined)
			{
				this.say(room, "/tour create " + tourformat + ", " + arglist[1] + ", " + arglist[2] + ", " + arglist[3]);
			}
			else
			{
				this.say(room, "/tour create " + tourformat + ", " + arglist[1] + ", " + arglist[2] + ", " + arglist[3] + ", " + tourname);
			}
			
			if (tourrules)
			{
				this.say(room, "/tour rules " + tourrules);
			}
			//Note: this will always display tournote, even if the tour wasn't started because of invalid data.
			if (tournote)
			{
				this.say(room, "/wall " + tournote);
			}

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

			let htmlText;

			if (formatDescription && sampleTeams)
			{
				let htmlText = "<b>" + formatname + "</b> <br> <details> <summary>Rules for " + formatname + " (click to view)</summary> " + formatDescription +  "</details> <details> <summary>Sample Teams</summary>";
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
				this.say(room, "/addhtmlbox " + htmlText);
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
		];

		let jokeNum = parseInt(arg);
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
		let bsUsage = "https://3ds.pokemon-gl.com/battle/usum/#wcs";
		let psUsage = "https://www.smogon.com/stats/2019-10/gen7vgc2019ultraseries-1760.txt";
		let psDetailedUsage = "https://www.smogon.com/stats/2019-10/moveset/gen7vgc2019ultraseries-1760.txt";

		if (by.charAt(0) === ' ' || room.charAt(0) === ",")
		{
			this.say(room, "/pm " + by + ", VGC Stats Website: " + vgcstats);
			this.say(room, "/pm " + by + ", Battle Spot Usage: " + bsUsage);
			this.say(room, "/pm " + by + ", Showdown Usage Stats: " + psUsage);
			this.say(room, "/pm " + by + ", Showdown Detailed Usage Stats: " + psDetailedUsage);
			return false;
		}
		else
		{
			//See usage.html
			text = "/addhtmlbox <strong>VGC Usage Stats!</strong> <ul style = \"list-style: outside; margin: 0px 0px 0px -20px\"><li><a href=\"" + vgcstats + "\">VGC Stats Website</a></li><li><a href=\"" + bsUsage + "\">Battle Spot Usage</a></li><li><a href=\"" + psUsage + "\">Showdown Usage</a></li><li><a href=\"" + psDetailedUsage + "\">Showdown Detailed Usage</a></li></ul>";
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

	icpa: function(arg, by, room)
	{
		this.say(room, "/addhtmlbox The ICPA is an intercollegiate Pokemon league where colleges play bo3 VGC matches to determine the best college. The <a href = \"https://trainertower.com/forums/threads/2018-icpa-fall-series-sign-up-thread.5235/\">Fall Series session signups </a>end on November 2nd. More information can be found in the link provided.");
	},

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
		this.say(room, "/addhtmlbox <img src=\"https://cdn.discordapp.com/attachments/394481120806305794/506966120482209792/platyprowl.gif\" height=175 width=170><br><a href = \"https://www.youtube.com/watch?v=VaNbDYGmGwc\">Platypus on the Prowl</a>");
	},

	mynameis: function(arg, by, room)
	{
		this.say(room, "CasedVictory");
	},
	epic: function(arg, by, room)
	{
		this.say(room, "gaming");
	},
	yveldon: "raydon",
	raydon: function(arg, by, room)
	{
		this.say(room, "sogood");
	},
	nom: function(arg, by, room)
	{
		this.say(room, "Player not recognized. Perhaps you meant **seaco**.");
	},
	ezrael: function(arg, by, room)
	{
		this.say(room, ":teamjon:");
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
		let pokemonSprite = "http://play.pokemonshowdown.com/sprites/xyani/" + arg + ".gif";

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
	}
};
