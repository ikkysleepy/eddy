'use strict';
/**
 * Eddy Skill for Alexa
 *
 * Author: Jorge Corona
 * Version: 0.1 (March 30, 2016)
 *
 * Requires an account on: https://eddy.tinyelectrons.com
 *
 */
// **************************************** //
//               User Config                //
// **************************************** //

/**
 * App ID for the skill
 */
var APP_ID =  "amzn1.echo-sdk-ams.app.[APP_ID]";

// ******************************************************************************** //
//                           Eddy Skill Functions                                   //
// ******************************************************************************** //

// **************************************** //
//                  Vars                    //
// **************************************** //

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var debug = false;

/**
 * The iTach Module
 */
var Itach = require('./SimpleItach');
var itach;

/**
 *  Dyamodb
 */
var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var tableName = 'eddy';

/**
 *  Request HTTP
 */
var request = require('request');

// Intents & Eddy Data Json
var intents = ["WatchTVIntent","WatchMovieIntent","ListenMusicIntnet","NetflixIntent","BedIntent","MorningIntent","NightIntent","SonosIntent","DVDIntent","AppleTVIntent","CableIntent","FireTVIntent","RokuIntent","GameIntent","PSThreeIntent","PSFourIntent","WiiIntent","XboxIntent","TVOnIntent","AudioOnIntent","TivoOnToggleIntent","DVROnToggleIntent","DVDOnToggleIntent","BluerayOnToggleIntent","TVOffIntent","AudioOffIntent","TivoOffToggleIntent","DVROffToggleIntent","DVDOffToggleIntent","BluerayOffToggleIntent","AllOffIntent","IncreaseVolumeIntent","DecreaseVolumeIntent","NextChannelIntent","PreviousChannelIntent","GoBackIntent","PauseIntent","PlayIntent","MuteIntent","FastForwardIntent","RewindIntent","NextIntent","SkipIntent"];
var eddyData = {};

// **************************************** //
//                  Alexa                   //
// **************************************** //

// Create the handler that responds to the Alexa Request.
exports.handler = function(event, context) {
    try {
        if(debug) console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        if(debug) console.log('Calling App');

        if (event.session.new) {onSessionStarted({requestId: event.request.requestId}, event.session);}
        getUserData(event, context, onUserDataLoad);


    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    if(debug) console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * on Launch
 * @param userData
 * @param launchRequest
 * @param session
 * @param context
 */
function onLaunch(userData, launchRequest, session, context) {
    if(debug) console.log("Eddy onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to Eddy, your Home IR Remote Companion.";
    var repromptText = "You can say, ask Eddy What are my Activities or Watch TV. What do you you want to do?";
    response.ask(speechOutput, repromptText);
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    if(debug) console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

/**
 *  Called when ending Skill
 * @param callback
 */
function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you for trying Eddy. Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession, {}));
}

/**
 *  Build Speech Response
 * @param title
 * @param cardText
 * @param output
 * @param repromptText
 * @param shouldEndSession
 * @param attributes
 * @returns {{version: string, sessionAttributes: *, response: {outputSpeech: {type: string, text: *}, card: {type: string, title: *, text: *}, reprompt: {outputSpeech: {type: string, text: *}}, shouldEndSession: *}}}
 */
function buildSpeechletResponse(title, cardText, output, repromptText, shouldEndSession, attributes) {
    return {
        version: "1.0",
        sessionAttributes: attributes,
        response: {
            outputSpeech: {
                type: "PlainText",
                text: output
            },
            card: {
                type: "Simple",
                title: title,
                text: cardText
            },
            reprompt: {
                outputSpeech: {
                    type: "PlainText",
                    text: repromptText
                }
            },
            shouldEndSession: shouldEndSession
        }
    };
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(userData, intentRequest, session, context) {
    if(debug) console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intentName = intentRequest.intent.name;
    var inArray = intents.indexOf(intentName) > -1 ? true:false;
    if(debug) console.log(inArray);
    if(debug) console.log(intentName);

    // Dispatch to your skill's intent handlers
    if ("ActivitiesIntent" === intentName) {
        handleActivities(userData,intentRequest, session, context);
    } else if ("LinkIntent" === intentName) {
        handleLink(userData, intentRequest, session, context);
    } else if ("RemoveLinkIntent" === intentName) {
        handleRemoveLink(userData, intentRequest, session, context);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleYesRemoveLink(userData, intentRequest, session, context);
    }else if ("AMAZON.NoIntent" === intentName) {
        handleNoRemoveLink(userData, intentRequest, session, context);
    }else if ("PinIntent" === intentName) {
        handlePin(userData, intentRequest, session, context);
    } else if (inArray) {
        handleSendIR(userData, intentRequest, session, context);
    } else {
        throw "Invalid intent";
    }
}

// **************************************** //
//                  Intents                //
// **************************************** //

/**
 *  Verify Remove Link
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleRemoveLink(userData, intentRequest, session, context){

    var url = '';
    if (typeof userData.Item.url != "undefined") {
        url  = userData.Item.url;
    }

    // Check if account is still linked
    if(url.length > 0) {
        var cardTitle = 'Verify Removal of Linked Account';
        var cardText = 'Are you sure you wish to Unlink Account?';
        var sessionAttributes = {};
        var shouldEndSession = false;
        var speechOutput = "";
        var repromptText = "Are you sure you wish to Unlink Account? Yes or No";
        var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
        context.succeed(response);
    }else{
        var cardTitle = 'Account is not Linked';
        var cardText = 'Alexa is not linked with Eddy';
        var sessionAttributes = {};
        var shouldEndSession = true;
        var speechOutput = "Account is not Linked";
        var repromptText = "";
        var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
        context.succeed(response);
    }
}

/**
 *  Yes, Remove Account Link
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleYesRemoveLink(userData, intentRequest, session, context){
    var cardTitle = 'Removed Account Link';
    var cardText = 'Alexa is no longer linked with Eddy';
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "Removed Account Link.";
    var repromptText = "You can Re-Link account by saying Link Account. What do you want to do?";
    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
    unlinkAccount(userData, context, response);
}

/**
 *  No, Do Not Remove Link
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleNoRemoveLink(userData, intentRequest, session, context){
    var cardTitle = 'Eddy Loves You';
    var cardText = 'Eddy is still linked with Alexa';
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "Account is still linked with Eddy";
    var repromptText = "";
    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
    context.succeed(response);
}

/**
 *  Check Link Pin
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleLink(userData, intentRequest, session, context){

    // Check url property exist
    if (typeof userData.Item.url != "undefined") {
        var url = userData.Item.url;

        // Check if Account is linked
        if (url.length > 0) {
            var cardTitle = 'Account Already Linked';
            var cardText = 'Alexa is already linked with Eddy';
            var sessionAttributes = {};
            var shouldEndSession = false;
            var speechOutput = "Your Account is already linked";
            var repromptText = "You can remove Account Link by saying: Remove Account Link. What to do you want to do?";
            var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
            context.succeed(response);
        }
    }else {
            var pin = intentRequest.intent.slots.pin.value;

            // Check Pin
            if (pin){
                handleLinkAccount(userData, intentRequest, session, context);
            } else {
            handleNoSlotDialogRequest(userData, intentRequest, session, context);
            }
        }

}

/**
 *  Called on Pin Intent
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handlePin(userData, intentRequest, session, context) {
    if(debug) console.log(session.attributes);
    if(session.attributes){
        handleLink(userData, intentRequest, session, context);
    }
}

/**
 * Called on when trying to Link Account
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleLinkAccount(userData, intentRequest, session, context){
    var cardTitle = 'Account Linked';
    var cardText = 'Alexa is now linked with Eddy';
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    var repromptText = "";
    var pin = intentRequest.intent.slots.pin.value;

    if (debug) console.log('my pin is:'+pin);
    // Validate Pin
    request.post(
        'https://eddy.tinyelectrons.com/alexa/config',
        { form: { pin: pin } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var jsonResponse = JSON.parse(body);

                if (typeof jsonResponse.url != "undefined") {

                    speechOutput = "Account Linked.";
                    repromptText = "You can say, What are my Activities or Watch TV. What do you you want to do?";
                    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);

                    // Save User Data
                    if (debug) console.log('done saving');

                    userData.Item.url = jsonResponse.url;
                    saveAndExit(userData, context, response);
                }else{
                    speechOutput = "Failed to Link Account";
                    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
                    context.succeed(response)
                }
            }

            if(error){
                if (debug) console.log('error');
                if (debug) console.log(error);
                speechOutput = "Failed to Link Account";
                var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
                context.succeed(response);

            }
        }
    );

}

/**
 * Called when Link Account has no Pin
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleNoSlotDialogRequest(userData, intentRequest, session, context) {
    var pin = intentRequest.intent.slots.pin.value;
    
    // Check Pin
    if (!pin) {
        // No Pin Slot
        var cardTitle = 'Account Pin';
        var cardText = 'Please say your Account Pin, found in Eddy\'s Companion website';
        var sessionAttributes = {'pinAsked':true};
        var shouldEndSession = false;
        var repromptText = "Please say your Account Pin.";
        var speechOutput = repromptText;
        var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
        context.succeed(response);
    } else {
        // Get Pin re-prompt
        handleLinkAccount(intent, session, response);
    }
}

/**
 * Called on Activities Intent
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 */
function handleActivities(userData, intentRequest, session, context) {
    var list = eddyData.activities;
    var cardTitle = 'My Activities';
    var cardText = '';
    var repromptText = " " ;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    var size = 0;
    var myActivities;

    var url = '';
    if (typeof userData.Item.url != "undefined") {
        url  = userData.Item.url;
    }

    if(url.length > 0) {
        // Loop thorugh the list
        for (var k in list) {
            if (k !== 'error') {
                var error = eddyData.activities.error[k];
                if (myActivities) {
                    myActivities = myActivities + ", " + error['title'];
                } else {
                    myActivities = error['title'];
                }
                size++;
            }
        }

        if (size == 0) {
            speechOutput = "No Activities Found. Please Add Activities on eddy.tinyelectrons.com";
            shouldEndSession = true;
        } else {
            if (size == 1) {
                speechOutput = "Your Activity is: " + myActivities;
                repromptText = "What Activity do you want to do?";
            } else {
                speechOutput = "Your Activities are: " + myActivities;
                repromptText = "What Activity do you want to do?";
            }
        }
    }else{
        speechOutput = "Your Account is Not Linked";
        repromptText = "To link account, say Link Account";
    }

    cardText = speechOutput;
    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
    context.succeed(response);
}

/**
 * Called on Activity Intent such as Watch TV, etc.
 * @param userData
 * @param intentRequest
 * @param session
 * @param context
 * @returns {boolean}
 */
function handleSendIR(userData, intentRequest, session, context){
    var intent_name = intentRequest.intent.name;
    var cardTitle = intent_name;
    var cardText = '';
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    // Check if user has the account linked
    if (typeof userData.Item.url != "undefined") {
        var url  = userData.Item.url;

        if (typeof eddyData.activities[intent_name] != "undefined") {

            var signals = eddyData.activities[intent_name];
            var error = eddyData.activities.error[intent_name];

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
                var delay = Number(signals[i][1]) < 400 ? 400: Number(signals[i][1]);
                cmds.push(cmd + '\r', delay);
            }

            // Remove trailing delay
            if(max > 1){
                cmds.pop();
            }

            var accessToken = session.accessToken;
            accessToken = true;
            if (accessToken === null) {
                response.linkAccount().shouldEndSession(true).say('Your Eddy account is not linked. Please use the Alexa App to link the account.');
                return true;
            } else {

                itach.send(cmds, function (err, res) {
                    if (err) {
                        speechOutput = "Could not send signals to " + error["title"] + "\nSignals: " + error["count"];
                        cardTitle = error["title"];
                    } else {
                        cardTitle = error["title"];
                        speechOutput = "OK"
                    }

                    cardText = speechOutput;
                    var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
                    context.succeed(response);
                });
            }
        } else {
            speechOutput = "Activity is not set.";
            repromptText = "You can say, ask Eddy What are my Activities or Watch TV. What do you you want to do?";
            cardText = speechOutput + 'To Set Activity go to Eddy\'s companion website';
            var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
            context.succeed(response);
        }
    }else{
        speechOutput = "Your Account is Not Linked";
        repromptText = "To link account, say Link Account";
        shouldEndSession = false;
        cardText = speechOutput;
        var response = buildSpeechletResponse(cardTitle, cardText, speechOutput, repromptText, shouldEndSession, sessionAttributes);
        context.succeed(response);
    }

}


// **************************************** //
//                  Database                //
// **************************************** //

/**
 *  User DB
 * @param event
 * @param context
 * @param userData
 */
function onUserDataLoad(event, context, userData) {
    if(debug) console.log('After User load: ' + event.request.type);
    if (event.request.type === "LaunchRequest") {
        onLaunch(userData, event.request, event.session, context);

    } else if (event.request.type === "IntentRequest") {
        onIntent(userData, event.request, event.session, context);

    } else if (event.request.type === "SessionEndedRequest") {
        onSessionEnded(event.request, event.session);
        context.succeed();
    }
}

/**
 *  Get User Data
 * @param event
 * @param context
 * @param callback
 */
function getUserData(event, context, callback) {
    // Check if the user ID has an entry on DB. If not, need to create new one.
    // If exists, start a new barbecue.
    if(debug) console.log('Get User Data = ' + event.session.user.userId);

    var params = {
        TableName: tableName,
        Key: {
            userId: event.session.user.userId
        }
    };
    dynamo.getItem(params, function(err, data) {
        if (err) {
            if(debug) console.log('Error GET Handler: ' + err);
            context.fail("Exception: " + err);
        } else {
            if(debug) console.log('Got User Data' + JSON.stringify(data));
            if (!data.Item) {
                if(debug) console.log('New User, creating data');
                data = {
                    Item: {
                        userId: event.session.user.userId
                    }
                }
                callback(event, context, data);
            } else {
                if(debug) console.log('Existing User');

                if (typeof data.Item.url != "undefined") {
                    var url = data.Item.url;

                    request(url, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            // Set Eddy Data
                            eddyData = JSON.parse(body);
                            itach = new Itach(eddyData.user.host,eddyData.user.port);

                            // Return Data
                            data.Item.eddyData = eddyData;
                            callback(event, context, data);
                        }
                    });
                }
            }

        }
    });
}

/**
 *  Save User Data
 * @param userData
 * @param context
 * @param response
 */
function saveAndExit(userData, context, response) {
    if(debug) console.log('Saving: ' + JSON.stringify(userData));
    var params = {
        TableName: tableName,
        Item: userData.Item
    };

    if(debug) console.log('Saving: ' + JSON.stringify(params));
    dynamo.putItem(params, function(err, data) {
        if (err) {
            if(debug)  console.log('Error Save Handler: ' + err);
            context.fail("Exception: " + err);
        } else {
            context.succeed(response);
        }
    });
}

/**
 *  Unlink Account
 * @param userData
 * @param context
 * @param response
 */
function unlinkAccount(userData, context, response) {
    delete  userData.Item.url;
    if(debug) console.log('removing link: ' + JSON.stringify(userData));
    var params = {
        TableName: tableName,
        Item: userData.Item
    };

    if(debug) console.log('Saving: ' + JSON.stringify(params));
    dynamo.putItem(params, function(err, data) {
        if (err) {
            if(debug) console.log('Error Save Handler: ' + err);
            context.fail("Exception: " + err);
        } else {
            context.succeed(response);
        }
    });
}
