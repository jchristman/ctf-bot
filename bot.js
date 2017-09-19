'use strict';

var _client = require('@slack/client');

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bot_token = 'xoxb-239945021729-jw45n1F5kzIy0gZfHjj3CxDk';
var rtm = new _client.RtmClient(bot_token);
var web = new _client.WebClient(bot_token);

var challenges = [];
var ctfPrefix = '';
var users = [];

var admins = ['shombo', 'direwolf'];
var allCommands = ['!help', '!add challenge', '!delete challenge', '!list', '!open', '!working', '!not working', '!solve', '!unsolve', '!set ctf', '!archive ctf', '!eth'];

function updateUsers(data) {
    users = data.members;
}

function getUsernameFromId(id) {
    var user = users.find(function (user) {
        return user.id === id;
    });
    return user ? user.name : 'unknown member';
}

function getEth(channel) {
    _https2.default.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', function (res) {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", function (data) {
            body += data;
        });
        res.on("end", function () {
            body = JSON.parse(body);
            rtm.sendMessage('The current price of ETH is  $' + body.USD, channel);
        });
    });
}

function showHelp(channel) {
    var help = "The admins are: \n";
    admins.forEach(function (admin) {
        help += '\t' + admin + '\n';
    });
    help += "\nHere is a list of commands:\n";
    help += "\n\t`!help`";
    help += "\n\tshows this menu\n";
    help += "\n\t`!add challenge` {\"name\":\"name\", \"points\": 100, \"type\": \"pwn\"}";
    help += "\n\tadds challenge to the challenges list\n";
    help += "\n\t`!delete challenge` [challenge]";
    help += "\n\tdeletes challenge from the challenges list\n";
    help += "\n\t`!list`";
    help += "\n\tlists available challanges, their status, and those working on it\n";
    help += "\n\t`!open`";
    help += "\n\tlists unsolved challanges, their status, and those working on it\n";
    help += "\n\t`!working` [challenge]";
    help += "\n\tadds you to the working list of a challange\n";
    help += "\n\t`!not working`";
    help += "\n\tremoves you from the working lists\n";
    help += "\n\t`!solve` [challenge]";
    help += "\n\tmarks a challenge as solved\n";
    help += "\n\t`!unsolve` [challenge]";
    help += "\n\tmarks a challenge as unsolved\n";
    help += "\n\t`!set ctf` [ctf name]";
    help += "\n\tsets the current ctf name\n";
    help += "\n\t`!archive ctf`";
    help += "\n\tarchives all channels associated with the current ctf";
    help += "\n\t`!eth`";
    help += "\n\tcurrent price of ETH in USD\n";
    rtm.sendMessage(help, channel);
}

function addChallenge(challenge, username, channel) {
    try {
        challenge = JSON.parse(challenge);
    } catch (e) {
        rtm.sendMessage("There was an issue with your JSON syntax bruh.", channel);
        return;
    }

    if (admins.indexOf(username) > -1) {
        console.log(challenge);
        if (challenge.name in challenges) {
            rtm.sendMessage('Challenge ' + challenge.name + ' already exists.', channel);
        } else {
            challenges[challenge.name] = { 'status': 'unsolved', 'points': challenge.hasOwnProperty('points') ? challenge.points : 'idk', 'type': challenge.hasOwnProperty('type') ? challenge.type : 'idk', 'working': [] };
            var message = 'challenge ' + challenge.name + ' added';
            rtm.sendMessage(message, channel);
        }
    } else {
        rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
    }
}

function listChallenges(channel) {
    var message = "" + ctfPrefix + "\n\n";
    if (Object.keys(challenges).length > 0) {
        for (challenge in challenges) {
            message += '`' + challenge + '`\n';
            message += '\tStatus: ' + challenges[challenge]['status'] + '\n';
            message += '\tPoints: ' + challenges[challenge]['points'] + '\n';
            message += '\tType: ' + challenges[challenge]['type'] + '\n';
            message += '\tWorking: ' + challenges[challenge]['working'] + '\n';
        }
    } else {
        message = "There aren't any challenges at the moment.";
    }
    rtm.sendMessage(message, channel);
}

function listUnsolved(channel) {
    var message = "";
    if (Object.keys(challenges).length > 0) {
        for (challenge in challenges) {
            if (challenges[challenge].status === 'unsolved') {
                message += '`' + challenge + '`\n';
                message += '\tStatus: ' + challenges[challenge]['status'] + '\n';
                message += '\tPoints: ' + challenges[challenge]['points'] + '\n';
                message += '\tType: ' + challenges[challenge]['type'] + '\n';
                message += '\tWorking: ' + challenges[challenge]['working'] + '\n';
            }
        }
    }
    if (message.length > 0) {
        message = ctfPrefix + "\n" + message;
    } else {
        message = ctfPrefix + "\nThere aren't any unsolved challenges at the moment.";
    }
    rtm.sendMessage(message, channel);
}

function working(chal, username, channel) {

    if (chal in challenges) {
        console.log('------');
        console.log(challenges[chal].status);
        console.log('------');

        if (challenges[chal].status !== 'Solved!') {
            for (challenge in challenges) {
                if (challenges.hasOwnProperty(challenge)) {
                    var index = challenges[challenge].working.indexOf(username);
                    if (index > -1) {
                        challenges[challenge].working.splice(index, 1);
                    }
                }
            }
            challenges[chal]['working'].push(username);
            rtm.sendMessage(username + ' now working on ' + chal, channel);
        } else {
            rtm.sendMessage(chal + ' has been solved already.', channel);
        }
    } else {
        rtm.sendMessage('challenge does not exist', channel);
    }
}

function notWorking(username, channel) {
    for (challenge in challenges) {
        if (challenges.hasOwnProperty(challenge)) {
            var index = challenges[challenge].working.indexOf(username);
            if (index > -1) {
                challenges[challenge].working.splice(index, 1);
            }
        }
    }
    rtm.sendMessage(username + ' is not working on anything.', channel);
}

function deleteChallenge(challenge, username, channel) {
    console.log(challenges);
    console.log(challenge);
    console.log(challenge in challenges);
    if (admins.indexOf(username) > -1) {
        if (challenge in challenges) {
            delete challenges[challenge];
            var message = 'challenge ' + challenge + ' deleted';
            rtm.sendMessage(message, channel);
        } else {
            rtm.sendMessage("That challenge does not exist.", channel);
        }
    } else {
        rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
    }
}

function solve(challenge, username, channel) {
    if (admins.indexOf(username) > -1) {
        if (challenge in challenges) {
            challenges[challenge].status = 'Solved!';
            challenges[challenge].working = [];
            rtm.sendMessage("Challenge " + challenge + " is now marked solved.", channel);
        } else {
            rtm.sendMessage("That challenge does not exist.", channel);
        }
    } else {
        rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
    }
}

function setCtf(ctf, username, channel) {
    if (admins.indexOf(username) > -1) {
        ctfPrefix = ctf;
        rtm.sendMessage("CTF set to: " + ctf, channel);
    } else {
        rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
    }
}

function unsolve(challenge, username, channel) {
    if (admins.indexOf(username) > -1) {
        if (challenge in challenges) {
            challenges[challenge].status = 'unsolved';
            rtm.sendMessage("Challenge " + challenge + " is now marked unsolved.", channel);
        } else {
            rtm.sendMessage("That challenge does not exist.", channel);
        }
    } else {
        rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
    }
}

rtm.on(_client.RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    console.log(getUsernameFromId(message.user));
    console.log(message.text);
    if (message.type === 'message' && message.text) {
        if (message.text.indexOf('!') === 0) {
            allCommands.forEach(function (command) {
                var username = getUsernameFromId(message.user);
                if (message.text.indexOf(command) !== -1) {
                    if (command === '!help') {
                        showHelp(message.channel);
                    } else if (command === '!add challenge') {
                        addChallenge(message.text.replace('!add challenge ', ''), username, message.channel);
                    } else if (command === '!delete challenge') {
                        deleteChallenge(message.text.replace('!delete challenge ', ''), username, message.channel);
                    } else if (command === '!list') {
                        listChallenges(message.channel);
                    } else if (command === '!open') {
                        listUnsolved(message.channel);
                    } else if (command === '!not working') {
                        notWorking(username, message.channel);
                    } else if (command === '!working') {
                        working(message.text.replace('!working ', ''), username, message.channel);
                    } else if (command === '!solve') {
                        solve(message.text.replace('!solve ', ''), username, message.channel);
                    } else if (command === '!unsolve') {
                        unsolve(message.text.replace('!unsolve ', ''), username, message.channel);
                    } else if (command === '!set ctf') {
                        setCtf(message.text.replace('!set ctf ', ''), username, message.channel);
                    } else if (command === '!eth') {
                        getEth(message.channel);
                    } else {
                        rtm.sendMessage('That command doesn\'t exist', message.channel);
                    }
                }
            });
        }
    }
});

web.users.list(function (err, data) {
    if (err) {
        console.error('web.users.list Error:', err);
    } else {
        updateUsers(data);
    }
});

rtm.start();
