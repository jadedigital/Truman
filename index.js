var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var session = require('express-session')
var qs = require('querystring')
var path = require('path')
var YantasySports = require('yahoo-fantasy-without-auth')
require('dotenv').config()
var config = require('./config')

var clientId = process.env.YAHOO_CLIENTID
var clientSecret = process.env.YAHOO_CLIENTSECRET
var redirectUri = 'http://fantasyreporter.xyz/auth/yahoo/callback'

var yf = new YantasySports();
var app = express()

app.set('port', process.env.PORT)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug')

//Express configuration
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(session({ secret: 'SECRET', resave: false, saveUninitialized: true}))

app.use(express.static(path.join(__dirname, 'public')));


//Express Routes
app.get('/', function(req, res){
  res.render('index', { user: req.session.user });
});

app.get('/privacy', function(req, res){
  res.render('privacy', { user: req.session.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  var game_key = 'nfl'
  yf.setUserToken(req.session.user.accessToken);

  yf.user.game_leagues(
    game_key,
    function(err, data) {
      if (err)
        console.log('Oops: ', err);
      else
        leagueData = data
        return res.render('account', { user: req.session.user, leagueData: leagueData });
        }
      ); 

});

app.get('/login', function(req, res){
  res.render('login', { user: req.session.user });
});

app.get('/logout', function(req, res){
  delete req.session.user;
  res.redirect('/');
});

//Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text.toLowerCase()
            switch (messageText) {
              case 'get started':
                getStartedMessage(senderID);
                break;
              case 'davis':
                poop = '\uD83D\uDCA9'
                sendTextMessage(sender, poop)  
              default:
                sendTextMessage(senderID, messageText);
            }
        }
        else if (event.postback) {
          receivedPostback(event);
        }
    }
    res.sendStatus(200)
})

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function getStartedMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "FantasyReporter",
            subtitle: "Keep up to date on your league",
            item_url: "https://fantasyreporter.xyz",               
            image_url: "https://scontent-ort2-1.xx.fbcdn.net/v/t39.2081-0/p128x128/18316451_1650528714961517_6136078424126521344_n.png?oh=26fa41fbba558c1619d904121b0c4444&oe=5986127C",
            buttons: [{
              type: "web_url",
              url: "https://fantasyreporter.xyz",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "League",
            subtitle: "Set your league ID",
            item_url: "http://myfantasyleague.com",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "http://myfantasyleague.com",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  sendTextMessage(messageData);
}

var token = process.env.FACEBOOK_TOKEN

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token:token},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}



// GET /auth/yahoo

app.get('/auth/yahoo', function(req, res) {
  var authorizationUrl = 'https://api.login.yahoo.com/oauth2/request_auth';

  var queryParams = qs.stringify({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code'
  });

  res.redirect(authorizationUrl + '?' + queryParams);
});


// GET /auth/yahoo/callback

app.get('/auth/yahoo/callback', function(req, res) {
  var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

  var options = {
    url: accessTokenUrl,
    headers: { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') },
    rejectUnauthorized: false,
    json: true,
    form: {
      code: req.query.code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }
  };

  // 1. Exchange authorization code for access token.
  request.post(options, function(err, response, body) {
    var guid = body.xoauth_yahoo_guid;
    var accessToken = body.access_token;
    var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + guid + '/profile?format=json';

    var options = {
      url: socialApiUrl,
      headers: { Authorization: 'Bearer ' + accessToken },
      rejectUnauthorized: false,
      json: true
    };

    // 2. Retrieve profile information about the current user.
    request.get(options, function(err, response, body) {

    // 3. Create a new user account or return an existing one

      var user = {
        guid: guid,
        //email: body.profile.emails[0].handle,
        profileImage: body.profile.image.imageUrl,
        firstName: body.profile.givenName,
        lastName: body.profile.familyName,
        displayName: body.profile.nickname,
        accessToken: accessToken
      };
      req.session.user = user;
      res.redirect('/');

    });
  });
});

app.get('/fantasy', ensureAuthenticated, function(req, res) {

  var user = req.session.user;
  var league_key = 'nfl.l.534581'

  yf.setUserToken(user.accessToken);

  yf.league.standings(
    league_key,
    function(err, data) {
      if (err)
        console.log('Oops: ', err);
      else
        req.session.result = data;
        //leagueData = JSON.stringify(req.session.result, null, 2);
        leagueData = req.session.result
        return res.render('fantasy', { user: req.session.user, leagueData: leagueData });
        }
      );      

});

app.get('/scoreboard', ensureAuthenticated, function(req, res) {

  var user = req.session.user;
  var league_key = 'nfl.l.534581'
  var week = '2'

  yf.setUserToken(user.accessToken);

  yf.league.scoreboard(
    league_key,
    week,
    function(err, data) {
      if (err)
        console.log('Oops: ', err);
      else
        req.session.result = data;
        //leagueData = JSON.stringify(req.session.result, null, 2);
        leagueData = req.session.result
        return res.render('scoreboard', { user: req.session.user, leagueData: leagueData });
        }
      );      

});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login')
  } else {
    return next()
  }
}


// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
