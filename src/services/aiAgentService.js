import api from '../api/axios';

const aiAgentService = {
  getSession: async () => {
    try {
      const response = await api.get('/patient/ai-agent/session');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI session', error);
      throw error;
    }
  },

  sendMessage: async (message) => {
    try {
      const response = await api.post('/patient/ai-agent/message', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message to AI', error);
      throw error;
    }
  },

  clearSession: async () => {
    try {
      const response = await api.delete('/patient/ai-agent/session');
      return response.data;
    } catch (error) {
      console.error('Error clearing AI session', error);
      throw error;
    }
  }
};

export default aiAgentService;
