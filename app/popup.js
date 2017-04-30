const $i = document.getElementById.bind(document)

function AuthenticationError(message) {
  this.name = 'AuthenticationError';
  this.message = message || 'AuthenticationError';
  this.stack = (new Error()).stack;
}
AuthenticationError.prototype = Object.create(Error.prototype);
AuthenticationError.prototype.constructor = AuthenticationError;

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

function fetchDataFromGithub(){
  chrome.storage.sync.get('ghat', ({ghat}) => {
    if(!ghat) return
    $i('connect_to_gh').classList.add('hidden')
    $i('fetching_data').classList.remove('hidden')
    fetch(`https://api.github.com/user?access_token=${ghat}`).then(user_response => {
      if(user_response.status == 401) throw( new AuthenticationError('BadToken'))
      return user_response.json()
    }).then(userData => {
          console.dir(userData)
          $i('avatar').src= userData.avatar_url
          $i('fetching_data').classList.add('hidden')
          $i('github_data').classList.remove('hidden')
          return Promise.all([...requestEvents(userData.login,'/public',ghat)]).then((allData) =>{
            let allEvents = Array.prototype.concat(...allData.map(obj=> obj.response))
            let pushEvents = allEvents.filter(event => event.type == "PushEvent")
            let pushDates = pushEvents.map(pe => pe.created_at)
            console.log(pushDates)
            return pushDates
          })
        }).catch((error)=>{
          if(error.message === "BadToken"){
            chrome.storage.sync.remove('ghat', ()=>{
                showAuthError('Invalid token. Probably been expired or revoked.')
            })
          }
          console.error(error)
        })
  })
}

window.onload = function(){
  console.log(0)
  fetchDataFromGithub()
}

function filterPushEvents(allData){
  return allData.map(obj=> obj.response).reduce( (acc, arr) => [...acc,...arr])
          //.filter(event => event.type = "PushEvent")
}

$i('connect_to_github_btn').addEventListener('click', connect_to_github)

function connect_to_github(){
  $i('connect_to_gh').classList.toggle('hidden')
  $i('connecting').classList.toggle('hidden')
  let redirect_uri =  `https://${chrome.runtime.id}.chromiumapp.org/github_cb`
  let github_endpoint = 'https://github.com/login/oauth/authorize'
  let github_oauth_url = `${github_endpoint}?client_id=${github_oauth.client_id}&redirect_uri=${redirect_uri}`
  chrome.identity.launchWebAuthFlow({url: github_oauth_url , interactive: true},
    function(redirect_url) {
      let lastError = chrome.runtime.lastError
      if(lastError ){
        console.error('oAuth error occured')
        console.error(lastError)
        showAuthError(lastError.message)
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
            chrome.storage.sync.set({'ghat': json.access_token}, ()=>{
            $i('connecting').classList.add('hidden')
            $i('connect_to_gh').classList.add('hidden')
            fetchDataFromGithub()
        })
      }).catch((exception)=>{
        console.error(exception)
        showAuthError(`Exception occured during authentication : ${exception.message} (Find more details in developer console)`)
      })
    })
}

function showAuthError(errorMsg){
  $i('connecting').classList.add('hidden')
  $i('connect_to_gh').classList.remove('hidden')
  $i('error_msg').classList.remove('hidden')
  $i('error_msg').innerHTML = `Authentication error occured :<br/> "${errorMsg}"<br/> Please try authorize again <br/>`
}
