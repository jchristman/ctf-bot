import categories from './categories.js';

const add_challenge = () => {
    return {
        title: "Add Challenge",
        callback_id: "add-challenge",
        submit_label: "Submit",
        elements: [
            {
                label: "Name",
                type: "text",
                name: "name",
                hint: "Name of the challenge"
            },
            {
                label: "Points",
                type: "text",
                name: "points",
                hint: "Number of points the challenge is worth"
            },
            {
                label: "Category",
                type: "select",
                name: "category",
                placeholder: "Select the category",
                hint: "Please note if you think a category should be perma-added, and just use misc if it doesn't fit on of the others for now",
                options: categories
            }
        ]
    }
}

export default add_challenge;
