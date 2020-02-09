# Learning Experiences

Collecting some highlight learning experiences while implementing the project

## Acceptance Test Related

### chromium pupetteer ubuntu

https://stackoverflow.com/questions/52993002/headless-chrome-node-api-and-puppeteer-installation

`sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget`

And then https://github.com/karma-runner/karma-chrome-launcher/issues/158#issuecomment-339265457

## Client / Frontend related

### Bootstrap

I needed to

1. install https://www.npmjs.com/package/bootstrap
2. add the following entry in styles within angular.json
   "./node_modules/bootstrap/dist/css/bootstrap.min.css",

before I could use https://www.npmjs.com/package/ngx-bootstrap successfully

### Pagespeed

https://developers.google.com/speed/pagespeed/insights/

## Encryption HTTPS / SSL Related

How to get https right: https://certbot.eff.org/

Interfaces & Dependency Injection: https://stackoverflow.com/questions/52969037/nestjs-dependency-injection-and-ddd-clean-architecture

## NestJS Related

### Dependency Injection

As Interfaces are currently design time only, I needed to play a trick for mimicing Interface Polymorphism / Interface based Dependency Injection - can be checked in server/src/app.module.ts

## Docker Related
For starters [this video](https://www.youtube.com/watch?v=CsWoMpK3EtE) seems helpful.

## Shell / Bash Script Related

FILE=./.env.json
if [ -f "$FILE" ]; then
echo "I checked $FILE exists - let's go :)"
else
    echo '{"mode": "real"}' >> .env.json
    echo "I created $FILE with default values successfully"
fi