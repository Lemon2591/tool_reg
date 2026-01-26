import axios from 'axios';

export const getProfileList = async (
  page: number | string,
  limit: number | string
): Promise<any> => {
  try {
    const response = await axios.post(
      ' http://127.0.0.1:53200/api/v2/profile-list',
      {
        profile_id: 0,
        name: '',
        group_id: 0,
        tag_id: 0,
        page: page,
        limit: limit,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Lỗi không xác định trong quá trình lấy danh sách hồ sơ');
  }
};
