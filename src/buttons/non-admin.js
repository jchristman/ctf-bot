export default (ctf_running) => {
    if (!ctf_running) return null;

    let buttons = {
        text: "Things you can do...",
        fallback: "",
        callback_id: "non_admin",
        color: "#3AA3E3",
        attachment_type: "default",
        actions: []
    };

    buttons.actions.push(
        {
            name: "list_challenges",
            text: "List Challenges",
            type: "button",
            value: "list_challenges"
        }
    );

    buttons.actions.push(
        {
            name: "add_challenge",
            text: "Add Challenge",
            type: "button",
            value: "add_challenge",
        }
    );

    return buttons;
}
