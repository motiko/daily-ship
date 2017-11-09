const $i = document.getElementById.bind(document)

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

chrome.storage.onChanged.addListener(function({ghat,ghUserData,chainLength},area){
  if(area != "sync") return
  if(ghat){
    showRow('fetching_data')
    chrome.runtime.sendMessage(chrome.runtime.id,{command:'fetch_data_from_github'})
  }
  if(ghUserData || chainLength != undefined){
    window.location.reload()
  }
})

window.onload = function(){
  showRow('fetching_data')
  chrome.storage.sync.get(['ghUserData', 'ghat', 'chainLength'],
    ({ghat, ghUserData, chainLength}) =>{
      if(ghat){
        if(ghUserData){
          $i('avatar').src= ghUserData.avatar_url
        }
        if(chainLength != undefined){
          showRow('github_data')
          new Array(chainLength).fill(0).forEach(drawRectFunc())
        }
        if(chainLength === undefined || !ghUserData){
          showRow('fetching_data')
          chrome.runtime.sendMessage(chrome.runtime.id,{command:'fetch_data_from_github'})
        }
      }else{
        showRow('connect_to_gh')
      }
  })
}

$i('connect_to_github_btn').addEventListener('click', function(){
  showRow('connecting')
  chrome.runtime.sendMessage(chrome.runtime.id,{command:'connect_to_github'})
})

function showRow(rowToShow){
  $i(rowToShow).classList.remove('hidden')
  const rows = ['connect_to_gh','connecting','fetching_data','github_data']
  rows.filter((row) => row != rowToShow).forEach((row)=> $i(row).classList.add('hidden'))
}


// function showAuthError(errorMsg){
//   $i('connecting').classList.add('hidden')
//   $i('fetching_data').classList.add('hidden')
//   $i('github_data').classList.add('hidden')
//   $i('connect_to_gh').classList.remove('hidden')
//   $i('error_msg').classList.remove('hidden')
//   $i('error_msg').innerHTML = `Authentication error occured :<br/> "${errorMsg}"<br/> Please try authorize again <br/>`
// }
