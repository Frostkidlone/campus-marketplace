import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { extractApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const productId = searchParams.get('product');
  const sellerId = searchParams.get('seller');

  // Load conversations, then honour ?product=&seller= when arriving from a listing.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/messages/conversations/');
        const list = Array.isArray(response.data) ? response.data : (response.data.results || []);
        if (cancelled) return;
        setConversations(list);

        let next = null;
        if (productId && sellerId) {
          next = list.find(
            (conversation) =>
              String(conversation.other_user?.id) === String(sellerId) &&
              String(conversation.product?.id) === String(productId)
          ) || null;
          if (!next) {
            let otherUser = { id: Number(sellerId) };
            let product = { id: Number(productId) };
            try {
              const profile = await api.get(`/users/${sellerId}/public/`);
              otherUser = profile.data;
            } catch {
              // Header falls back to "Seller".
            }
            try {
              const productResponse = await api.get(`/products/${productId}/`);
              product = productResponse.data;
            } catch {
              // Header falls back to "Product".
            }
            if (cancelled) return;
            next = { other_user: otherUser, product, isNew: true };
          }
        }
        if (!next) next = list[0] || null;
        setSelected(next);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, 'Could not load conversations.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [productId, sellerId]);

  // Load the selected conversation's messages. The backend scopes the query,
  // so messages from other conversations can never appear here.
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setMessagesLoading(true);
      setError('');
      try {
        const otherId = selected.other_user?.id;
        const product = selected.product?.id;
        const params = new URLSearchParams();
        if (otherId) params.set('other_user', otherId);
        if (product) params.set('product', product);
        const response = await api.get(`/messages/?${params.toString()}`);
        if (cancelled) return;
        const list = response.data.results || response.data;
        setMessages(Array.isArray(list) ? list : []);
        try {
          await api.post('/messages/mark-read/', {
            other_user: otherId,
            product: product || undefined,
          });
        } catch {
          // Read receipts are best-effort.
        }
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, 'Could not load this conversation.'));
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selected]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !selected) return;
    const receiverId = selected.other_user?.id;
    if (!receiverId) {
      setError('Could not identify the other student.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const payload = {
        receiver_id: receiverId,
        message_text: newMessage.trim(),
      };
      if (selected.product?.id) payload.product_id = selected.product.id;
      const response = await api.post('/messages/', payload);
      setMessages((current) => [...current, response.data]);
      setNewMessage('');

      try {
        const conversationResponse = await api.get('/messages/conversations/');
        const list = Array.isArray(conversationResponse.data)
          ? conversationResponse.data
          : (conversationResponse.data.results || []);
        setConversations(list);
        const updated = list.find(
          (conversation) =>
            String(conversation.other_user?.id) === String(receiverId) &&
            String(conversation.product?.id) === String(selected.product?.id || '')
        );
        if (updated) setSelected(updated);
      } catch {
        // The message was sent; the list will catch up on the next visit.
      }
    } catch (err) {
      setError(extractApiError(err, 'Could not send the message.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-[1280px] px-4 py-12 text-zinc-500">Loading conversations...</div>;
  }

  const placeholderVisible = selected?.isNew && !conversations.some(
    (conversation) =>
      String(conversation.other_user?.id) === String(selected.other_user?.id) &&
      String(conversation.product?.id) === String(selected.product?.id)
  );
  const visibleConversations = placeholderVisible ? [selected, ...conversations] : conversations;
  const conversationKey = (conversation) =>
    `${conversation.other_user?.id}-${conversation.product?.id || 'none'}`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-[28px] tracking-tight">Messages</h1>
      <p className="text-sm text-zinc-500 mt-1">Contact buyers and sellers directly. Only the two people in a conversation can read it.</p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm p-3">{error}</div>
      )}

      <div className="mt-8 rounded-[24px] bg-white border border-zinc-100 shadow-card overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        {/* Conversation list */}
        <div className="lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-100 flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Conversations</h3>
            <span className="text-xs text-zinc-400">{visibleConversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none">
            {visibleConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-8 w-8 mx-auto text-zinc-300" />
                <p className="text-sm text-zinc-500 mt-2">No conversations yet</p>
                <p className="text-xs text-zinc-400 mt-1">Open a listing and select “Contact Seller” to start one.</p>
              </div>
            ) : (
              visibleConversations.map((conversation) => {
                const key = conversationKey(conversation);
                const isSelected = selected && conversationKey(selected) === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(conversation)}
                    className={`w-full text-left p-4 hover:bg-zinc-50 border-b border-zinc-50 flex gap-3 ${isSelected ? 'bg-zinc-50' : ''}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-zinc-900 text-white grid place-items-center font-bold shrink-0">
                      {conversation.other_user?.first_name?.[0] || conversation.other_user?.username?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {[conversation.other_user?.first_name, conversation.other_user?.last_name].filter(Boolean).join(' ')
                            || conversation.other_user?.username
                            || 'Student'}
                        </p>
                        {Number(conversation.unread_count) > 0 && (
                          <span className="text-[10px] h-5 min-w-5 px-1.5 rounded-full bg-zinc-900 text-white grid place-items-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">About {conversation.product?.product_name || 'Product'}</p>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {conversation.last_message?.message_text || 'Start the conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-h-[400px]">
          {!selected ? (
            <div className="flex-1 grid place-items-center p-12 text-center">
              <div>
                <MessageCircle className="h-12 w-12 mx-auto text-zinc-200" />
                <p className="font-medium mt-4">Select a conversation</p>
                <p className="text-sm text-zinc-500 mt-1">Your messages are kept between you and the other student.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-900 text-white grid place-items-center font-bold text-sm">
                  {selected.other_user?.first_name?.[0] || selected.other_user?.username?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {[selected.other_user?.first_name, selected.other_user?.last_name].filter(Boolean).join(' ')
                      || selected.other_user?.username
                      || 'Student'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {selected.product?.product_name ? `About ${selected.product.product_name}` : 'General message'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <p className="text-sm text-zinc-400">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-zinc-400">No messages yet. Say hello.</p>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender?.id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-[18px] px-4 py-2.5 text-sm ${isMine ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-zinc-500'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-zinc-100 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-11 px-4 rounded-full bg-zinc-100 border border-transparent focus:bg-white focus:border-zinc-200 outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="h-11 w-11 rounded-full bg-zinc-900 text-white grid place-items-center hover:bg-zinc-800 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
