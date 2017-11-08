const $i = document.getElementById.bind(document)

browser.storage.sync.get('refreshRate', ({refreshRate = 1}) => {
  $i('refresh_rate').value = refreshRate
  $i('save_btn').classList.remove('disabled')
  $i('save_btn').addEventListener('click',save)
})

browser.storage.sync.get('ghUserData',({ghUserData: userData}) => {
  $i('connected_as').innerHTML = `Connected to GitHub as <a href="${userData.html_url}">${userData.name}</a>`
  $i('disconnect_btn').classList.remove('hidden')
  $i('disconnect_btn').addEventListener('click',disconnect)
})

function disconnect(){
  browser.storage.sync.remove(['ghUserData','ghat','chainLength'])
  window.location.reload()
}

function save(event){
  let refresh_rate = $i('refresh_rate').value
  if(isNumeric(refresh_rate)){
    browser.storage.sync.set({'refreshRate':refresh_rate})
    window.close()
  }else{
    $i('refresh_rate').classList.add('error')
    const targetClassList = event.target.classList
    if(targetClassList.contains('shake-btn')){
      targetClassList.remove('shake-btn')
      void event.target.offsetWidth // hack to restart animation (forces reflow)
    }
    targetClassList.add('shake-btn')
    event.preventDefault()
    return
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
