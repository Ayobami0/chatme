/** The conversation currently on screen, so its own notifications aren't shown as banners. */
let activeConversationId: string | null = null;

export const setActiveConversation = (id: string | null) => {
  activeConversationId = id;
};

export const getActiveConversation = () => activeConversationId;
