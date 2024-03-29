const start_ctf = () => {
    return {
        title: "Start a CTF",
        callback_id: "start-ctf",
        submit_label: "Submit",
        elements: [
            {
                label: "Name",
                type: "text",
                name: "name",
                hint: "Full name of CTF"
            },
            {
                label: "Channel Prefix",
                type: "text",
                name: "chan_prefix",
                hint: "Prefix to use for challenge channels"
            },
            {
                label: "IRC URI",
                type: "text",
                name: "irc_uri",
                hint: "Use ircs:// instead of irc:// if ssl is required.",
                optional: true
            },
            {
                label: "IRC Channel",
                type: "text",
                name: "irc_chan",
                hint: "Channel name for CTF IRC.",
                optional: true
            },
            {
                label: "IRC Nickname",
                type: "text",
                name: "irc_nick",
                hint: "Nickname for use in the IRC chat",
                value: "SCC",
                optional: true
            }
        ]
    }
}

export default start_ctf;
