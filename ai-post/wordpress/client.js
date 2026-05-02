import axios from 'axios';

class WordPressClient {
  constructor() {
    this.baseURL = process.env.WP_URL;
    this.auth = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');
  }

  async createPost({ title, content, excerpt, status = 'draft', categories, tags, meta }) {
    try {
      const response = await axios.post(`${this.baseURL}/wp-json/wp/v2/posts`, {
        title,
        content,
        excerpt,
        status,
        categories,
        tags,
        meta // Requires custom meta support or plugins like Yoast
      }, {
        headers: { 'Authorization': `Basic ${this.auth}` }
      });
      return response.data;
    } catch (error) {
      console.error('[WordPress] Error creating post:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadMedia(buffer, filename) {
    try {
      const response = await axios.post(`${this.baseURL}/wp-json/wp/v2/media`, buffer, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Disposition': `attachment; filename=${filename}`,
          'Content-Type': 'image/jpeg'
        }
      });
      return response.data;
    } catch (error) {
      console.error('[WordPress] Error uploading media:', error.message);
      throw error;
    }
  }

  async updatePost(id, data) {
    return axios.post(`${this.baseURL}/wp-json/wp/v2/posts/${id}`, data, {
      headers: { 'Authorization': `Basic ${this.auth}` }
    });
  }
}

export const wpClient = new WordPressClient();
