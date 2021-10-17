FROM node:12

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy app and install dependencies
COPY . /usr/src/app
RUN npm install
RUN npm ci

RUN apt update && apt upgrade -y

CMD [ "npm", "start" ]
