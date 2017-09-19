'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('@slack/client');

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var bot_token = 'xoxb-239945021729-jw45n1F5kzIy0gZfHjj3CxDk';
var rtm = new _client.RtmClient(bot_token);
var web = new _client.WebClient(bot_token);

var BenderBot = function () {
    function BenderBot() {
        var _this = this;

        _classCallCheck(this, BenderBot);

        this.this.challenges = [];
        this.ctf_prefix = '';
        this.users = [];
        this.admins = ['shombo', 'direwolf', 'jchristman'];

        this.commands = {
            '!help': function help(_ref) {
                var message = _ref.message;
                return _this.showHelp(message.channel);
            },
            '!add challenge': function addChallenge(_ref2) {
                var message = _ref2.message,
                    username = _ref2.username;
                return _this.addChallenge(message.text.replace('!add challenge ', ''), username, message.channel);
            },
            '!delete challenge': function deleteChallenge(_ref3) {
                var message = _ref3.message,
                    username = _ref3.username;
                return _this.deleteChallenge(message.text.replace('!delete challenge ', ''), username, message.channel);
            },
            '!list': function list(_ref4) {
                var message = _ref4.message;
                return _this.listChallenges(message.channel);
            },
            '!open': function open(_ref5) {
                var message = _ref5.message;
                return _this.listUnsolved(message.channel);
            },
            '!working': function working(_ref6) {
                var message = _ref6.message,
                    username = _ref6.username;
                return _this.working(message.text.replace('!working ', ''), username, message.channel);
            },
            '!not working': function notWorking(_ref7) {
                var message = _ref7.message,
                    username = _ref7.username;
                return _this.notWorking(username, message.channel);
            },
            '!solve': function solve(_ref8) {
                var message = _ref8.message,
                    username = _ref8.username;
                return _this.solve(message.text.replace('!solve ', ''), username, message.channel);
            },
            '!unsolve': function unsolve(_ref9) {
                var message = _ref9.message,
                    username = _ref9.username;
                return _this.unsolve(message.text.replace('!unsolve ', ''), username, message.channel);
            },
            '!set ctf': function setCtf(_ref10) {
                var message = _ref10.message,
                    username = _ref10.username;
                return _this.setCtf(message.text.replace('!set ctf ', ''), username, message.channel);
            },
            '!archive ctf': function archiveCtf(_ref11) {
                var message = _ref11.message,
                    username = _ref11.username;
                return _this.notImplemented(message.text.replace('!archive ctf ', ''), message.channel);
            },
            '!eth': function eth(_ref12) {
                var message = _ref12.message;
                return _this.getEth(message.channel);
            }
        };

        rtm.on(_client.RTM_EVENTS.MESSAGE, function (message) {
            console.log(_this.getUsernameFromId(message.user));
            console.log(message.text);
            if (message.type === 'message' && message.text) {
                var command = message.text.match(/^!(\w+)/);
                console.log(command);
                if (command) {
                    var username = _this.getUsernameFromId(message.user);
                    _this.commands[command]({ message: message, username: username });
                }
            }
        });

        web.users.list(function (err, data) {
            if (err) {
                console.error('web.users.list Error:', err);
            } else {
                _this.updateUsers(data);
            }
        });

        rtm.start();
    }

    _createClass(BenderBot, [{
        key: 'updateUsers',
        value: function updateUsers(data) {
            this.users = data.members;
        }
    }, {
        key: 'getUsernameFromId',
        value: function getUsernameFromId(id) {
            var user = _lodash2.default.find(this.users, { id: id });
            return user ? user.name : 'unknown member';
        }
    }, {
        key: 'getEth',
        value: function getEth(channel) {
            _https2.default.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', function (res) {
                res.setEncoding("utf8");
                var body = "";
                res.on("data", function (data) {
                    return body += data;
                });
                res.on("end", function () {
                    return rtm.sendMessage('The current price of ETH is  $' + JSON.parse(body).USD, channel);
                });
            });
        }
    }, {
        key: 'showHelp',
        value: function showHelp(channel) {
            var help = "The admins are: \n";
            help += _lodash2.default.reduce(this.admins, function (concat, admin) {
                return concat + '\t' + admin + '\n';
            });
            help += "\nHere is a list of commands:\n";
            help += "\n\t`!help`";
            help += "\n\tshows this menu\n";
            help += "\n\t`!add challenge` {\"name\":\"name\", \"points\": 100, \"type\": \"pwn\"}";
            help += "\n\tadds challenge to the this.challenges list\n";
            help += "\n\t`!delete challenge` [challenge]";
            help += "\n\tdeletes challenge from the this.challenges list\n";
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
    }, {
        key: 'addChallenge',
        value: function addChallenge(challenge, username, channel) {
            try {
                challenge = JSON.parse(challenge);
            } catch (e) {
                rtm.sendMessage("There was an issue with your JSON syntax bruh.", channel);
                return;
            }

            if (this.admins.indexOf(username) > -1) {
                console.log(challenge);
                if (challenge.name in this.challenges) {
                    rtm.sendMessage('Challenge ' + challenge.name + ' already exists.', channel);
                } else {
                    this.challenges[challenge.name] = { 'status': 'unsolved', 'points': challenge.hasOwnProperty('points') ? challenge.points : 'idk', 'type': challenge.hasOwnProperty('type') ? challenge.type : 'idk', 'working': [] };
                    var message = 'challenge ' + challenge.name + ' added';
                    rtm.sendMessage(message, channel);
                }
            } else {
                rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
            }
        }
    }, {
        key: 'listChallenges',
        value: function listChallenges(channel) {
            var message = "" + ctfPrefix + "\n\n";
            if (Object.keys(this.challenges).length > 0) {
                for (challenge in this.challenges) {
                    message += '`' + challenge + '`\n';
                    message += '\tStatus: ' + this.challenges[challenge]['status'] + '\n';
                    message += '\tPoints: ' + this.challenges[challenge]['points'] + '\n';
                    message += '\tType: ' + this.challenges[challenge]['type'] + '\n';
                    message += '\tWorking: ' + this.challenges[challenge]['working'] + '\n';
                }
            } else {
                message = "There aren't any this.challenges at the moment.";
            }
            rtm.sendMessage(message, channel);
        }
    }, {
        key: 'listUnsolved',
        value: function listUnsolved(channel) {
            var message = "";
            if (Object.keys(this.challenges).length > 0) {
                for (challenge in this.challenges) {
                    if (this.challenges[challenge].status === 'unsolved') {
                        message += '`' + challenge + '`\n';
                        message += '\tStatus: ' + this.challenges[challenge]['status'] + '\n';
                        message += '\tPoints: ' + this.challenges[challenge]['points'] + '\n';
                        message += '\tType: ' + this.challenges[challenge]['type'] + '\n';
                        message += '\tWorking: ' + this.challenges[challenge]['working'] + '\n';
                    }
                }
            }
            if (message.length > 0) {
                message = ctfPrefix + "\n" + message;
            } else {
                message = ctfPrefix + "\nThere aren't any unsolved this.challenges at the moment.";
            }
            rtm.sendMessage(message, channel);
        }
    }, {
        key: 'working',
        value: function working(chal, username, channel) {
            if (chal in this.challenges) {
                console.log('------');
                console.log(this.challenges[chal].status);
                console.log('------');

                if (this.challenges[chal].status !== 'Solved!') {
                    for (challenge in this.challenges) {
                        if (this.challenges.hasOwnProperty(challenge)) {
                            var index = this.challenges[challenge].working.indexOf(username);
                            if (index > -1) {
                                this.challenges[challenge].working.splice(index, 1);
                            }
                        }
                    }
                    this.challenges[chal]['working'].push(username);
                    rtm.sendMessage(username + ' now working on ' + chal, channel);
                } else {
                    rtm.sendMessage(chal + ' has been solved already.', channel);
                }
            } else {
                rtm.sendMessage('challenge does not exist', channel);
            }
        }
    }, {
        key: 'notWorking',
        value: function notWorking(username, channel) {
            for (challenge in this.challenges) {
                var index = this.challenges[challenge].working.indexOf(username);
                if (index > -1) {
                    this.challenges[challenge].working.splice(index, 1);
                }
            }
            rtm.sendMessage(username + ' is not working on anything.', channel);
        }
    }, {
        key: 'deleteChallenge',
        value: function deleteChallenge(challenge, username, channel) {
            console.log(this.challenges);
            console.log(challenge);
            console.log(challenge in this.challenges);
            if (this.admins.indexOf(username) > -1) {
                if (challenge in this.challenges) {
                    delete this.challenges[challenge];
                    var message = 'challenge ' + challenge + ' deleted';
                    rtm.sendMessage(message, channel);
                } else {
                    rtm.sendMessage("That challenge does not exist.", channel);
                }
            } else {
                rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
            }
        }
    }, {
        key: 'solve',
        value: function solve(challenge, username, channel) {
            if (this.admins.indexOf(username) > -1) {
                if (challenge in this.challenges) {
                    this.challenges[challenge].status = 'Solved!';
                    this.challenges[challenge].working = [];
                    rtm.sendMessage("Challenge " + challenge + " is now marked solved.", channel);
                } else {
                    rtm.sendMessage("That challenge does not exist.", channel);
                }
            } else {
                rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
            }
        }
    }, {
        key: 'setCtf',
        value: function setCtf(ctf, username, channel) {
            if (this.admins.indexOf(username) > -1) {
                ctfPrefix = ctf;
                rtm.sendMessage("CTF set to: " + ctf, channel);
            } else {
                rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
            }
        }
    }, {
        key: 'unsolve',
        value: function unsolve(challenge, username, channel) {
            if (this.admins.indexOf(username) > -1) {
                if (challenge in this.challenges) {
                    this.challenges[challenge].status = 'unsolved';
                    rtm.sendMessage("Challenge " + challenge + " is now marked unsolved.", channel);
                } else {
                    rtm.sendMessage("That challenge does not exist.", channel);
                }
            } else {
                rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
            }
        }
    }]);

    return BenderBot;
}();
