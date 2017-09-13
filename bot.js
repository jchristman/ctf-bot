const RtmClient  = require('@slack/client').RtmClient;
const WebClient  = require('@slack/client').WebClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

const bot_token = 'xoxb-239945021729-jw45n1F5kzIy0gZfHjj3CxDk';
const rtm       = new RtmClient(bot_token);
const web       = new WebClient(bot_token);

var challenges = [];

const allCommands = ['help','add challenge', 'list', 'working', 'not working', 'solved'];

function showHelp(channel) {
    var help = "Here is a list of commands:\n"
    help += "`!help`\n"
    help += "`!add challenge` [challenge name]\n";
    help += "`!list`\n"
    help += "`!working` [challenge]\n"
    help += "`!not working`\n"
    help += "`!solved` [challenge]"
    rtm.sendMessage(help, channel);
}


function addChallenge(challenge, channel) {
    challenges[challenge] = {'status':'unsolved','working':[]};
    console.log(challenges);
    var message = 'challenge ' + challenge + ' added';
    rtm.sendMessage(message, channel)
    console.log(message);
}


function listChallenges(channel) {
    var message = "";
    for (challenge in challenges) {
        message += '`' + challenge + '`\n';
        message += '\tStatus: ' + challenges[challenge]['status'] + '\n';
        message += '\tWorking: ' + challenges[challenge]['working'] + '\n';
        console.log(message);
    }
    rtm.sendMessage(message, channel);
}


function working(challenge) {

}


function notWorking(challenge) {

}


function solved(challenge) {

}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    if (message.type === 'message' && message.text) {
        if (message.text.indexOf('!') === 0) {
            allCommands.forEach((command) => {
                if (message.text.indexOf(command) !== -1) {
        		    if (command === 'help') {
                        showHelp(message.channel);
                    }

                    else if (command === 'add challenge') {
                        addChallenge(message.text.replace('!','').replace('add challenge ',''), message.channel);
                    }

                    else if (command === 'list') {
                        listChallenges(message.channel);
                    }

                    else {
                        const args = message.text.substring(command.length);
                        executeCommand(command, args);
                    }
                }
            });
        }
    }
});


rtm.start();
