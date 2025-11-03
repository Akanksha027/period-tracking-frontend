import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/Colors'
import { chatWithAI } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SymptomWithSeverity {
  symptom: string
  severity?: string
  frequency?: string
}

export default function ChatScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  // Parse symptoms from URL params
  const initialSymptoms: SymptomWithSeverity[] = params.symptoms
    ? JSON.parse(decodeURIComponent(params.symptoms as string))
    : []

  const initialQuestion = params.initialQuestion as string | undefined

  useEffect(() => {
    if (initialSymptoms && initialSymptoms.length > 0) {
      const symptomsList = initialSymptoms.map(s => {
        const severity = s.severity?.replace('_', ' ') || 'moderate'
        return `${s.symptom} (${severity}${s.frequency ? `, ${s.frequency}` : ''})`
      }).join(', ')
      
      const hasSevere = initialSymptoms.some(s => s.severity === 'severe' || s.severity === 'very_severe')
      const allMild = initialSymptoms.every(s => s.severity === 'very_mild' || s.severity === 'mild')
      
      let initialContent = `Hi! I see you've tracked these symptoms: ${symptomsList}.\n\n`
      
      if (hasSevere) {
        initialContent += `Some of your symptoms are marked as severe. It's important to take care of yourself. I'd recommend:\n\n`
        initialContent += `• Applying heat or taking a warm bath for cramps\n`
        initialContent += `• Staying hydrated and getting rest\n`
        initialContent += `• If pain is very severe or persists, please consider seeing a healthcare provider\n\n`
        initialContent += `How are you feeling right now? 💕`
      } else if (allMild) {
        initialContent += `These symptoms seem mild, which is good. Here's what you can do to feel better:\n\n`
        initialContent += `• Rest and take it easy\n`
        initialContent += `• Stay hydrated with water or herbal teas\n`
        initialContent += `• Gentle stretches or a warm bath can help\n`
        initialContent += `• These should improve soon\n\n`
        initialContent += `Is there anything specific bothering you? I'm here to help! 💕`
      } else {
        initialContent += `Let me help you understand these symptoms and what you can do:\n\n`
        initialContent += `• For cramps: Try a heating pad, warm bath, or gentle massage\n`
        initialContent += `• For bloating: Stay hydrated, avoid salty foods, gentle walks help\n`
        initialContent += `• For fatigue: Rest when you need to, your body is working hard\n`
        initialContent += `• Monitor your symptoms - if they get worse, consider seeing a doctor\n\n`
        initialContent += `How can I help you feel better? What questions do you have? 💕`
      }
      
      const initialMessage: Message = {
        id: 'initial',
        role: 'assistant',
        content: initialContent,
        timestamp: new Date(),
      }
      setMessages([initialMessage])
    } else if (initialQuestion) {
      const initialMessage: Message = {
        id: 'initial',
        role: 'assistant',
        content: `Hi! I understand you're wondering "Is it okay?" 💕 I'm here to help. Could you tell me a bit more about what you're experiencing today?`,
        timestamp: new Date(),
      }
      setMessages([initialMessage])
    } else {
      const initialMessage: Message = {
        id: 'initial',
        role: 'assistant',
        content: 'Hi, this is Flo Health Assistant! And now I\'m also your personal Discharge Expert 🔍 How can I help you today?',
        timestamp: new Date(),
      }
      setMessages([initialMessage])
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  // Function to render text with clickable links
  const renderMessageWithLinks = (text: string, isUser: boolean) => {
    // Regex to match web URLs (http, https)
    const urlRegex = /(https?:\/\/[^\s\)]+)/gi
    const parts = text.split(urlRegex)
    
    return (
      <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            // Extract app/service name from URL for display
            let displayText = part
            if (part.includes('swiggy.com')) {
              displayText = 'Swiggy Instamart'
            } else if (part.includes('zomato.com')) {
              displayText = 'Zomato'
            } else if (part.includes('bigbasket.com')) {
              displayText = 'BigBasket'
            } else if (part.includes('zepto')) {
              displayText = 'Zepto'
            } else if (part.includes('blinkit')) {
              displayText = 'Blinkit'
            } else {
              displayText = 'Open Link'
            }
            
            return (
              <Text
                key={index}
                style={styles.linkText}
                onPress={() => {
                  Linking.openURL(part).catch((err) => {
                    console.error('Failed to open URL:', err)
                  })
                }}
              >
                {displayText}
              </Text>
            )
          }
          return <Text key={index}>{part}</Text>
        })}
      </Text>
    )
  }

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      const conversationMessages = messages
        .filter((m) => m.id !== 'initial')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const response = await chatWithAI({
        messages: [...conversationMessages, { role: 'user', content: userMessage.content }],
        symptoms: initialSymptoms.length > 0 ? initialSymptoms : undefined,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble right now. Please try again. 💕',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.backButton} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                {renderMessageWithLinks(message.content, message.role === 'user')}
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !loading ? Colors.white : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.text,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  loadingWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
})

