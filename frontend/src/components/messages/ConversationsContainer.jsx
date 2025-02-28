import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import messagesService from '../../services/messagesService';
import { useSocket } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../services/socketEvents';

/**
 * Container component for managing conversations for different platforms
 */
const ConversationsContainer = ({ conversations, isLoading, error, platform, accountId }) => {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const { socket, connected } = useSocket();
  const queryClient = useQueryClient();

  // Find active conversation from the list
  const activeConversation = conversations?.find(
    (conversation) => conversation.id === activeConversationId
  );

  // Fetch the active conversation's messages when selected
  const { 
    data: activeConversationMessages, 
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery(
    ['conversation-messages', activeConversationId],
    () => messagesService.getMessages(activeConversationId),
    {
      enabled: !!activeConversationId,
      refetchInterval: connected ? 15000 : false, // Only poll when connected
    }
  );

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation(
    (conversationId) => messagesService.markAsRead(conversationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['conversations', platform, accountId]);
      },
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => {
      const { conversationId, text, platform } = messageData;
      return messagesService.sendMessage(conversationId, text, platform);
    },
    {
      onSuccess: () => {
        refetchMessages();
        queryClient.invalidateQueries(['conversations', platform, accountId]);
      },
    }
  );

  // Effect to listen for socket events
  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      // If message is for the active conversation, refetch messages
      if (data.conversationId === activeConversationId) {
        refetchMessages();
      }
      
      // Refetch conversations list regardless
      queryClient.invalidateQueries(['conversations', platform, accountId]);
    };

    // Register event handlers
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleNewMessage);

    // Cleanup function
    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleNewMessage);
    };
  }, [socket, connected, activeConversationId, platform, accountId, queryClient, refetchMessages]);

  // Mark conversation as read when opening it
  useEffect(() => {
    if (activeConversationId) {
      markAsReadMutation.mutate(activeConversationId);
    }
  }, [activeConversationId]);

  // Handle selecting a conversation
  const handleConversationSelect = (conversationId) => {
    setActiveConversationId(conversationId);
  };

  // Handle sending a message
  const handleSendMessage = (messageData) => {
    if (!messageData.conversationId || !messageData.text.trim()) return;
    
    sendMessageMutation.mutate(messageData);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-220px)] border rounded-lg overflow-hidden">
      {/* Conversation List Panel */}
      <div className="w-full md:w-1/3 border-r bg-white">
        <ConversationList 
          conversations={conversations || []}
          loading={isLoading}
          error={error}
          activeConversationId={activeConversationId}
          onSelectConversation={handleConversationSelect}
          platform={platform}
        />
      </div>
      
      {/* Conversation View Panel */}
      <div className="w-full md:w-2/3 bg-gray-50">
        {activeConversation ? (
          <ConversationView
            conversation={activeConversation}
            messages={activeConversationMessages || []}
            loading={messagesLoading}
            error={messagesError ? 'Erro ao carregar mensagens' : null}
            onSendMessage={handleSendMessage}
            platform={platform}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
            <div className="text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 mx-auto text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
              <p className="mt-2">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ConversationsContainer.propTypes = {
  conversations: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  platform: PropTypes.oneOf(['all', 'whatsapp', 'instagram']),
  accountId: PropTypes.string,
};

ConversationsContainer.defaultProps = {
  conversations: [],
  isLoading: false,
  error: null,
  platform: 'all',
  accountId: null,
};

export default ConversationsContainer;
