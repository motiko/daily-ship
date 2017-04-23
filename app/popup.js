import "./css/popup.css";

const $i = document.getElementById.bind(document)

function* requestEvents(user_login, publicity, token){
  for(let page=1; page <= 10; page++){
    yield fetch(`https://api.github.com/users/${user_login}/events${publicity}
                      ?page=${page}&access_token=${token}`.replace(/\s/g,''))
                      .then(r => r.json()).then(response => {
                            return Promise.resolve({response,page})
                      })
  }
  return Promise.resolve('Finished')
}

chrome.storage.sync.get('ghat', ({ghat}) => {
  if(!ghat) return
  console.log(ghat)
  $i('connect_github_container').style.display = 'none'
  fetch(`https://api.github.com/user?access_token=${ghat}`).then(r => r.json())
      .then(userData => {
        Promise.all([...requestEvents(userData.login,'/public',ghat)]).then((allData) =>{
          let allEvents = Array.prototype.concat(...allData.map(obj=> obj.response))
          let pushEvents = allEvents.filter(event => event.type == "PushEvent")
          let pushDates = pushEvents.map(pe => pe.created_at)
        })
      })
})

function filterPushEvents(allData){
  return allData.map(obj=> obj.response).reduce( (acc, arr) => [...acc,...arr])
          //.filter(event => event.type = "PushEvent")
}

$i('connect_to_github').addEventListener('click', connect_to_github)

function connect_to_github(){
  let redirect_uri =  `https://${chrome.runtime.id}.chromiumapp.org/github_cb`
  let github_oauth = {client_id: 'c2defec5a641151422a3',
        client_secret: '486a74168e7446c357c70cf607cf3806de9c7653'}
  let github_endpoint = 'https://github.com/login/oauth/authorize'
  let github_oauth_url = `${github_endpoint}?client_id=${github_oauth.client_id}&redirect_uri=${redirect_uri}`
  chrome.identity.launchWebAuthFlow({url: github_oauth_url , interactive: true},
    function(redirect_url) {
      if(!redirect_url){
        console.error('oAuth error occured')
        return
      }
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
