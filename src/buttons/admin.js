export default (ctf_running) => {
    let admin_buttons = {
        text: "Admin Functions",
        fallback: "",
        callback_id: "admin",
        color: "#3AA3E3",
        attachment_type: "default",
        actions: []
    };

    if (ctf_running) {
        admin_buttons.actions.push(
            {
                name: "end",
                text: "End CTF",
                style: "danger",
                type: "button",
                value: "end",
                confirm: {
                    title: "Are you sure?",
                    text: "You cannot reopen this CTF...",
                    ok_text: "Yes",
                    dismiss_text: "No"
                }
            }
        );
    } else {
        admin_buttons.actions.push(
            {
                name: "start",
                text: "Start CTF",
                type: "button",
                value: "start"
            }
        );
    }

    return admin_buttons;
}
