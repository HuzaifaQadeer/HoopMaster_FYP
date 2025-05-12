import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/config';

interface UserData {
  user_id: string;
  height: string;
  weight: string;
  wingspan: string;
  vertical_jump: string;
  current_courses: {
    [key: string]: {
      level: string;
      schedule: string;
      completion: number;
    };
  };
  completed_courses: {
    [key: string]: {
      level: string;
      completion: number;
    };
  };
  drill_scores: {
    [key: string]: number;
  };
}

interface ChatProps {
  size?: number;
}

interface Message {
  text: string;
  isUser: boolean;
}

const Chat: React.FC<ChatProps> = ({ size = 65 }) => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { colors } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Hey, how can I help you today?', isUser: false },
  ]);

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      setIsLoading(true);
      setMessages(prev => [...prev, { text: inputText, isUser: true }]);
      
      try {
        setMessages(prev => [...prev, { text: "Thinking...", isUser: false }]);
        
        const requestData = {
          user_query: inputText,
          user_data: {
            user_id: user?.id || "anonymous",
            height: user?.height || "Not provided",
            weight: user?.weight || "Not provided",
            wingspan: user?.wingspan || "Not provided",
            vertical_jump: user?.vertical_jump || "Not provided",
            current_courses: user?.current_courses || {},
            completed_courses: user?.completed_courses || {},
            drill_scores: user?.drill_scores || {}
          }
        };

        const response = await fetch(API_ROUTES.CHATBOT_QUERY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        setMessages(prev => prev.filter(msg => msg.text !== "Thinking..."));
        setMessages(prev => [...prev, { text: data.response, isUser: false }]);
      } catch (error) {
        setMessages(prev => prev.filter(msg => msg.text !== "Thinking..."));
        setMessages(prev => [...prev, { 
          text: "Sorry, I'm having trouble connecting right now. Please try again later.", 
          isUser: false 
        }]);
        console.error('Chat API Error:', error);
      } finally {
        setIsLoading(false);
        setInputText('');
      }
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.container}
      >
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={size * 0.6}
            color={colors.background}
          />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
          </View>

          <ScrollView 
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContentContainer}
          >
            {messages.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.botBubble, { backgroundColor: colorScheme === 'dark' ? '#3A3A3C' : '#F2F2F7' }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser
                      ? styles.userText
                      : [styles.botText, { color: colors.text }],
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colorScheme === 'dark' ? '#8E8E93' : '#999999'}
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              style={[
                styles.sendButton,
                isLoading && styles.sendButtonDisabled
              ]}
              disabled={isLoading}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color={isLoading ? colors.border : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 15,
    bottom: 10,
    zIndex: 1000,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  messagesContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default Chat;