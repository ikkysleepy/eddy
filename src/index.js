'use strict';

// ******************************************************************************** //
//                            Eddy (Voice Remote) Skill                             //
// ******************************************************************************** //
/**
 * Eddy (Voice Remote) Skill for Amazon Alexa
 * v 0.12 - August 24, 2016
 *
 * Requires an account on: https://eddy.tinyelectrons.com
 *
 * Notes:
 * Moved Speech Text Outside Functions & fixed Reprompt
 *
 * Test
 * -------------
 * open voice remote + help                                         => prompt for activity "What do you want to do?"
 * open voice remote                                                => prompt "You can say, ask Voice Remote What are my Activities. What do you you want to do?"
 * tell voice remote to Open Blue Ray                               => Null
 * tell voice remote to Watch TV                                    => Watch TV
 * tell voice remote to Press the Volume UP on my Sony 3 times      => Press Volume up on Sony 3 times
 * tell voice remote to Press the Volume UP on my Soundbar 3 times  => Press Volume up on TV 3 times
 * tell voice remote to Go to CBS                                   => Goes to 5-1
 * tell voice remote to Go to Channel ABS                           => Goes to 7-1
 *
 */
// ******************************************************************************** //

// **************************************** //
//             Libraries                    //
// **************************************** //

/*  Global Cache */
//noinspection JSUnresolvedFunction
var Itach = require('./SimpleItach');

/*  Request HTTP */
//noinspection JSUnresolvedFunction
var request = require('request');

// **************************************** //
//             Variables                    //
// **************************************** //

// Intents & Skill Info
var intents = ["WatchTVIntent","WatchSportsIntent","ExitIntent","HomeIntent", "LiveIntent","WatchMyShowIntent","WatchMovieIntent","ListenMusicIntnet","NetflixIntent","PlexIntent","BedIntent","MorningIntent","NightIntent","SonosIntent","DVDIntent","AppleTVIntent","CableIntent","FireTVIntent","RokuIntent","GameIntent","PSThreeIntent","PSFourIntent","WiiIntent","XboxIntent","TVOnIntent","AudioOnIntent","TivoOnToggleIntent","DVROnToggleIntent","DVDOnToggleIntent","BluerayOnToggleIntent","TVOffIntent","AudioOffIntent","TivoOffToggleIntent","DVROffToggleIntent","DVDOffToggleIntent","BluerayOffToggleIntent","AllOffIntent","IncreaseVolumeIntent","DecreaseVolumeIntent","NextChannelIntent","PreviousChannelIntent","GoBackIntent","PauseIntent","PlayIntent","MuteIntent","FastForwardIntent","RewindIntent","NextIntent","SkipIntent"];
var SKILL_ID = "amzn1.echo-sdk-ams.app.194b7d6a-18e3-4c94-b4c9-6d921bd21a6d";
var TOKEN_URL = 'https://eddy.tinyelectrons.com/index.php/alexa/config?token=';
var SERVER_TIMEOUT = 4000;

// **************************************** //
//             Speech Values                //
// **************************************** //
// Welcome
var welcomeCard = "Welcome";
var welcomeSpeech =  "Welcome to Voice Remote, your Home IR Remote Companion. You can ask Voice Remote, What are my Activities. What do you you want to do?";
var welcomeSpeechReprompt = "To hear a full list of commands you can say, please say Help";

// Activity List
var activityListCard = "Activity List";
var activityListOneSpeech = "Your Activity is: ";
var activityListMultipleSpeech = "Your Activities are: ";
var activityListPostSpeech = ". What Activity do you want to go to?";
var activityListNoneSpeech  = "No Activities Found. Please Add Activities on eddy dot tiny electrons dot com";
var activityListSpeechReprompt = "You can call an Activity by saying the Activity name, such as ";

// Activity
// Ok

// Channel List
var channelListCard = "Channel List";
var channelListOneSpeech = "Your Channel is: ";
var channelListSpeechReprompt = "You can go to a channel by saying, Go to Channel ";
var channelListMultipleSpeech = "Your Channels are: ";
var channelListPostSpeech = ". What Channel do you want to go to?";
var channelListNoneSpeech = "No Channels Found. Please Add Channels on eddy dot tiny electrons dot com";

// Channel Blank
var channelNullCard = "No Channel Specified";
var channelNullSpeech = "I'm not sure what Channel you want to go to. You can say go to Channel ABC?";
var channelNullSpeechReprompt = "I'm not sure what Channel you want to go to, please try again";

// Channel Bad
var channelBadCard = "Channel Not Found";
var channelBadSpeech = " channel was not found on the companion website. Try another channel";
var channelBadSpeechReprompt = "What Channel do you want to go to?";

// General Error Messages
var noSignalSpeech = "Could not send signals to ";
var okSpeech = "OK";
var accountNotLinkedSpeech  = "Your account is not linked. Please use the Alexa App to link the account.";

var serverTimeOutCard = "Server Timed Out";
var serverTimeOutSpeech = "The Companion website timed out. Please try again";

var accountRemovedCard = "Account Removed";
var accountRemovedSpeech = "Your account link was removed from the companion website";

var errorCard = "Error Getting Data";
var errorSpeech = "Error Getting Data. Please try again";

// Help Text
var helpSpeech = "<speak>There are 5 core commands you can say: <break time='1s'/>\
                        1 <break time='1s'/> What are my Activities? <break time='1s'/> \
                        2 <break time='1s'/> Call Activity by name, such as  <break time='1s'/> \
                           Watch TV or  <break time='1s'/>\
                           Increase Volume  <break time='1s'/>\
                        3 <break time='1s'/> Press any button on your device, by saying  <break time='1s'/> \
                           Press Volume button on my Soundbar  <break time='1s'/>  or \
                           Press Volume button on my Sony 5 Times <break time='1s'/> \
                        4 <break time='1s'/> Get a list of Channels by saying  <break time='1s'/> \
                           List My Channels<break time='1s'/> \
                        and the last command you can say is  <break time='1s'/> \
                        5 <break time='1s'/> Change Channel, by saying <break time='1s'/> \
                            Go to ABC <break time='1s'/> or \
                            <break time='1s'/> Go to Fox Channel\
                            <break time = '1s'/>\
                            What do you want to do?</speak>";
var helpSpeechReprompt = "<speak>What do you want to do?</speak>";

var finishCard = "Thanks for using Voice Remote!";

// ******************************************************************************** //
//                                      Core                                        //
// ******************************************************************************** //

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
/** @namespace event.session.application */
/** @namespace event.session.application.applicationId */
/** @namespace event.session */
/** @namespace event.session.new */
//noinspection JSUnresolvedVariable
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId !== SKILL_ID) {
            //noinspection JSUnresolvedFunction
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    //noinspection JSUnresolvedFunction
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    //noinspection JSUnresolvedFunction
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            //noinspection JSUnresolvedFunction
            context.succeed();
        }
    } catch (e) {
        //noinspection JSUnresolvedFunction
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

/** @namespace intentRequest.intent */
/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent="+intentRequest.intent.name+ ", requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name,
        inArray = intents.indexOf(intentName) > -1;

    // dispatch custom intents to handlers here
    if ("ActivitiesIntent" === intentName) {
        handleActivitiesList(intent, session, callback);
    }else if ("ChannelListIntent" === intentName) {
        handleChannelList(intent, session, callback);
    }else if ("AMAZON.HelpIntent" === intentName || "HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    }else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    }else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    }else if ("DeviceIntent" === intentName) {
        handleButtonPress(intent, session, callback);
    }else if ("ChannelIntent" === intentName) {
        handleChannel(intent, session, callback);
    }else if (inArray) {
        handleActivity(intent, session, callback);
    }else {
        handleFinishSessionRequest(intent, session, callback);
    }
}

/** @namespace session.sessionId */
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
    var cardTitle = welcomeCard;
    var speechOutput = welcomeSpeech;
    var repromptText = welcomeSpeechReprompt;
    var shouldEndSession = false;
    var sessionAttributes = {};

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/** @namespace myResponse.activities */
/** @namespace myResponse.activities.error */
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

    console.log(intent.name);

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard(accountNotLinkedSpeech));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url, {timeout: SERVER_TIMEOUT}, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    speechOutput = accountRemovedSpeech;

                    callback(sessionAttributes, buildSpeechletResponse(accountRemovedCard, speechOutput, repromptText, shouldEndSession));
                }else {
                    // Loop through the list
                    var list = myResponse.activities;
                    var lastActivity = "";

                    for (var k in list) {
                        if (k !== 'error') {
                            if(myResponse.activities.error.hasOwnProperty(k)) {
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
                    }

                    if (size == 0) {
                        speechOutput = activityListNoneSpeech;
                    } else {
                        shouldEndSession = false;
                        if (size == 1) {
                            speechOutput = activityListOneSpeech + myActivities + activityListPostSpeech;
                            repromptText = activityListSpeechReprompt + myActivities;

                        } else {
                            speechOutput = activityListMultipleSpeech + myActivities.replace(lastActivity, "and " + lastActivity) + activityListPostSpeech;
                            repromptText = activityListSpeechReprompt + lastActivity;
                        }
                    }

                    var response = buildSpeechletResponse(activityListCard, speechOutput, repromptText, shouldEndSession);
                    if(myResponse.user.debug) {console.log(response);}
                    callback(sessionAttributes, response);
                }
            }else{
                
                if (error.code=== 'ETIMEDOUT') {
                    callback(sessionAttributes, buildSpeechletResponse(serverTimeOutCard, serverTimeOutSpeech, repromptText, shouldEndSession));
                }else{
                    callback(sessionAttributes, buildSpeechletResponse(errorCard, errorSpeech, repromptText, shouldEndSession));
                }
            }

        });

    }

}

/** @namespace myResponse.channel_lists */
/**
 * Activity List
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleChannelList(intent, session, callback) {
    var repromptText = "" ;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var size = 0;
    var myChannel;

    console.log(intent.name);

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard(accountNotLinkedSpeech));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url,  {timeout: SERVER_TIMEOUT}, function (error, response, body) {

            var currentChannel;
            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    speechOutput = accountRemovedSpeech;
                    
                    callback(sessionAttributes, buildSpeechletResponse(accountRemovedCard, speechOutput, repromptText, shouldEndSession));
                }else {
                    // Loop through the list
                    var list = myResponse.channel_lists;
                    var lastChannel = "";

                    for (var k in list) {
                        if (k !== 'error') {
                            currentChannel = k;
                            if (myChannel) {
                                lastChannel = currentChannel;
                                myChannel = myChannel + ", " + currentChannel;
                            } else {
                                myChannel = currentChannel;
                            }
                            size++;
                        }
                    }

                    if (size == 0) {
                        speechOutput = channelListNoneSpeech;
                    } else {
                        shouldEndSession = false;
                        if (size == 1) {
                            speechOutput = channelListOneSpeech + myChannel + channelListPostSpeech;
                            repromptText = channelListSpeechReprompt + myChannel;
                        } else {
                            speechOutput = channelListMultipleSpeech + myChannel.replace(lastChannel, "and " + lastChannel) + channelListPostSpeech;
                            repromptText = channelListSpeechReprompt + lastChannel;
                        }
                    }

                    var response = buildSpeechletResponse(channelListCard, speechOutput, repromptText, shouldEndSession)
                    if(myResponse.user.debug) {console.log(response);}
                    callback(sessionAttributes, response);
                }
            }else{

                if (error.code=== 'ETIMEDOUT') {
                    callback(sessionAttributes, buildSpeechletResponse(serverTimeOutCard, serverTimeOutSpeech, repromptText, shouldEndSession));
                }else{
                    callback(sessionAttributes, buildSpeechletResponse(errorCard, errorSpeech, repromptText, shouldEndSession));
                }
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
        callback(sessionAttributes,buildLinkCard(accountNotLinkedSpeech));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url,  {timeout: SERVER_TIMEOUT}, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    speechOutput = accountRemovedSpeech;

                    callback(sessionAttributes, buildSpeechletResponse(accountRemovedCard, speechOutput, repromptText, shouldEndSession));
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

                        console.log(cmds);

                        // Send Signals to Global Cache
                        var itach = new Itach(myResponse.user.host, myResponse.user.port);
                        itach.send(cmds, function (err, res) {

                            console.log(res);
                            console.log(err);

                            if (err) {
                                speechOutput = noSignalSpeech + myActivity["title"] + "\nSignals: " + myActivity["count"];
                            } else {
                                speechOutput = okSpeech
                            }

                            callback(sessionAttributes, buildSpeechletResponse(myActivity["title"], speechOutput, repromptText, shouldEndSession));
                        });

                    }

                }
            }else{
                if (error.code=== 'ETIMEDOUT') {
                    callback(sessionAttributes, buildSpeechletResponse(serverTimeOutCard, serverTimeOutSpeech, repromptText, shouldEndSession));
                }else{
                    callback(sessionAttributes, buildSpeechletResponse(errorCard, errorSpeech, repromptText, shouldEndSession));
                }
            }

        });

    }

}

/** @namespace myResponse.devices */
/** @namespace myResponse.success */
/** @namespace session.user.accessToken */
/** @namespace intent.slots */
/** @namespace intent.slots.device_type */
/** @namespace intent.slots.button_name */
/** @namespace intent.slots.multiplier */
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
        callback(sessionAttributes,buildLinkCard(accountNotLinkedSpeech));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url,  {timeout: SERVER_TIMEOUT}, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    speechOutput = accountRemovedSpeech;

                    callback(sessionAttributes, buildSpeechletResponse(accountRemovedCard, speechOutput, repromptText, shouldEndSession));
                }else {

                    // There needs to be a button
                    if(typeof button_name == "undefined") {
                        // 4.3 Not relevant Response
                        callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));
                    }else {

                        // Make Lowercase
                        device_type = device_type ? device_type.trim().toLowerCase(): '';
                        button_name = button_name ? button_name.trim().toLowerCase(): '';
                        device_brand = device_brand ? device_brand.trim().toLowerCase(): '';

                        var match = [];
                        var matchButton = [];
                        var exactMatch = false;
                        var obj = {};

                        // Check Current Device
                        for (var current_device in myResponse.devices) {

                            if (!myResponse.devices.hasOwnProperty(current_device)) continue;

                            // Loop through Brand
                            var brands = myResponse.devices[current_device];
                            for (var current_brand in brands) {
                                if (!brands.hasOwnProperty(current_brand)) continue;

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
                                    var tmp_current_brand;
                                    if (device_type) {

                                        // Match Brand
                                        if (device_brand) {
                                            tmp_current_brand = current_brand.trim().toLowerCase();
                                            if (tmp_current_brand.indexOf(device_brand) > -1) {
                                                if (button_found && !exactMatch) {
                                                    // Device + Brand + Button Found
                                                    obj = {
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
                                            } else {
                                                // Couldn't match Brand?
                                                if (button_found && !exactMatch) {
                                                    obj = {
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
                                        } else {
                                            // Match Device + Button
                                            var tmp_current_device = current_device.trim().toLowerCase();
                                            if (tmp_current_device.indexOf(device_type) > -1) {
                                                if (button_found && !exactMatch) {
                                                    // Device + Button Found
                                                    obj = {
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
                                            } else {
                                                if (button_found && !exactMatch) {
                                                    // Brand + Button Found
                                                    obj = {
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

                                    } else {
                                        tmp_current_brand = current_brand.trim().toLowerCase();
                                        if (tmp_current_brand.indexOf(device_brand) > -1) {
                                            if (button_found && !exactMatch) {
                                                // Brand + Button Found
                                                obj = {
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
                                        } else {
                                            if (button_found && !exactMatch) {
                                                obj = {
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
                        if (match.length == 1) {
                            if (match[0]['match']) {

                                // Cap at 10 repeats
                                if (multiplier > 10) {
                                    multiplier = 10
                                }

                                // Repeat Signal
                                var cmds = [];
                                for (var y = 0; y < multiplier; y++) {
                                    var cmd = match[0]['signal'][0];
                                    var delay = Number(match[0]['signal'][1]) < 400 ? 400 : Number(match[0]['signal'][1]);
                                    cmds.push(cmd + '\r', delay);
                                }

                                // Remove trailing delay
                                if (multiplier > 1) {
                                    cmds.pop();
                                }

                                console.log(cmds);

                                // Send Signals to Global Cache
                                var itach = new Itach(myResponse.user.host, myResponse.user.port);
                                itach.send(cmds, function (err, res) {

                                    console.log(res);
                                    console.log(err);

                                    if (err) {
                                        speechOutput = noSignalSpeech + match[0]["device"] + "\nButton: " + match[0]["button"];
                                    } else {
                                        speechOutput = okSpeech
                                    }

                                    callback(sessionAttributes, buildSpeechletResponse(match[0]["button"], speechOutput, repromptText, shouldEndSession));
                                });

                            }

                        } else {

                            if (matchButton.length > 0) {
                                callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));
                            } else {
                                callback(session.attributes, buildSpeechletResponseWithoutCard("", "", true));
                            }

                        }
                    }

                }
            }else{

                if (error.code=== 'ETIMEDOUT') {
                    callback(sessionAttributes, buildSpeechletResponse(serverTimeOutCard, serverTimeOutSpeech, repromptText, shouldEndSession));
                }else{
                    callback(sessionAttributes, buildSpeechletResponse(errorCard, errorSpeech, repromptText, shouldEndSession));
                }
            }

        });

    }

}

/** @namespace myResponse.channels */
/** @namespace intent.slots.channel */
/**
 * Channels
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleChannel(intent, session, callback){
    var intent_name = intent.name;
    var channel = intent.slots.channel.value;

    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    console.log(intent_name);
    console.log(channel);

    if(typeof session.user.accessToken == "undefined") {
        callback(sessionAttributes,buildLinkCard(accountNotLinkedSpeech));
    }else{

        var url = TOKEN_URL + session.user.accessToken;
        request(url,  {timeout: SERVER_TIMEOUT}, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var myResponse = JSON.parse(body);
                if(myResponse.success == false){
                    speechOutput = accountRemovedSpeech;

                    callback(sessionAttributes, buildSpeechletResponse(accountRemovedCard, speechOutput, repromptText, shouldEndSession));
                }else {

                    // Check if channel Exist from the website
                    channel = channel ? channel.trim().toLowerCase(): '';
                    if(!myResponse.channels[channel]){

                        // Blank or Bad Channel
                        shouldEndSession = false;
                        if(channel == "" || typeof intent.slots.channel.value == "undefined"){
                            speechOutput = channelNullSpeech;
                            repromptText = channelNullSpeechReprompt;
                            callback(sessionAttributes, buildSpeechletResponse(channelNullCard, speechOutput, repromptText, shouldEndSession));
                        }else{
                            speechOutput = channel + channelBadSpeech;
                            repromptText = channelBadSpeechReprompt;
                            callback(sessionAttributes, buildSpeechletResponse(channelBadCard, speechOutput, repromptText, shouldEndSession));
                        }

                    }else {

                        var signals = myResponse.channels[channel];

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

                        console.log(cmds);

                        // Send Signals to Global Cache
                        var itach = new Itach(myResponse.user.host, myResponse.user.port);
                        itach.send(cmds, function (err, res) {

                            console.log(res);
                            console.log(err);

                            if (err) {
                                speechOutput = noSignalSpeech + channel;
                            } else {
                                speechOutput = okSpeech;
                            }

                            callback(sessionAttributes, buildSpeechletResponse(channel, speechOutput, repromptText, shouldEndSession));
                        });

                    }

                }
            }else{

                if (error.code=== 'ETIMEDOUT') {
                    callback(sessionAttributes, buildSpeechletResponse(serverTimeOutCard, serverTimeOutSpeech, repromptText, shouldEndSession));
                }else{
                    callback(sessionAttributes, buildSpeechletResponse(errorCard, errorSpeech, repromptText, shouldEndSession));
                }
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
    var speechOutput = helpSpeech,
        repromptText = helpSpeechReprompt;
    var shouldEndSession = false;

    console.log(intent.name);
    callback(session.attributes, buildSpeechletResponseWithoutCardSSML(speechOutput, repromptText, shouldEndSession));
}

/**
 * Finish Session
 *
 * @param intent
 * @param session
 * @param callback
 */
function handleFinishSessionRequest(intent, session, callback) {
    console.log(intent.name);
    callback(session.attributes, buildSpeechletResponseWithoutCard(finishCard, "", true));
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
 * @param output
 * @param repromptText
 * @param shouldEndSession
 * @returns {{outputSpeech: {type: string, text: *}, reprompt: {outputSpeech: {type: string, text: *}}, shouldEndSession: *}}
 */
function buildSpeechletResponseWithoutCardSSML(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: output
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
 * @returns {{outputSpeech: {type: string, text: *}, card: {type: string}, shouldEndSession: boolean}}
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