const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton = document.querySelector("#share-location")
const $messageDiv = document.querySelector("#message")

// Template
const messageTemplate = document.querySelector("#message-template").innerHTML
const urlTemplate = document.querySelector("#url-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// query params
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message element
    const $newMessage = $messageDiv.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messageDiv.offsetHeight

    // Height of messages container
    const containerHeight = $messageDiv.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messageDiv.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageDiv.scrollTop = $messageDiv.scrollHeight
    }
}

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })

    $messageDiv.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (mapsUrl) => {
    const html = Mustache.render(urlTemplate, {
        username: mapsUrl.username,
        mapsUrl: mapsUrl.url,
        createdAt: moment(mapsUrl.createdAt).format("h:mm a")
    })

    $messageDiv.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute("disabled", "disabled")
    socket.emit("sendMessage", $messageFormInput.value, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()
        if(error){
            return console.log("Error:", error)
        }
    })
})

$shareLocationButton.addEventListener("click", () => {
    $shareLocationButton.setAttribute("disabled", "disabled")
    if(!navigator.geolocation){
        return alert("Your browser dont have a support for geolocation")
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        socket.emit("sendLocation", {latitude, longitude}, (error) => {
            $shareLocationButton.removeAttribute("disabled")
            if(error){
                return console.log("Error:", error)
            }
        })
    })
})

socket.emit("join", {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = "/"
    }
})
