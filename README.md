# iSprinklr React

iSprinklr React is a web frontend for the [iSprinklr API](https://github.com/mbsperry/isprinklr_api). Built in react with minimal dependencies it provides a control interface to turn sprinklers on and off, as well as a schedule interface to modify sprinkler schedules. 

## iSprinklr project

iSprinklr uses an arduino to control a Hunter Pro-c sprinkler system.

There are 3 components:
- iSprinklr_arduino (https://github.com/mbsperry/iSprinklr_arduino) is self expalanatory and runs on the arduino. It accepts commands from a serial interface. 
- iSprinklr_api (https://github.com/mbsperry/isprinklr_api) is an API build with python and FastAPI. It provides a RESTful interface for serial control of the arduino.
- iSprinklr_react (https://github.com/mbsperry/iSprinklr_react) is the front end web app built in react. It provides a web interface for the API.

## Installation

iSprinklr React was built using Create React App, so installation is fairly basic. 
- Clone the repository
- Install dependencies with `npm install`
- Run the application in development mode with `npm start`
- Build the application for production with `npm run build`
- Copy the built application from the build folder to wherever you want to serve it from.
