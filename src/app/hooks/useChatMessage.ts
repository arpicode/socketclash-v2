import { useState } from 'react'
import { Message } from 'stompjs'
import { ChatMessage } from '~/features/perma-chat/PermaChat'

export function useChatMessages() {
  const [broadcastMessages, setBroadcastMessages] = useState<ChatMessage[]>([])
  const [privateMessages, setPrivateMessages] = useState(new Map<string, ChatMessage[]>())

  const onBroadcastMessageReceived = (payload: Message) => {
    const message = JSON.parse(payload.body) as ChatMessage
    switch (message.type) {
      case 'JOIN':
        if (!privateMessages.has(message.sender)) {
          setPrivateMessages(new Map(privateMessages.set(message.sender, [])))
        } else {
          const messages = privateMessages.get(message.sender)!
          setPrivateMessages(new Map(privateMessages.set(message.sender, messages)))
        }
        console.log(`${message.sender} joined the chat`)
        break
      case 'LEAVE':
        console.log(`${message.sender} left the chat`)
        break
      case 'CHAT':
        setBroadcastMessages([...broadcastMessages, message])
        console.log(`${message.sender}: ${message.content}`)
        break
      default:
        console.warn('Unknown message type')
    }
  }

  const onPrivateMessageReceived = (payload: Message) => {
    const message: ChatMessage = JSON.parse(payload.body)

    if (privateMessages.has(message.sender)) {
      const messages = privateMessages.get(message.sender)!
      setPrivateMessages(new Map(privateMessages.set(message.sender, [...messages, message])))
    } else {
      setPrivateMessages(new Map(privateMessages.set(message.sender, [message])))
    }
  }

  return {
    broadcastMessages,
    privateMessages,
    onBroadcastMessageReceived,
    onPrivateMessageReceived,
  }
}
