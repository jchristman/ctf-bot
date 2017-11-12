import _ from 'underscore';

export default (challenge, user) => {
    let buttons = {
        text: `Name: ${challenge.name}  |  Points: ${challenge.points}  |  Category: ${challenge.category}  |  Channel: ${challenge.channel.link}\nCurrent workers: ${challenge.workers.length > 0 ? challenge.workers.join(', ') : 'None'}`,
        fallback: '',
        callback_id: 'challenge',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: []
    };

    if (_.contains(challenge.workers, `<@${user.id}>`)) {
        buttons.actions.push(
            {
                name: 'no_work_on',
                text: 'Stop working on this challenge',
                type: 'button',
                style: 'danger',
                value: `no_work_on:${challenge.name}`
            }
        );
    } else {
        buttons.actions.push(
            {
                name: 'work_on',
                text: 'Work on this challenge',
                type: 'button',
                value: `work_on:${challenge.name}`
            }
        );
    }

    return buttons;
}
