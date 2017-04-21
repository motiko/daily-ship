let github_code = ""

document.getElementById('connect_github').onclick =  function connect_github(){
  let app_id = 'hmclpbgmdpfoepljkjakkhbclijjgdgn'
  let github_oauth = {client_id: 'c2defec5a641151422a3',
        client_secret: `486a74168e7446c357c70cf607cf3806de9c7653`,
        url: 'https://github.com/login/oauth/authorize',
        redirect_uri: `https://${app_id}.chromiumapp.org/github_cb`}

  let github_oauth_url = `${github_oauth.url}?client_id=${github_oauth.client_id}&redirect_uri=${github_oauth.redirect_uri}`

  chrome.identity.launchWebAuthFlow({url: github_oauth_url , interactive: true},
    function(redirect_url) {
      github_code = /code\=(\w+)/.exec(redirect_url)[1]
     });
}
