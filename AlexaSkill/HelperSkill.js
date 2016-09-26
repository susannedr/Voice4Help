'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Is this an emergency? ';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me yes or no, ' +
        'is this an emergency?';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using the helper skill!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor,
    };
}

function createIsEmergencyAttributes(isEmergency) {
    return {
        isEmergency,
    };
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setIsEmergency(userAnswer, intent, session, callback) {
    
    const cardTitle = 'IsEmergency';
    let isEmergency = userAnswer;
    let repromptText = '';
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';

 //   sessionAttributes = createIsEmergencyAttributes(isEmergency);
    if (isEmergency) {
        speechOutput = "This is an emergency! I alarmed the emergency service. Feel free to concact me about status information.";
        shouldEndSession = true;
    } else {
        speechOutput = "Okay. This is not an emergency. Do you want me to call your doughter Mary, your neighbor David or Doctor Miller? ";
        repromptText = "I understood this is not an emergency. Please tell me: Du you want me to call your doughter Mary, your neighbor David or Doctor Miller?";
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleNoEmergency(intent, session, callback) {
    const person = intent.slots.Person;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';

    if (person && person.value) {
        if (person.value.toLowerCase().indexOf('miller') > -1)
        {
            speechOutput = "Sorry, doctor Miller is not available. Do you want me to call your doughter Mary or your neighbor David?";
        }
        else 
        {
            speechOutput = "Okay I called " + person.value + ". Feel free to concact me about status information.";
            shouldEndSession = true;
        }
    } else {
        speechOutput = "I did not understand. who do you want to call?";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

function handleRepetition(intent, session, callback, currentActionName, action)
{
    var repetition =0;
    var lastAction = "";
    if(session.repetition)
    {
        repetition = session.repetition;
    }
    if(session.lastAction)
    {
        lastAction = session.lastAction;
    }
    if(lastAction===currentActionName){
        repetition=repetition+1;
    }
    else{
        repetition=0;
    }

    session.repetition=repetition;
    session.lastAction=lastAction;

    if(repetition>=3)
    {
        setIsEmergency(true, intent, session, callback)
    }
    else{
        action(intent, session, callback);
    }
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;
    
       // Dispatch to your skill's intent handlers
    if (intentName === 'AMAZON.HelpIntent') {
        handleRepetition(intent, session,callback, 'emergencyQuestion', function(intent,session, callback){
        getWelcomeResponse(callback);
        });
    } else if (intentName === 'INeedHelpIntent') {
        handleRepetition(intent, session,callback, 'emergencyQuestion', function(intent,session, callback){
        getWelcomeResponse(callback);
        });
    } else if (intentName === 'CallSomeoneIntent') {
        handleNoEmergency(intent, session, callback);
    } else if (intentName === 'AMAZON.NoIntent') {
        if (session.attributes && session.attributes.isEmergency === false) handleNoEmergency(false,intent, session, callback);
        else setIsEmergency(false,intent, session, callback);   
     } else if (intentName === 'AMAZON.YesIntent') {
     //   if (session.attributes && session.attributes.isEmergency === true) setIsEmergency(true,intent, session, callback);
     //   else handleNoEmergency(true,intent, session, callback);
        setIsEmergency(true,intent, session, callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};