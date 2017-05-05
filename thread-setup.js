var setup = {}

setup.persistentMenu = {
    setting_type: 'call_to_actions',
    thread_state: 'existing_thread',
    call_to_actions: [
    {
        type: 'web_url',
        title: 'My Account',
        url: `https://fantasyreporter.xyz/account`,
        webview_height_ratio: 'tall',
        messenger_extensions: true,
    },
    {
        type: 'postback',
        title: 'Standings',
        payload: 'standingsPayload',
    },
    {
        type: 'postback',
        title: 'Scores',
        payload: 'scoresPayload',
    },
    ],
}

/*
function callThreadAPI(Menu) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token:token},
    method: 'POST',
    json: Menu

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully set up persistent menu", 
        messageId, recipientId);
    } else {
      console.error("Unable to set up menu");
      console.error(response);
      console.error(error);
    }
  });  
} */

module.exports = setup