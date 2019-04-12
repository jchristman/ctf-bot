import { RtmClient, WebClient, RTM_EVENTS } from '@slack/client';
import Express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import request from 'request';
import axios from 'axios';
import qs from 'querystring';
import _ from 'lodash';
import getRandomQuote from 'get-random-quote';

import { token, oauth_token } from './secrets.json';

// Import buttons
import ADMIN_BUTTONS from './buttons/admin.js';
import NONADMIN_BUTTONS from './buttons/non-admin.js';
import CHALLENGE_BUTTON from './buttons/challenge.js';
import BACK_BUTTON from './buttons/back-button.js';
import FILTERS from './buttons/filters.js';

// Import dialogs
import START_CTF from './dialogs/start_ctf.js';
import ADD_CHALLENGE from './dialogs/add_challenge.js';

const PORT = 8888;

const bot_token = 'xoxb-239945021729-jw45n1F5kzIy0gZfHjj3CxDk';
const rtm       = new RtmClient(bot_token);
const web       = new WebClient(bot_token);

class BenderBot {
    constructor() {
        this.challenges = {};
        this.ctf = {};
        this.interactive_states = {};

        this.ctf_prefix = '';
        this.main_channel = '';
        this.users = [];
        this.admins = ['shombo', 'direwolf', 'jchristman', 'wparks'];

        this.server = new Express()
        this.server.use(bodyParser.urlencoded({extended: true}))

        this.secure_post = (path, cb) => {
            this.server.post(path, (req, res) => {
                let { body } = req;
                if (body.payload !== undefined) {
                    body = JSON.parse(body.payload);
                }

                console.log(body);

                if (body.token !== token){
                    res.status(403).end("Access forbidden")
                } else {
                    cb(res, body);
                }
            });
        };

        this.secure_post('/', (res, body) => {
            res.status(200).end();
            let { response_url } = body;

            // Now store the response_url with a map of user:channel -> response_url
            this.interactive_states[`${body.user_id}:${body.channel_id}`] = {
                response_url,
                filters: [],
                view_completed: true
            };

            let message = this.current_status(body.user_name);
            this.jsonPost(response_url, message);
        });

        this.secure_post('/actions', (res, body) => {
            if (body.submission !== undefined) {
                const errors = this.process_submission(body);
                if (errors !== undefined) {
                    console.log('Sending errors', errors);
                    res.json(errors);
                } else {
                    res.status(200).end();
                }
                return;
            }
            
            res.status(200).end();
            this.process_action(body);
        });

        this.server.listen(PORT, () => {
            console.log(`Server started at localhost:${PORT}`)
        });
    }
    
    /* ------------------------------------------------------------------
     * Authorization bearer for a json type post
     * ------------------------------------------------------------------ */
    jsonPost(url, data, cb = () => {}) {
        const headers = {
            headers: {
                Authorization: `Bearer ${oauth_token}`
            }
        }

        axios.post(url, data, headers)
            .then((res) => {
                if (res.data.ok === false) {
                    console.log(`Post to ${url} failed: `, data, res.data);
                } else {
                    cb(res.data);
                }
            }).catch((err) => {
                console.log(`Post to ${url} failed: `, err);
            });
    }

    jsonGet(url, cb = () => {}) {
        if (url.includes('?')) {
            url += `&token=${oauth_token}`;
        } else {
            url += `?token=${oauth_token}`;
        }
        axios.get(url)
            .then((res) => {
                if (res.data.ok === false) {
                    console.log(`Get to ${url} failed: `, res.data);
                } else {
                    cb(res.data);
                }
            }).catch((err) => {
                console.log(`Get to ${url} failed: `, err);
            });
    }

    
    /* ------------------------------------------------------------------
     * Slack specific functions
     * ------------------------------------------------------------------ */
    dialog_open(body, dialog) {
        const { trigger_id } = body;
        const data = {
            token: oauth_token,
            trigger_id,
            dialog: JSON.stringify(dialog)
        };

        axios.post('https://slack.com/api/dialog.open', qs.stringify(data))
            .then((res) => {
                if (res.data.ok === false) {
                    console.log('dialog.open failed: ', res.data);
                }
            }).catch((err) => {
                console.log('dialog.open call failed: ', err);
            });
    }

    chat_update(channel, ts, text, attachments) {
        const data = { channel, ts, text, attachments };
        this.jsonPost('https://slack.com/api/chat.update', data);
    }

    chat_postEphemeral(channel, user, text, attachments) {
        const data = { channel, user, text, attachments };
        this.jsonPost('https://slack.com/api/chat.postEphemeral', data);
    }

    chat_postMessage(channel, user, text, attachments) {
        const data = { channel, user, text, attachments };
        this.jsonPost('https://slack.com/api/chat.postMessage', data);
    }

    channels_create(name, cb) {
        const data = { name, validate: false };
        this.jsonPost('https://slack.com/api/channels.create', data, cb);
    }

    list_channels(cb) {
        this.jsonGet('https://slack.com/api/channels.list?exclude_archived=true', cb);
    }

    archive_channel(channel_id) {
        const data = { channel: channel_id };
        this.jsonPost('https://slack.com/api/channels.archive', data);
    }

    /* ------------------------------------------------------------------
     * App specific functions
     * ------------------------------------------------------------------ */
    process_action(body) {
        const action = body.actions[0];
        let message = '',
            c_user = '',
            filter = '',
            chal = '';

        // Now store the response_url with a map of user:channel -> response_url
        this.interactive_states[`${body.user.id}:${body.channel.id}`].response_url = body.response_url;

        switch(action.name) {
            case 'start':
                this.main_channel = body.channel.id;
                this.dialog_open(body, START_CTF());
                break;
            case 'archive':
                this.list_channels((results) => {
                    _.each(results.channels, (channel) => {
                        if (channel.name.startsWith(this.ctf.chan_prefix) || channel.id === this.main_channel) {
                            console.log(`Archiving ${channel.name}`);
                            this.archive_channel(channel.id);
                        }
                    });
                });
                break;
            case 'end':
                this.ctf = {};
                this.challenges = {};
                message = this.current_status(body.user.name);
                this.jsonPost(body.response_url, message);
                break;
            case 'add_challenge':
                this.dialog_open(body, ADD_CHALLENGE());
                break;
            case 'list_challenges':
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                break;
            case 'work_on':
                c_user = `<@${body.user.id}>`;
                _.each(this.challenges, (challenge) => {
                    challenge.workers = _.filter(challenge.workers, (user) => user !== c_user);
                });
                this.challenges[action.value.split(':')[1]].workers.push(c_user);
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                break;
            case 'no_work_on':
                c_user = `<@${body.user.id}>`;
                this.challenges[action.value.split(':')[1]].workers = 
                    _.filter(this.challenges[action.value.split(':')[1]].workers, (user) => user !== c_user);
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                break;
            case 'add_filter':
                filter = action.value.split(':')[1];
                this.interactive_states[`${body.user.id}:${body.channel.id}`].filters.push(filter);
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                break;
            case 'remove_filter':
                filter = action.value.split(':')[1];
                this.interactive_states[`${body.user.id}:${body.channel.id}`].filters =
                    _.filter(this.interactive_states[`${body.user.id}:${body.channel.id}`].filters, (_filter) => _filter !== filter);
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                break;
            case 'mark_solved':
                chal = action.value.split(':')[1];
                this.challenges[chal].solved = true;
                this.challenges[chal].solvedBy = body.user.id;
                message = this.list_challenges(body);
                this.jsonPost(body.response_url, message);
                this.chat_postMessage(this.main_channel, '', `${this.challenges[chal].name} was just solved by <@${this.challenges[chal].solvedBy}>!\n\nWay to go champ!`, []);
                break;
            default:
                message = this.current_status(body.user.name);
                this.jsonPost(body.response_url, message);
                break;
        }
    }

    process_submission(body) {
        // Call this function when the processing of the submission is finished. Need this because
        // some actions are async, like creating a channel...
        const status_update = () => {
            const response_url = this.interactive_states[`${body.user.id}:${body.channel.id}`].response_url;
            if (response_url === undefined) {
                console.log('Oh no!! Could not find a message to update!!!', body);
            } else {
                let message = this.current_status(body.user.name);
                this.jsonPost(response_url, message);
            }
        }

        switch(body.callback_id) {
            case 'start-ctf':
                const result = this.set_ctf(body.submission, () => { status_update() });
                this.chat_postMessage(this.main_channel, '', `<!channel>, the ${this.ctf.name} bot has started. Type \`/scc\` to get started!`, []);
                console.log(this.ctf);
                return result;
                break;
            case 'add-challenge':
                return this.add_challenge(body.submission, () => {
                    const response_url = this.interactive_states[`${body.user.id}:${body.channel.id}`].response_url;

                    if (response_url === undefined) {
                        console.log('Oh no!! Could not find a message to update!!!', body);
                    } else {
                        let message = this.list_challenges(body);
                        this.jsonPost(response_url, message);
                    }
                });
                break;
            default:
                break;
        }
    }

    current_status(username) {
        let message = {
            text: '',
            attachments: []
        };

        if (this.ctf.name === undefined) {
            message.text += 'Currently, no CTF is running...';
        } else {
            message.text += `Current CTF: ${this.ctf.name}\n`;
        }

        let buttons = NONADMIN_BUTTONS(this.ctf.name !== undefined);
        if (buttons !== null) message.attachments.push(buttons);

        if (this.admins.includes(username)) {
            let admin_buttons = ADMIN_BUTTONS(this.ctf.name !== undefined);
            message.attachments.push(admin_buttons);
        }

        return message;
    }

    set_ctf(ctf, cb = () => {}) {
        this.ctf = ctf;
        cb();
    }

    add_challenge(challenge, cb = () => {}) {
        if (isNaN(challenge.points)) {
            return { errors: [{ name: "points", error: "Must be a number!" }] };
        }

        const channel_name = `${this.ctf.chan_prefix}-${challenge.name}`;
        this.channels_create(channel_name, (data) => {
            const channel_link = `<#${data.channel.id}|${data.channel.name}>`;
            
            challenge.channel = {
                name: channel_name,
                link: channel_link
            }

            challenge.workers = [];
            challenge.solved = false;

            this.challenges[challenge.name] = challenge;

            cb(this.challenges[challenge.name]);
        });
    }

    list_challenges(body) {
        const current_filters = this.interactive_states[`${body.user.id}:${body.channel.id}`].filters;

        let message = {
            text: '',
            attachments: []
        };

        message.text += 'Challenges:\n';

        message.attachments.push(BACK_BUTTON());
        _.each(FILTERS(current_filters), (filter) => message.attachments.push(filter));

        console.log(`--- ${current_filters} ---`);
        const filtered_challenges = _.filter(this.challenges,
            (challenge) => {
                const hide_completed = _.includes(current_filters, "Hide Completed");
                const num_filters = current_filters.length - (hide_completed ? 1 : 0);
                if ((challenge.solved && !hide_completed) || !challenge.solved) {
                    return (num_filters === 0 || _.includes(current_filters, challenge.category));
                }
            }
        );

        console.log(this.challenges);
        console.log(filtered_challenges);
        _.each(filtered_challenges, (challenge, name) => {
            message.attachments.push(CHALLENGE_BUTTON(challenge, body.user));
        });

        console.log(message);

        return message;
    }
}

function main() {
    const bot = new BenderBot();
}

main();
