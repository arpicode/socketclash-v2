import { FormEvent, useEffect, useState } from 'react'
import { Client, Frame, Message, over } from 'stompjs'
// import sockjs from "sockjs-client"
// https://github.com/sockjs/sockjs-client/issues/439
import SockJS from 'sockjs-client/dist/sockjs'
import RegistrationForm from './RegistrationForm'
import { log } from 'console'

type MessageType = 'CHAT' | 'JOIN' | 'LEAVE'
type Recipient = string

const GLOBAL_CHATROOM = 'CHATROOM'

export interface ChatMessage {
  sender: string
  recipient: string
  connected: boolean
  content: string
  type: MessageType
}

let stompClient: Client | null = null

function PermaChat() {
  const [chatMessage, setChatMessage] = useState<ChatMessage>({
    sender: '',
    recipient: '',
    connected: false,
    content: '',
    type: 'CHAT',
  })
  const [broadcastMessages, setBroadcastMessages] = useState<ChatMessage[]>([])
  const [privateMessages, setPrivateMessages] = useState(new Map<Recipient, ChatMessage[]>())
  const [chatTab, setChatTab] = useState(GLOBAL_CHATROOM)

  console.log('rendering PermaChat')

  const handleRegistration = (e: FormEvent) => {
    e.preventDefault()
    console.log('Connecting: ', chatMessage.sender)
    let socket = new SockJS('http://localhost:8080/ws')
    stompClient = over(socket)
    stompClient.connect({}, onConnected, onError)
    setChatMessage({ ...chatMessage, connected: true })
  }

  const onConnected = () => {
    setChatMessage({ ...chatMessage, connected: true })
    stompClient?.subscribe('/broadcast/chat', onBroadcastMessageReceived)
    stompClient?.subscribe(`/user/${chatMessage.sender}/private`, onPrivateMessageReceived)
    stompClient?.send(
      '/app/broadcast.chat',
      {},
      JSON.stringify({ sender: chatMessage.sender, type: 'JOIN' })
    )
  }

  const onError = (error: string | Frame) => {
    if (typeof error === 'string') {
      console.log(`String error: ${error}`)
    } else {
      console.log(`Frame error: ${error.command}`)
    }
  }

  const onBroadcastMessageReceived = (payload: Message) => {
    const message = JSON.parse(payload.body) as ChatMessage
    switch (message.type) {
      case 'JOIN':
        setPrivateMessages((prevPrivateMessages) => {
          console.log('setting private messages of type JOIN')
          if (!prevPrivateMessages.has(message.sender)) {
            return new Map(prevPrivateMessages.set(message.sender, []))
          }
          return prevPrivateMessages
        })
        setBroadcastMessages((prevBroadcastMessages) => [
          ...prevBroadcastMessages,
          { ...message, content: `${message.sender} joined the chat` },
        ])
        break
      case 'LEAVE':
        console.log(`${message.sender} left the chat`)
        break
      case 'CHAT':
        setBroadcastMessages((prevBroadcastMessages) => [...prevBroadcastMessages, message])
        console.log(`${message.sender}: ${message.content}`)
        break
      default:
        console.warn('Unknown message type')
    }
  }

  const handleSendBroadcastMessage = (e: FormEvent) => {
    e.preventDefault()
    stompClient?.send('/app/broadcast.chat', {}, JSON.stringify(chatMessage))
    setChatMessage({ ...chatMessage, content: '' })
  }

  const handleSendPrivateMessage = (e: FormEvent) => {
    e.preventDefault()
    stompClient?.send(`/app/whisper.chat`, {}, JSON.stringify(chatMessage))
    console.log('Sending private message:', chatMessage)
    // Don't add the message to the privateMessages state if it's a self-message
    // since it will be added when it's received.
    if (chatMessage.recipient !== chatMessage.sender) {
      setPrivateMessages((prevPrivateMessages) => {
        console.log(`Setting private messages for ${chatMessage.recipient}`)

        const existingMessages = prevPrivateMessages.get(chatMessage.recipient) || []
        console.log('Existing messages:', existingMessages)
        const updatedMessages = [...existingMessages, chatMessage]
        console.log('Updated messages:', updatedMessages)
        return new Map(prevPrivateMessages.set(chatMessage.recipient, updatedMessages))
      })
      console.log(
        'privateMessages right after setPrivateMessages:',
        JSON.stringify(privateMessages)
      )
    }
    console.log('privateMessages:', JSON.stringify(privateMessages))
    setChatMessage({ ...chatMessage, content: '' })
  }

  const onPrivateMessageReceived = (payload: Message) => {
    const message: ChatMessage = JSON.parse(payload.body)
    console.log('Received private message:', message)

    setPrivateMessages((prevPrivateMessages) => {
      console.log(
        `Setting private messages from ${message.sender} to recipient ${message.recipient}`
      )
      const existingMessages = prevPrivateMessages.get(message.sender) || []
      console.log('Existing messages:', existingMessages)

      const updatedMessages = [...existingMessages, message]
      console.log('Updated messages:', updatedMessages)

      const newPrivateMessages = new Map(prevPrivateMessages)
      newPrivateMessages.set(message.sender, updatedMessages)
      return newPrivateMessages
    })
  }

  return (
    <div>
      {chatMessage.connected ? (
        <div>
          <div>
            {/* chat room users */}
            <ul>
              <li>
                <button type="button" onClick={() => setChatTab(GLOBAL_CHATROOM)}>
                  Chatroom
                </button>
              </li>
              {[...privateMessages.keys()].map((sender, i) => (
                <li key={`${sender}-${i}`}>
                  <button type="button" onClick={() => setChatTab(sender)}>
                    {sender}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {chatTab === GLOBAL_CHATROOM && (
            <div>
              <ul>
                {broadcastMessages.map((message, i) => (
                  <li key={`${message.sender}-${i}`}>
                    {message.type === 'JOIN' && `${message.content}`}
                    {message.type === 'CHAT' && `${message.sender}: ${message.content}`}
                  </li>
                ))}
              </ul>
              <div>
                <form>
                  <input
                    type="text"
                    placeholder="Enter your message&hellip;"
                    value={chatMessage.content}
                    onChange={(event) =>
                      setChatMessage({ ...chatMessage, content: event.target.value })
                    }
                  />
                  <button type="submit" onClick={handleSendBroadcastMessage}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
          {chatTab !== GLOBAL_CHATROOM && (
            <div>
              <h2>Messages</h2>
              <ul>
                {[...privateMessages.get(chatTab)!].map((message, i) => (
                  <li key={`${message.sender}-${i}`}>{`${message.sender}: ${message.content}`} </li>
                ))}
              </ul>
              <div>
                <form>
                  <input
                    type="text"
                    placeholder={`Enter your message for ${chatTab}&hellip;`}
                    value={chatMessage.content}
                    onChange={(event) =>
                      setChatMessage({
                        ...chatMessage,
                        content: event.target.value,
                        recipient: chatTab,
                      })
                    }
                  />
                  <button type="submit" onClick={handleSendPrivateMessage}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <RegistrationForm
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          onRegistration={handleRegistration}
        />
      )}
    </div>
  )
}

export default PermaChat
