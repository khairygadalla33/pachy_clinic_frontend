import { QueryClient, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error('Mutation Error:', error);
      const message = error.response?.data?.message || error.message || 'حدث خطأ غير معروف';
      
      // Handle array of messages (validation errors)
      if (Array.isArray(message)) {
        toast.error(message.join(', '));
      } else {
        toast.error(typeof message === 'string' ? message : 'فشلت العملية');
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
