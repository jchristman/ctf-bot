FROM node

WORKDIR /app

# Install dependencies first (improve build cache)
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

# Install application
COPY .babelrc .babelrc
COPY src src
RUN npm run compile

EXPOSE 8888
CMD ["node" "dist/bot.js"]
