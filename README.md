CTF Bot
==========

Our lovable slack bot.


Installation
============

```bash
git clone https://gitlab.com/shellcollectingclub/ctf-bot.git
cd ctf-bot
docker build . -t ctf-bot
docker run -d -p 8888:8888/tcp -ctf-bot
```

Development
===========

Want to develop and have babel compile your code on the fly, while you're editing it? On a development box, do:

```bash
# In one window, to watch the src/bot.js file for changes
npm run watch

# In another window, to run the code
npm run start
```
