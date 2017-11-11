export default () => {
    let buttons = {
        text: "Go back",
        fallback: "",
        callback_id: "default",
        color: "#3AA3E3",
        attachment_type: "default",
        actions: []
    };

    buttons.actions.push(
        {
            name: "go_back",
            text: "Go Back",
            type: "button",
            value: "go_back"
        }
    );

    return buttons;
}
