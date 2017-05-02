const $i = document.getElementById.bind(document)

function AuthenticationError(message) {
  this.name = 'AuthenticationError';
  this.message = message || 'AuthenticationError';
  this.stack = (new Error()).stack;
}
AuthenticationError.prototype = Object.create(Error.prototype);
AuthenticationError.prototype.constructor = AuthenticationError;

function* requestEvents(user_login, publicity, token){
  let drawRect = drawRectFunc()
  for(let page=1; page <= 10; page++){
    yield fetch(`https://api.github.com/users/${user_login}/events${publicity}
                      ?page=${page}&access_token=${token}`.replace(/\s/g,''))
                      .then(r => r.json()).then(response => {
                          drawRect(null,page-1)
                          return Promise.resolve({response,page})
                      })
  }
  return Promise.resolve('Finished')
}

chrome.storage.onChanged.addListener(function(changes,area){
  if(area != "sync") return

})

function fetchDataFromGithub(){
  chrome.storage.sync.get('ghat', ({ghat}) => {
    if(!ghat){
      $i('connect_to_gh').classList.remove('hidden')
      $i('fetching_data').classList.add('hidden')
      return
    }
    $i('connect_to_gh').classList.add('hidden')
    $i('fetching_data').classList.remove('hidden')
    fetch(`https://api.github.com/user?access_token=${ghat}`).then(user_response => {
      if(user_response.status == 401) throw( new AuthenticationError('BadToken'))
      return user_response.json()
    }).then(userData => {
          chrome.storage.sync.set({'ghUserData': userData})
          $i('avatar').src= userData.avatar_url
          $i('fetching_data').classList.add('hidden')
          $i('github_data').classList.remove('hidden')
          return Promise.all([...requestEvents(userData.login,'/public',ghat)]).then((allData) =>{
            clearRects()
            let pushDates = getUnborkenChain(getPushDates(allData))
            chrome.storage.sync.set({'chainLength': pushDates.length})
            pushDates.forEach(drawRectFunc())
          })
        }).catch((error)=>{
          if(error.message === "BadToken"){
            chrome.storage.sync.remove('ghat', ()=>{
                showAuthError('Invalid token. Probably have been expired or revoked.')
            })
          }
          console.error(error)
        })
  })
}

function getPushDates(allData){
  let allEvents = Array.prototype.concat(...allData.map(obj=> obj.response))
  let pushEvents = allEvents.filter(event => event.type == "PushEvent")
  return pushEvents.map(pe => pe.created_at)
}


function getUnborkenChain(pushDates){
  pushDates = pushDates.sort(dateFns.compareDesc)
  pushDates = pushDates.map((d) => dateFns.format(d,"YYYY-MM-DD"))
  pushDates = pushDates.filter((val, i, arr) => arr.indexOf(val) === i)
  var today = new Date()
  pushDates = pushDates.filter( function( date, index){
    return dateFns.differenceInCalendarDays(today, date) == index
  })
  return pushDates
}

function clearRects(){
  let svg = $i('contributions')
  svg.innerHTML = `<rect x="2" y="2" width="10" height="10" stroke="green" fill="green" fill-opacity="0.5" stroke-opacity="0.8" id="contrib-rect-proto" class="hidden contrib-rect"></rect>`
}

function drawRectFunc(){
  let svg = $i('contributions')
  return function(date,index){
    let rowNum = (index % 12)
    let colNum = (Math.floor(index / 12))
    let rect = $i('contrib-rect-proto').cloneNode()
    rect.classList.remove('hidden')
    rect.removeAttribute('id')
    let x =  Number.parseInt(rect.getAttribute('x'), 10)
    let y =  Number.parseInt(rect.getAttribute('y'), 10)
    let width = Number.parseInt(rect.getAttribute('width'), 10)
    rect.setAttribute('x', x + (rowNum * (x + width)))
    rect.setAttribute('y', y + (colNum * (y + width)))
    svg.appendChild(rect)
  }
}

window.onload = function(){
  fetchDataFromGithub()
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
  $i('fetching_data').classList.add('hidden')
  $i('github_data').classList.add('hidden')
  $i('connect_to_gh').classList.remove('hidden')
  $i('error_msg').classList.remove('hidden')
  $i('error_msg').innerHTML = `Authentication error occured :<br/> "${errorMsg}"<br/> Please try authorize again <br/>`
}
