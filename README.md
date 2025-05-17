# iSprinklr React

iSprinklr React is a web frontend for the [iSprinklr API](https://github.com/mbsperry/iSprinklr_api). Built in React with minimal dependencies, it provides a control interface to turn sprinklers on and off, as well as a schedule interface to modify sprinkler schedules.

## Overview

iSprinklr uses an ESP32 to control a Hunter Pro-c sprinkler system.

There are 3 components:
- iSprinklr_esp (https://github.com/mbsperry/isprinklr_esp) is the ESP32 controller which has a very simple REST API for turning the sprinkler system on/off
- iSprinklr_api (https://github.com/mbsperry/isprinklr_api) is an API built with Python and FastAPI. It provides a much more powerful API for controlling the system including monitoring which system is active and running user created schedules.
- iSprinklr_react (https://github.com/mbsperry/iSprinklr_react) is the front end web app built in React. It provides a web interface for the API.

## iSprinklr_react Features
- User-friendly web interface for controlling your sprinkler system
- Real-time monitoring of system state (on, off, duration remaining)
- Control interface to manually turn sprinklers on and off
- View named sprinkler zones
- Create, edit, and run different schedules
- View system logs to help debug any connection issues

## Installation Steps
1. First, make sure you have the ESP32 controller (iSprinklr_esp) and API (iSprinklr_api) set up following their respective installation instructions.
2. Clone the repository: `git clone https://github.com/mbsperry/iSprinklr_react.git`
3. Install dependencies: `npm install`
4. Update the configuration: Edit `src/config.js` to point to your API server (the default is `127.0.0.1:8000`)
5. Development mode: Run the application in development mode with `npm start`
6. Production build: Build the application for production with `npm run build`
7. Deploy: Copy the built application from the build folder to your web server or use a tool like `serve` to host it locally

## Complete System Setup
For a complete setup of the iSprinklr system:
1. Build and install iSprinklr_esp using PlatformIO with your preferred network configuration. The ESP32 will print out its IP address to the serial monitor when it connects to the network. Make note of this IP.
2. Set up iSprinklr_api with the ESP32's IP address in its configuration file.
3. Set up iSprinklr_react (this project) pointing to the API server.
4. If you want to use the scheduling feature, make sure the cron job for the `scheduler.py` script is set up on the API server.

## Credit
iSprinklr_esp relies on the HunterRoam library from ecodina (https://github.com/ecodina/hunter-wifi) to control the Hunter Pro-c.

TODOs:
* Fix the schedule editor to allow editing multiple schedules