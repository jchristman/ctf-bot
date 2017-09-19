import { RtmClient, WebClient, RTM_EVENTS } from '@slack/client';
import https from 'https';
import _ from 'lodash';

const bot_token = 'xoxb-239945021729-jw45n1F5kzIy0gZfHjj3CxDk';
const rtm       = new RtmClient(bot_token);
const web       = new WebClient(bot_token);

class BenderBot {
    constructor() {
        this.this.challenges = [];
        this.ctf_prefix = '';
        this.users = [];
        this.admins = ['shombo', 'direwolf', 'jchristman'];

        this.commands = {
            '!help': ({message}) => this.showHelp(message.channel),
            '!add challenge': ({message, username}) => this.addChallenge(message.text.replace('!add challenge ',''), username, message.channel),
            '!delete challenge': ({message, username}) => this.deleteChallenge(message.text.replace('!delete challenge ',''), username, message.channel),
            '!list': ({message}) => this.listChallenges(message.channel),
            '!open': ({message}) => this.listUnsolved(message.channel),
            '!working': ({message, username}) => this.working(message.text.replace('!working ',''), username, message.channel),
            '!not working': ({message, username}) => this.notWorking(username, message.channel),
            '!solve': ({message, username}) => this.solve(message.text.replace('!solve ',''), username, message.channel),
            '!unsolve': ({message, username}) => this.unsolve(message.text.replace('!unsolve ',''), username, message.channel),
            '!set ctf': ({message, username}) => this.setCtf(message.text.replace('!set ctf ',''), username, message.channel),
            '!archive ctf': ({message, username}) => this.notImplemented(message.text.replace('!archive ctf ',''), message.channel),
            '!eth': ({message}) => this.getEth(message.channel)
        };

        rtm.on(RTM_EVENTS.MESSAGE, (message) => {
            console.log(this.getUsernameFromId(message.user));
            console.log(message.text);
            if (message.type === 'message' && message.text) {
                let command = message.text.match(/^!(\w+)/);
                console.log(command);
                if (command) {
                    let username = this.getUsernameFromId(message.user);
                    this.commands[command]({ message, username });
                }
            }
        });

        web.users.list((err, data) => {
            if (err) {
                console.error('web.users.list Error:', err);
            } else {
                this.updateUsers(data);
            }
        });

        rtm.start();
    }

    updateUsers(data) {
        this.users = data.members;
    }

    getUsernameFromId(id) {
        const user = _.find(this.users, { id });
        return user ? user.name : 'unknown member';
    }

    getEth(channel) {
        https.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', res => {
            res.setEncoding("utf8");
            let body = "";
            res.on("data", data => body += data );
            res.on("end", () => rtm.sendMessage('The current price of ETH is  $' + JSON.parse(body).USD, channel));
        });
    }

    showHelp(channel) {
        let help = "The admins are: \n"
        help += _.reduce(this.admins, (concat, admin) => concat + '\t' + admin + '\n');
        help += "\nHere is a list of commands:\n"
        help += "\n\t`!help`"
        help += "\n\tshows this menu\n"
        help += "\n\t`!add challenge` {\"name\":\"name\", \"points\": 100, \"type\": \"pwn\"}";
        help += "\n\tadds challenge to the this.challenges list\n"
        help += "\n\t`!delete challenge` [challenge]";
        help += "\n\tdeletes challenge from the this.challenges list\n"
        help += "\n\t`!list`"
        help += "\n\tlists available challanges, their status, and those working on it\n"
        help += "\n\t`!open`"
        help += "\n\tlists unsolved challanges, their status, and those working on it\n"
        help += "\n\t`!working` [challenge]"
        help += "\n\tadds you to the working list of a challange\n"
        help += "\n\t`!not working`"
        help += "\n\tremoves you from the working lists\n"
        help += "\n\t`!solve` [challenge]"
        help += "\n\tmarks a challenge as solved\n"
        help += "\n\t`!unsolve` [challenge]"
        help += "\n\tmarks a challenge as unsolved\n"
        help += "\n\t`!set ctf` [ctf name]"
        help += "\n\tsets the current ctf name\n"
        help += "\n\t`!archive ctf`"
        help += "\n\tarchives all channels associated with the current ctf"
        help += "\n\t`!eth`"
        help += "\n\tcurrent price of ETH in USD\n"
        rtm.sendMessage(help, channel);
    }


    addChallenge(challenge, username, channel) {
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
                this.challenges[challenge.name] = {'status':'unsolved', 'points': challenge.hasOwnProperty('points') ? challenge.points : 'idk', 'type': challenge.hasOwnProperty('type') ? challenge.type : 'idk', 'working':[]};
                let message = 'challenge ' + challenge.name + ' added';
                rtm.sendMessage(message, channel)
            }
        } else {
            rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
        }
    }

    listChallenges(channel) {
        let message = "" + ctfPrefix + "\n\n";
        if (Object.keys(this.challenges).length  > 0) {
            for (challenge in this.challenges) {
                message += '`' + challenge + '`\n';
                message += '\tStatus: ' + this.challenges[challenge]['status'] + '\n';
                message += '\tPoints: ' + this.challenges[challenge]['points'] + '\n';
                message += '\tType: ' + this.challenges[challenge]['type'] + '\n';
                message += '\tWorking: ' + this.challenges[challenge]['working'] + '\n';
            }
        }
        else {
            message = "There aren't any this.challenges at the moment.";
        }
        rtm.sendMessage(message, channel);
    }


    listUnsolved(channel) {
        let message = "";
        if (Object.keys(this.challenges).length  > 0) {
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
        }
        else {
            message = ctfPrefix + "\nThere aren't any unsolved this.challenges at the moment.";
        }
        rtm.sendMessage(message, channel);
    }

    working(chal, username, channel) {
        if (chal in this.challenges) {
            console.log('------');
            console.log(this.challenges[chal].status);
            console.log('------');

            if (this.challenges[chal].status !== 'Solved!') {
                for (challenge in this.challenges) {
                    if (this.challenges.hasOwnProperty(challenge)) {
                        let index = this.challenges[challenge].working.indexOf(username);
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


    notWorking(username, channel) {
        for (challenge in this.challenges) {
            let index = this.challenges[challenge].working.indexOf(username);
            if (index > -1) {
                this.challenges[challenge].working.splice(index, 1);
            }
        }
        rtm.sendMessage(username + ' is not working on anything.', channel);
    }


    deleteChallenge(challenge, username, channel) {
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


    solve(challenge, username, channel) {
        if (this.admins.indexOf(username) > -1) {
            if (challenge in this.challenges) {
                this.challenges[challenge].status = 'Solved!';
                this.challenges[challenge].working = [];
                rtm.sendMessage("Challenge " + challenge + " is now marked solved.", channel);
            }
            else {
                rtm.sendMessage("That challenge does not exist.", channel);
            }
        }
        else {
            rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
        }
    }

    setCtf(ctf, username, channel) {
        if (this.admins.indexOf(username) > -1) {
            ctfPrefix = ctf;
            rtm.sendMessage("CTF set to: " + ctf, channel);
        }
        else {
            rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
        }
    }

    unsolve(challenge, username, channel) {
        if (this.admins.indexOf(username) > -1) {
            if (challenge in this.challenges) {
                this.challenges[challenge].status = 'unsolved'
                rtm.sendMessage("Challenge " + challenge + " is now marked unsolved.", channel);
            }
            else {
                rtm.sendMessage("That challenge does not exist.", channel);
            }
        }
        else {
            rtm.sendMessage("Sorry, " + username + ". Only admins can do that.", channel);
        }
    }
}
