import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`

export function useWebSocket(userId = 'default_user') {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [activeTools, setActiveTools] = useState([])
  const pendingTextRef = useRef('')
  const pendingMsgIdRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_URL}/ws/chat/${userId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      // Reconnect after 3s
      setTimeout(connect, 3000)
    }
    ws.onerror = () => ws.close()

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected':
          break

        case 'text_delta': {
          if (!pendingMsgIdRef.current) {
            const id = Date.now().toString()
            pendingMsgIdRef.current = id
            pendingTextRef.current = data.text
            setMessages(prev => [...prev, {
              id,
              role: 'assistant',
              content: data.text,
              timestamp: new Date(),
            }])
          } else {
            pendingTextRef.current += data.text
            const currentId = pendingMsgIdRef.current
            const currentText = pendingTextRef.current
            setMessages(prev => prev.map(m =>
              m.id === currentId ? { ...m, content: currentText } : m
            ))
          }
          break
        }

        case 'tool_call':
          setActiveTools(prev => [...prev, { name: data.tool_name, input: data.tool_input }])
          setIsThinking(true)
          break

        case 'tool_result':
          setActiveTools(prev => prev.filter(t => t.name !== data.tool_name))
          break

        case 'response_complete':
          setIsThinking(false)
          setActiveTools([])
          pendingMsgIdRef.current = null
          pendingTextRef.current = ''
          break

        case 'error':
          setIsThinking(false)
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'error',
            content: data.message || 'Something went wrong. Please try again.',
            timestamp: new Date(),
          }])
          break
      }
    }
  }, [userId])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      connect()
      return
    }

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }])
    setIsThinking(true)

    wsRef.current.send(JSON.stringify({ message: text }))
  }, [connect])

  const clearMessages = useCallback(() => {
    setMessages([])
    pendingMsgIdRef.current = null
    pendingTextRef.current = ''
  }, [])

  return { connected, messages, isThinking, activeTools, sendMessage, clearMessages }
}
