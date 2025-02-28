import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Input from '../ui/Input';

/**
 * Conversation list component for displaying WhatsApp/Instagram conversations
 */
const ConversationList = ({
  conversations,
  loading,
  error,
  activeConversationId,
  onSelectConversation,
  platform
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = conversations?.filter((conversation) => {
    const searchIn = (conversation.contactName || conversation.contactNumber || '').toLowerCase();
    return searchIn.includes(searchQuery.toLowerCase());
  });

  // Get platform icon
  const getPlatformIcon = (conversationPlatform) => {
    if (conversationPlatform === 'whatsapp') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (conversationPlatform === 'instagram') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b">
        <Input
          type="text"
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          startIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-500 px-4 text-center">
            <p>{error}</p>
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>{searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <li
                key={conversation.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  activeConversationId === conversation.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
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
                            {getPlatformIcon(conversation.platform)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.contactName || conversation.contactNumber || 'Contato desconhecido'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage && conversation.lastMessage.length > 35
                            ? `${conversation.lastMessage.substring(0, 35)}...`
                            : conversation.lastMessage || 'Nenhuma mensagem'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        conversation.platform === 'whatsapp'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {conversation.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  activeConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  platform: PropTypes.string,
};

ConversationList.defaultProps = {
  conversations: [],
  loading: false,
  error: null,
  activeConversationId: null,
  platform: 'all',
};

export default ConversationList;
