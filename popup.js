const $i = document.getElementById.bind(document)

function* requestPages(user_login,token){
  let page = 0
  const N = ''
  while(page < 10){
    yield fetch(`https://api.github.com/users/${user_login}/events
                      ?page=${page}&access_token=${token}`.replace(/\s/g,''))
      .then(r => r.json())
    page++
  }
  return Promise.resolve('Finished')
}

function* searchCommits(user_login,token){
  let page = 0
  let headers = new Headers({
    'Accept': ' application/vnd.github.cloak-preview'
  })
  while(page < 10){
    yield fetch(`https://api.github.com/users/${user_data.login}/events?page=${i}&access_token=${ghat}`,
       {headers}).then(r => r.json())
    page++
  }
  return Promise.resolve('Finished')
}

chrome.storage.sync.get('ghat', ({ghat}) => {
  console.log(ghat)
  $i('connect_github_container').style.display = 'none'
  let gh_user_data = null
  fetch(`https://api.github.com/user?access_token=${ghat}`).then(r => r.json())
      .then(user_data => {
        gh_user_data = user_data
        for( pagePromise of requestPages(user_data.login, ghat)){
            pagePromise.then(events => {
              console.log(`${'-'.repeat(40)}/events/public?page={'-'.repeat(40)}`)
              console.log(events)
              console.log('-'.repeat(80))
            })
        }

      })
})

$i('connect_to_github').addEventListener('click', connect_to_github)

function connect_to_github(){
  let redirect_uri =  `https://${chrome.runtime.id}.chromiumapp.org/github_cb`
  let github_oauth = {client_id: 'c2defec5a641151422a3',
        client_secret: '486a74168e7446c357c70cf607cf3806de9c7653'}
  let github_endpoint = 'https://github.com/login/oauth/authorize'
  let github_oauth_url = `${github_endpoint}?client_id=${github_oauth.client_id}&redirect_uri=${redirect_uri}`

  chrome.identity.launchWebAuthFlow({url: github_oauth_url , interactive: true},
    function(redirect_url) {
      let code = /code\=(\w+)/.exec(redirect_url)[1]
      let headers = new Headers({
              "Content-Type": "application/json",
              "Accept": "application/json"})
      fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers,
        mode: 'cors',
        body: JSON.stringify(Object.assign({code},github_oauth))
      }).then(response => response.json()).then(json => {
        chrome.storage.sync.set({'ghat': json.access_token})
      });

     });
}
