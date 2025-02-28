import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * Conversation view component for displaying and interacting with messages
 */
const ConversationView = ({
  conversation,
  messages,
  loading,
  error,
  onSendMessage,
  platform
}) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Auto scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && conversation) {
      onSendMessage({
        text: messageText,
        conversationId: conversation.id,
        platform: conversation.platform || platform
      });
      setMessageText('');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: pt });
    } catch (error) {
      return '';
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa selecionada</h3>
          <p className="mt-1 text-sm text-gray-500">Selecione uma conversa para visualizar as mensagens.</p>
        </div>
      </div>
    );
  }

  const renderMessagesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32 text-red-500 px-4 text-center">
          <p>{error}</p>
        </div>
      );
    }

    if (!messages || messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p>Nenhuma mensagem disponível</p>
        </div>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[70%] shadow-sm ${
                message.isFromMe
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="flex flex-col">
                <p className="break-all whitespace-pre-wrap">{message.text}</p>
                <span
                  className={`text-xs mt-1 self-end ${
                    message.isFromMe ? 'text-indigo-100' : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                  {message.status && (
                    <span className="ml-1">
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && (
                        <span className="text-blue-400">✓✓</span>
                      )}
                      {message.status === 'failed' && (
                        <span className="text-red-500">⚠️</span>
                      )}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Conversation Header */}
      <div className="bg-white p-4 shadow-sm border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {conversation.profilePic ? (
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={conversation.profilePic}
                alt={conversation.contactName || 'Contact'}
              />
            ) : (
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                conversation.platform === 'whatsapp' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {conversation.contactName || conversation.contactNumber || 'Contato desconhecido'}
            </h2>
            <p className="text-sm text-gray-500">
              {conversation.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
              {conversation.lastActive && ` • Último acesso ${formatMessageTime(conversation.lastActive)}`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderMessagesList()}
      </div>
      
      {/* Message Input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 mr-2"
          />
          <Button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
};

ConversationView.propTypes = {
  conversation: PropTypes.object,
  messages: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onSendMessage: PropTypes.func.isRequired,
  platform: PropTypes.string,
};

ConversationView.defaultProps = {
  messages: [],
  loading: false,
  error: null,
  platform: 'all',
};

export default ConversationView;
