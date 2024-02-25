import { FormEvent, useEffect, useState } from 'react'
import { Client, Frame, Message, over } from 'stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { ChatMessage } from '~/features/perma-chat/PermaChat'

export function useChatConnection(
  stompClient: Client | null,
  chatMessage: ChatMessage,
  setChatMessage: (chatMessage: ChatMessage) => void,
  onBroadcastMessageReceived: (payload: Message) => void,
  onPrivateMessageReceived: (payload: Message) => void
) {
  const handleRegistration = (e: FormEvent) => {
    console.log('Connecting: ', chatMessage.sender)
    let socket = new SockJS('http://localhost:8080/ws')
    stompClient = over(socket)
    stompClient.connect({}, onConnected, onError)
    setChatMessage({ ...chatMessage, connected: true })
    e.preventDefault()
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

  useEffect(() => {
    return () => {
      stompClient?.disconnect(() => {
        console.log('Disconnected')
      })
    }
  }, [])

  return handleRegistration
}
