import _ from 'underscore';

import categories from '../dialogs/categories.js';

export default (current_filters) => {
    let buttons = {
        text: "Filters for open challenges",
        fallback: "",
        callback_id: "default",
        color: "#3AA3E3",
        attachment_type: "default",
        actions: []
    }

    _.each(categories, (category) => {
        if (_.contains(current_filters, category.value)) {
            buttons.actions.push(
                {
                    name: 'remove_filter',
                    text: category.value,
                    type: 'button',
                    style: 'primary',
                    value: `remove_filter:${category.value}`
                }
            );
        } else {
            buttons.actions.push(
                {
                    name: 'add_filter',
                    text: category.value,
                    type: 'button',
                    value: `add_filter:${category.value}`
                }
            );
        }
    });
    
    return buttons;
}
