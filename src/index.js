'use strict';
// User Data
var data = {};

/**
 * App ID for the skill
 */
var APP_ID =  "amzn1.echo-sdk-ams.app.[APP_ID]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * The iTach Module
 */
var Itach = require('./SimpleItach');
var itach = new Itach(data.user.host,data.user.port);

/**
 * Eddy is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Eddy = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Eddy.prototype = Object.create(AlexaSkill.prototype);
Eddy.prototype.constructor = Eddy;

Eddy.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Eddy onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Eddy.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Eddy onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to Eddy, your Home IR Remote Companion.";
    var repromptText = "You can say, ask Eddy What are my Activities or Watch TV. What do you you want to do?";
    response.ask(speechOutput, repromptText);
};

Eddy.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Eddy onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

Eddy.prototype.intentHandlers = {
    // register custom intent handlers
    "ActivitiesIntent": function (intent, session, response) {activities(intent, session, response);return false;},
    "WatchTVIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "WatchMovieIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "ListenMusicIntnet": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "NetflixIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "BedIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "MorningIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "NightIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "SonosIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DVDIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "AppleTVIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "CableIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "FireTVIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "RokuIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "GameIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "PSThreeIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "PSFourIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "WiiIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "XboxIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "TVOnIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "AudioOnIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "TivoOnToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DVROnToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DVDOnToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "BluerayOnToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "TVOffIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "AudioOffIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "WatchMyShowIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DVROffToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DVDOffToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "BluerayOffToggleIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "AllOffIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "IncreaseVolumeIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "DecreaseVolumeIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "NextChannelIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "PreviousChannelIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "GoBackIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "PauseIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "PlayIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "MuteIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "FastForwardIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "RewindIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "NextIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "SkipIntent": function (intent, session, response) {sendIR(intent, session, response);return false;},
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say, tell Eddy to Watch TV!", "You can say other activities for Eddy to execute.");
    }
};

// Activities
function activities(intent, session, response) {
    var list = data.activities;

    console.log(list);
    console.log(data.activities);

    var size = 0;
    var myActivities;
    for (var k in list) {
        if (k !== 'error') {
            var error = data.activities.error[k];
            if(myActivities) {
                myActivities = myActivities + ", " + error['title'];
            }else{
                myActivities = error['title'];
            }
            size++;
        }
    }

    if(size == 0) {
        response.tell("No Activities Found. Please Add Activites on eddy.tinyelectrons.com");
    }else{
        if(size == 1){
            var speechOutput = "Your Activity is: " + myActivities;
            var repromptText = "What Activity do you want to do?";
            response.ask(speechOutput, repromptText);
        }else{
            var speechOutput = "Your Activities are: " + myActivities;
            var repromptText = "What Activity do you want to do?";
            response.ask(speechOutput, repromptText);

        }
    }

}
// send IR Helper
function sendIR(intent, session, response){
    var intent_name = intent.name;

    if (typeof data.activities[intent_name] != "undefined") {

        var signals = data.activities[intent_name];
        var error = data.activities.error[intent_name];

        var max = 0;
        for (var k in signals) {
            if (signals.hasOwnProperty(k)) {
                ++max;
            }
        }

        // Create Commands
        var cmds = [];
        for (var i = 0; i < max; i++) {
            var cmd = signals[i][0];
            var delay = signals[i][1];
            cmds.push(cmd + '\r', delay);
        }

        var accessToken = session.accessToken;
        accessToken = true;
        if (accessToken === null) {
            response.linkAccount().shouldEndSession(true).say('Your Eddy account is not linked. Please use the Alexa App to link the account.');
            return true;
        } else {

            var sendIR = itach.send(cmds, function (err, res) {
                if (err) {
                    var msg = "Could not send signals to " + error["title"] + "\nSignal: " + error["count"];
                    response.tellWithCard("Error", msg, error["title"]);
                } else {
                    response.tellWithCard("OK", "Eddy", error["title"]);
                }
            });

        }
    }else{
        var speechOutput = "Activity is not set.";
        var repromptText = "You can say, ask Eddy What are my Activities or Watch TV. What do you you want to do?";
        response.ask(speechOutput, repromptText);
    }

}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Eddy skill.
    var eddy = new Eddy();
    eddy.execute(event, context);
};