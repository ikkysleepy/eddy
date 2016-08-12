'use strict';

// ******************************************************************************** //
//                            Eddy (Voice Remote) Skill                             //
// ******************************************************************************** //
/**
 * Eddy (Voice Remote) Skill for Amazon Alexa
 * v 0.6 - August 12, 2016
 *
 * Requires an account on: https://eddy.tinyelectrons.com
 *
 * v 0.6 Repeat Max of 10, Adjusted shouldEndSession
 * v 0.5 Added Device Intent
 * v 0.4 Re-created script, fixed issue with accessToken
 * v 0.3 Fixed HTTPS Issue
 * v 0.2 Added STOP / Cancel
 *
 *
 * Test
 * -------------
 * open voice remote + help                                         => prompt for activity "What do you want to do?"
 * open voice remote                                                => prompt "You can say, ask Voice Remote What are my Activities. What do you you want to do?"
 * tell voice remote to Open Blue Ray                               => Null
 * tell voice remote to Watch TV                                    => Watch TV
 * tell voice remote to Press the Volume UP on my Sony 3 times      => Press Volume up on Sony 3 times
 * tell voice remote to Press the Volume UP on my Soundbar 3 times  => Press Volume up on TV 3 times
 *
 */
// ******************************************************************************** //

// **************************************** //
//             Libraries                    //
// **************************************** //

/*  Global Cache */
var Itach = require('./SimpleItach');

/*  Request HTTP */
var request = require('request');

// **************************************** //
//             Variables                    //
// **************************************** //

// Intents & Skill Info
var intents = ["WatchTVIntent","WatchMyShowIntent","WatchMovieIntent","ListenMusicIntnet","NetflixIntent","BedIntent","MorningIntent","NightIntent","SonosIntent","DVDIntent","AppleTVIntent","CableIntent","FireTVIntent","RokuIntent","GameIntent","PSThreeIntent","PSFourIntent","WiiIntent","XboxIntent","TVOnIntent","AudioOnIntent","TivoOnToggleIntent","DVROnToggleIntent","DVDOnToggleIntent","BluerayOnToggleIntent","TVOffIntent","AudioOffIntent","TivoOffToggleIntent","DVROffToggleIntent","DVDOffToggleIntent","BluerayOffToggleIntent","AllOffIntent","IncreaseVolumeIntent","DecreaseVolumeIntent","NextChannelIntent","PreviousChannelIntent","GoBackIntent","PauseIntent","PlayIntent","MuteIntent","FastForwardIntent","RewindIntent","NextIntent","SkipIntent"];
var SKILL_ID = "amzn1.echo-sdk-ams.app.194b7d6a-18e3-4c94-b4c9-6d921bd21a6d";
var TOKEN_URL = 'https://eddy.tinyelectrons.com/index.php/alexa/config?token=';

// ******************************************************************************** //
//                                      Core                                        //
// ******************************************************************************** //

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId !== SKILL_ID) {
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name,
        inArray = intents.indexOf(intentName) > -1;

    // dispatch custom intents to handlers here
    if ("ActivitiesIntent" === intentName) {
        handleActivitiesList(intent, session, callback);
    }else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    }else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    }else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    }else if ("DeviceIntent" === intentName) {
        handleButtonPress(intent, session, callback);
    }else if (inArray) {
        handleActivity(intent, session, callback);
    }else {
        handleFinishSessionRequest(intent, session, callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
}

// ******************************************************************************** //
//                             Skill specific business logic                        //
// ******************************************************************************** //

/**
 * Welcome Response
 *
 * @param callback
 */
function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = 'Welcome';
    var shouldEndSession = false;
    var speechOutput = "Welcome to Voice Remote, your Home IR Remote Companion.";
    var repromptText = "You can say, ask Voice Remote What are my Activities  or tell Voice Remote to Press the Power button on my TV. What do you you want to do?";

    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText
    };

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/** 
 * Activity List
 * 
 * @param intent
 * @param session
 * @param callback
 */
function handleActivitiesList(intent, session, callback) {
    var repromptText = "" ;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var size = 0;
    var myActivities;

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard('Your account is not linked. Please use the Alexa App to link the account.'));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    repromptText = "";
                    sessionAttributes = {};
                    speechOutput = "Your account link was removed from the companion website";

                    callback(sessionAttributes, buildSpeechletResponse("Account Removed", speechOutput, repromptText, shouldEndSession));
                }else {
                    // Loop through the list
                    var list = myResponse.activities;
                    var lastActivity = "";

                    for (var k in list) {
                        if (k !== 'error') {
                            var currentActivity = myResponse.activities.error[k];
                            if (myActivities) {
                                lastActivity = currentActivity['title'];
                                myActivities = myActivities + ", " + currentActivity['title'];
                            } else {
                                myActivities = currentActivity['title'];
                            }
                            size++;
                        }
                    }

                    if (size == 0) {
                        speechOutput = "No Activities Found. Please Add Activities on eddy dot tiny electrons dot com";
                    } else {
                        shouldEndSession = false;
                        if (size == 1) {
                            speechOutput = "Your Activity is: " + myActivities;
                            repromptText = "What Activity do you want to do?";
                        } else {
                            speechOutput = "Your Activities are: " + myActivities.replace(lastActivity, "and " + lastActivity);
                            repromptText = "What Activity do you want to do?";
                        }
                    }

                    callback(sessionAttributes, buildSpeechletResponse("Activity List", speechOutput, repromptText, shouldEndSession));
                }
            }else{
                repromptText = "";
                sessionAttributes = {};
                speechOutput = error;

                callback(sessionAttributes, buildSpeechletResponse(error, speechOutput, repromptText, shouldEndSession));
            }

        });

    }

}

/**
 * Activities
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleActivity(intent, session, callback){
    var intent_name = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    console.log(intent_name);

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard('Your account is not linked. Please use the Alexa App to link the account.'));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    repromptText = "";
                    sessionAttributes = {};
                    speechOutput = "Your account link was removed from the companion website";

                    callback(sessionAttributes, buildSpeechletResponse("Account Removed", speechOutput, repromptText, shouldEndSession));
                }else {

                    // Check if Intent Exist from the website
                    if(!myResponse.activities.hasOwnProperty(intent_name)){
                        // 4.3 Not relevant Response
                        callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));
                    }else {

                        var signals = myResponse.activities[intent_name];
                        var myActivity = myResponse.activities.error[intent_name];

                        var max = 0;
                        for (var k in signals) {
                            if (signals.hasOwnProperty(k)) {
                                ++max;
                            }
                        }

                        // Create Command Pair
                        var cmds = [];
                        for (var i = 0; i < max; i++) {
                            var cmd = signals[i][0];
                            var delay = Number(signals[i][1]) < 400 ? 400 : Number(signals[i][1]);
                            cmds.push(cmd + '\r', delay);
                        }

                        // Remove trailing delay
                        if (max > 1) {
                            cmds.pop();
                        }

                        // Send Signals to Global Cache
                        var itach = new Itach(myResponse.user.host, myResponse.user.port);
                        itach.send(cmds, function (err, res) {

                            console.log(cmds);
                            console.log(res);
                            console.log(err);

                            if (err) {
                                speechOutput = "Could not send signals to " + myActivity["title"] + "\nSignals: " + myActivity["count"];
                            } else {
                                speechOutput = "OK"
                            }

                            callback(sessionAttributes, buildSpeechletResponse(myActivity["title"], speechOutput, repromptText, shouldEndSession));
                        });

                    }

                }
            }else{
                repromptText = "";
                sessionAttributes = {};
                speechOutput = error;

                callback(sessionAttributes, buildSpeechletResponse("Error Getting Data", speechOutput, repromptText, shouldEndSession));
            }

        });

    }

}

/**
 * Devices
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleButtonPress(intent, session, callback){
    var device_type = intent.slots.device_type.value;
    var button_name = intent.slots.button_name.value;
    var device_brand = intent.slots.brand.value;
    var multiplier = typeof intent.slots.multiplier.value == "undefined" ? 1 : intent.slots.multiplier.value ;

    console.log("device_type: " + device_type + ", button_name: " + button_name + " device_brand: " + device_brand + " multiplier: " + multiplier);

    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard('Your account is not linked. Please use the Alexa App to link the account.'));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    repromptText = "";
                    sessionAttributes = {};
                    speechOutput = "Your account link was removed from the companion website";

                    callback(sessionAttributes, buildSpeechletResponse("Account Removed", speechOutput, repromptText, shouldEndSession));
                }else {

                    device_type = device_type ? device_type.trim().toLowerCase(): '';
                    button_name = button_name ? button_name.trim().toLowerCase(): '';
                    device_brand = device_brand ? device_brand.trim().toLowerCase(): '';

                    var match = [];
                    var matchButton = [];
                    var exactMatch = false;

                    // Check Current Device
                    for (var current_device in myResponse.devices) {

                        if (!myResponse.devices.hasOwnProperty(current_device)) continue;

                        // Loop through Brand
                        var brands = myResponse.devices[current_device];
                        for (var current_brand in brands) {
                            if(!brands.hasOwnProperty(current_brand)) continue;


                            // Loop through Buttons
                            var button = brands[current_brand];
                            for (var current_button in button) {
                                if (!button.hasOwnProperty(current_button)) continue;

                                    var myButton = myResponse.devices[current_device][current_brand][current_button];

                                    // Match Button
                                    var button_found = false;
                                    var tmp_current_button = current_button.trim().toLowerCase();
                                    if (tmp_current_button.indexOf(button_name) > -1) {
                                        button_found = true;
                                    }

                                    // Match Devices
                                    if(device_type){

                                        // Match Brand
                                        if(device_brand){
                                            var tmp_current_brand = current_brand.trim().toLowerCase();
                                            if (tmp_current_brand.indexOf(device_brand) > -1) {
                                                if(button_found && !exactMatch){
                                                    // Device + Brand + Button Found
                                                    var obj = {
                                                        match: true,
                                                        device_found: true,
                                                        brand_found: true,
                                                        button_found: true,
                                                        device: current_device,
                                                        brand: current_brand,
                                                        button: current_button,
                                                        signal: myButton
                                                    };
                                                    match.push(obj);
                                                    exactMatch = true;
                                                }
                                            }else{
                                                // Couldn't match Brand?
                                                if(button_found && !exactMatch){
                                                    var obj = {
                                                        match: true,
                                                        device_found: false,
                                                        brand_found: true,
                                                        button_found: true,
                                                        device: current_device,
                                                        brand: current_brand,
                                                        button: current_button,
                                                        signal: myButton
                                                    };
                                                    matchButton.push(obj);
                                                }
                                            }
                                        }else{
                                            // Match Device + Button
                                            var tmp_current_device = current_device.trim().toLowerCase();
                                            if (tmp_current_device.indexOf(device_type) > -1) {
                                                if(button_found && !exactMatch){
                                                    // Device + Button Found
                                                    var obj = {
                                                        match: true,
                                                        device_found: true,
                                                        brand_found: false,
                                                        button_found: true,
                                                        device: current_device,
                                                        button: current_button,
                                                        signal: myButton
                                                    };
                                                    match.push(obj);
                                                    exactMatch = true;
                                                }
                                            }else{
                                                if(button_found && !exactMatch){
                                                    // Brand + Button Found
                                                    var obj = {
                                                        match: true,
                                                        device_found: false,
                                                        brand_found: false,
                                                        button_found: true,
                                                        device: current_device,
                                                        brand: current_brand,
                                                        button: current_button,
                                                        signal: myButton
                                                    };
                                                    matchButton.push(obj);
                                                }
                                            }
                                        }

                                    }else{
                                        var tmp_current_brand = current_brand.trim().toLowerCase();
                                        if (tmp_current_brand.indexOf(device_brand) > -1) {
                                            if(button_found && !exactMatch){
                                                // Brand + Button Found
                                                var obj = {
                                                    match: true,
                                                    device_found: false,
                                                    brand_found: true,
                                                    button_found: true,
                                                    device: current_device,
                                                    brand: current_brand,
                                                    button: current_button,
                                                    signal: myButton
                                                };
                                                match.push(obj);
                                                exactMatch = true;
                                            }
                                        }else{
                                            if(button_found && !exactMatch){
                                                var obj = {
                                                    match: true,
                                                    device_found: false,
                                                    brand_found: true,
                                                    button_found: true,
                                                    device: current_device,
                                                    brand: current_brand,
                                                    button: current_button,
                                                    signal: myButton
                                                };
                                                matchButton.push(obj);
                                            }
                                        }
                                    }

                            }

                        }
                    }

                    // Matched anything?
                    if(match.length == 1){
                        if( match[0]['match']){

                            // Cap at 10 repeats
                            if(multiplier > 10){
                                multiplier = 10
                            }

                            // Repeat Signal?
                            var cmds = [];
                            for(var y = 0; y < multiplier; y++)
                            {
                                var cmd = match[0]['signal'][0];
                                var delay = Number(match[0]['signal'][1]) < 400 ? 400 : Number(match[0]['signal'][1]);
                                cmds.push(cmd + '\r', delay);
                            }


                            // Remove trailing delay
                            if (multiplier > 1) {
                                cmds.pop();
                            }

                            // Send Signals to Global Cache
                            var itach = new Itach(myResponse.user.host, myResponse.user.port);
                            itach.send(cmds, function (err, res) {

                                console.log(cmds);
                                console.log(res);
                                console.log(err);

                                if (err) {
                                    speechOutput = "Could not send signals to " + match[0]["device"] + "\nButton: " + match[0]["button"];
                                } else {
                                    speechOutput = "OK"
                                }

                                callback(sessionAttributes, buildSpeechletResponse(match[0]["button"], speechOutput, repromptText, shouldEndSession));
                            });

                        }

                    }else{

                        if(matchButton.length > 0) {
                            callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));

                            //if (device_brand) {
                            //    speechOutput = "I found " + matchButton.length + " matches for pressing the " + button_name + " on your " +  device_brand + " " + device_type + " <break time='1s'/>\n";
                            //} else {
                            //    speechOutput = "I found " + matchButton.length + " matches for pressing the " + button_name + " on your " + device_type + "  <break time='1s'/>\n";
                            //}
                            //
                            //var msg = '';
                            //for (var x = 0; x < matchButton.length; x++) {
                            //    msg += (x + 1) + "<break time='1s'/> " + matchButton[x]['brand'] + " " + matchButton[x]['device'] + "<break time='1s'/>\n";
                            //}
                            //
                            //callback(sessionAttributes, buildSpeechletResponse("Error Pressing Button", speechOutput + msg, repromptText, shouldEndSession));

                        }else{
                            callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));
                        }

                    }

                }
            }else{
                repromptText = "";
                sessionAttributes = {};
                speechOutput = error;

                callback(sessionAttributes, buildSpeechletResponse("Error Pressing Button", speechOutput, repromptText, shouldEndSession));
            }

        });

    }

}

/**
 * Help
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleGetHelpRequest(intent, session, callback) {
    var speechOutput = "You can say, ask Voice Remote, What are my Activities, or, tell Voice Remote to Press the Power button on my TV",
        repromptText = "What do you want to do?";
    var shouldEndSession = false;

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

/**
 * Finish Session
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleFinishSessionRequest(intent, session, callback) {
    callback(session.attributes, buildSpeechletResponseWithoutCard("Thanks for using Voice Remote!", "", true));
}

// ******************************************************************************** //
//                         Helper functions to build responses                      //
// ******************************************************************************** //

/**
 *
 * @param title
 * @param output
 * @param repromptText
 * @param shouldEndSession
 * @returns {{outputSpeech: {type: string, text: *}, card: {type: string, title: *, content: *}, reprompt: {outputSpeech: {type: string, text: *}}, shouldEndSession: *}}
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

/**
 *
 * @param output
 * @param repromptText
 * @param shouldEndSession
 * @returns {{outputSpeech: {type: string, text: *}, reprompt: {outputSpeech: {type: string, text: *}}, shouldEndSession: *}}
 */
function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

/**
 *
 * @param sessionAttributes
 * @param speechletResponse
 * @returns {{version: string, sessionAttributes: *, response: *}}
 */
function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

/**
 *
 * @param output
 * @returns {{version: string, response: {outputSpeech: {type: string, text: *}, card: {type: string}, shouldEndSession: boolean}}}
 */
function buildLinkCard (output) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        "card": {
            "type": "LinkAccount"
        },
        shouldEndSession: true
    }
}