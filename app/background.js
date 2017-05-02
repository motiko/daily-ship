const MILLISECONDS_IN_DAY = 86400000
const MILLISECONDS_IN_MINUTE = 60000
let fetchTimerInterval;

chrome.storage.sync.get('refreshRate',({refreshRate = 5})=> {
  fetchTimerInterval = setInterval(fetchDataFromGithub, refreshRate * MILLISECONDS_IN_MINUTE)
  fetchDataFromGithub()
})

chrome.storage.onChanged.addListener(function({refreshRate,chainLength}, area){
  if(area != "sync") return
  if(refreshRate){
    clearInterval(fetchTimerInterval)
    fetchTimerInterval = setInterval(fetchDataFromGithub, refreshRate.newValue * MILLISECONDS_IN_MINUTE)
  }
  if(chainLength){
    console.dir(chainLength)
    if(chainLength.newValue){
      chrome.browserAction.setBadgeText({text:`${chainLength.newValue}`})
    }else{
      chrome.browserAction.setBadgeText({text:''})
    }
  }
})

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
    fetch(`https://api.github.com/user?access_token=${ghat}`).then(user_response => {
      if(user_response.status == 401) throw('BadToken')
      return user_response.json()
    }).then(userData => {
          chrome.storage.sync.set({'ghUserData': userData})
          return Promise.all([...requestEvents(userData.login,'/public',ghat)]).then((allData) =>{
            let pushDates = getUnborkenChain(getPushDates(allData))
            chrome.storage.sync.set({'chainLength': pushDates.length})
          })
        }).catch((error)=>{
          if(error === "BadToken"){
            chrome.storage.sync.remove('ghat', ()=>{})
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
  let today = new Date()
  today.setHours(0,0,0,0)
  pushDates = pushDates.sort((d1,d2) => new Date(d2) - new Date(d1))
  pushDates = pushDates.map((d) => d.split('T')[0])
  pushDates = pushDates.filter((val, i, arr) => arr.indexOf(val) === i)
  let chain = pushDates.filter(unbrokenChainFrom(today))
  if(chain.length == 0){
    let yesterday = today - MILLISECONDS_IN_DAY
    chain =  pushDates.filter(unbrokenChainFrom(yesterday))
  }
  return chain
}

function unbrokenChainFrom(from){
  return function(date,index){
    let startOfDay = new Date(date)
    startOfDay.setHours(0,0,0,0)
    return ( from - startOfDay ) / MILLISECONDS_IN_DAY == index
  }
}

chrome.runtime.onMessage.addListener( (request) => {
  switch(request.command){
    case "connect_to_github":
      connectToGithub()
      break
    case "fetch_data_from_github":
      fetchDataFromGithub()
      break
  }
})

function connectToGithub(){
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
      chrome.storage.sync.set({'ghc': code})
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
      }).catch((exception)=>{
        console.error(exception)
        showAuthError(`Exception occured during authentication : ${exception.message} (Find more details in developer console)`)
      })
    })
}

function showAuthError(errorMsg){
  console.error(errorMsg)
}
