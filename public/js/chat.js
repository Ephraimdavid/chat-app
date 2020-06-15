const myForm = document.querySelector('form')
const myInput = document.querySelector('input')
// const formButton = document.querySelector('#send-message')
const locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const socket = io()
//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

    const autoScroll = () => {
        //new message element
        const $newMessage = $messages.lastElementChild

        //height of the new message
        const newMessageStyles = getComputedStyle($newMessage)
        const newMessageMargin = parseInt(newMessageStyles.marginBottom)
        const newmMessageHeight = $newMessage.offsetHeight + newMessageMargin

        //visiable height
        const visibleHeight = $messages.offsetHeight
        // //height of messages container
        const containerHeight = $messages.scrollHeight

        // //how far have i scrolled
        const scrollOffset = $messages.scrollTop + visibleHeight

        if (containerHeight - newmMessageHeight <= scrollOffset) {
            $messages.scrollTop = $messages.scrollHeight
        }
    }

// client receives events from the server
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment( message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//render location link via the template
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
       room, 
       users
   })
   document.querySelector('#sidebar').innerHTML = html
})

myForm.addEventListener('submit', (e) => {
    e.preventDefault()

  let message = myInput.value

  //client sends info to the server
  socket.emit('receive user message', message, (callback) => {
      formButton.removeAttribute('disabled')
     callback()
   })
    myInput.value = ''
       myInput.focus()
})

  locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('sorry Dear, please update your browser')
    }

    locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('send location', {
             latitude: position.coords.latitude,
            longitude: position.coords.longitude
           
        }, () => {
              locationButton.removeAttribute('disabled')
             console.log('location shared!')
        })  
 
    })   
   
})

socket.emit('join', { username, room}, (error) => {
    if (error) {
        alert(error)
        location.assign('/')
    }
})

