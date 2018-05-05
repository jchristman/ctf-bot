import _ from 'lodash';

import categories from '../dialogs/categories.js';

export default (current_filters) => {
    let filters = [];

    let groups = _.chunk(categories, 5);
    
    _.each(groups, (group, index) => {
        let text = index === 0 ? 'Filters' : 'More filters';
        filters.push({
            text,
            fallback: '',
            callback_id: 'default',
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: []
        });

        _.each(group, (category) => {
            if (_.includes(current_filters, category.value)) {
                filters[index].actions.push(
                    {
                        name: 'remove_filter',
                        text: category.value,
                        type: 'button',
                        style: 'primary',
                        value: `remove_filter:${category.value}`
                    }
                );
            } else {
                filters[index].actions.push(
                    {
                        name: 'add_filter',
                        text: category.value,
                        type: 'button',
                        value: `add_filter:${category.value}`
                    }
                );
            }
        });
    });
    
    return filters;
}
