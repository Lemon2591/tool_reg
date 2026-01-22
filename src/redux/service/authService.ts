import { http } from '../../httpConfig';

export const registerAuth = async (payload: {
  full_name: string;
  email: string;
  password: string;
  cPassword: string;
}): Promise<any> => {
  try {
    const response = await http.post('/api/register', payload);
    return response.data;
  } catch (error) {
    throw new Error('Lỗi không xác định trong quá trình đăng ký');
  }
};
