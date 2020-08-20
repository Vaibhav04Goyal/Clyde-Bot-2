# BoTTT-III
Pokemon Showdown chatroom bot specialized for the [VGC room](https://play.pokemonshowdown.com/vgc).

Installation
------------

BoTTT III requires [node.js](https://nodejs.org/) to run. It has the same version requirements as [Pokemon Showdown itself](https://github.com/smogon/pokemon-showdown). I recommend installing the most recent stable version.

Next up is cloning this bot. This can be done in two ways: cloning it via `git` or downloading as ZIP.

To install dependencies, in the directory the source code is in, run:

    npm install

Rename `config-example.js` to `config.js` and edit the variables in the file using a text editor, like the bot's name, its password, and that you are its owner. To change the commands that the bot responds to, edit `commands.js`.

Now, to start the bot, use:

    node main.js

Some information will be shown, and it will automatically join the room(s) you specified if no error occurs. Permissions for using commands can be adjusted in ``commandpermissions.json`` or more fundamentally in the ``canUse`` function in ``parser.js``. Note that if the bot is not of sufficient rank, certain commands will not work (such as commands that generate HTML).

Development
-----------

Credits:
 - DaWoblefet (Development for the VGC room)
 - Morfent (Development of original BoTTT)
 - TalkTakesTime (Development of original BoTTT)
 - Quinella (Development of original BoTTT)
 
Commands
-----------
A quick summary of commands can be found [here](https://pastebin.com/5GLxEt4P). In addition, here are the high-restriction / dev commands:

`reload` or `rl`- Updates the commands.js and parser.js files without needing to shut down and restart the bot. If you made a syntax error, you will be informed on the console and will not be able to reload until you have resolved it.

`custom` - Allow the bot to say something arbitrarily in any room it is currently in. Use the syntax .custom [room] statement. To bypass the character restriction, you can also pass BoTTT III a https://pastebin.com/raw link as your statement.

`js` - Execute arbitrary Javascript.

`gitpull` - Pull the latest code from the git repository the bot is configured with.

`kill` - Kill the process BoTTT III is running on. Equivalent to Ctrl+C in console.
