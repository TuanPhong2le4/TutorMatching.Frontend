import { api } from '../../../core/api/client';

export interface UploadImageResponse {
  url: string;
  publicId: string;
}

export const uploadService = {
  async uploadImage(file: File, folder: string = 'tutor_platform'): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post<{ success: boolean; data: UploadImageResponse }>('/Uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },
};