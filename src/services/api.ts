import axios from 'axios';
import { Item } from '@/models/';
import { getBaseURL } from '@/utils/';

const api = axios.create({
  baseURL: getBaseURL(),
  responseType: 'json',
});
export default api;

export async function getItems() {
  return new Promise((r, j) =>
    r([
      {
        nid: 1,
        title: 'Hi',
        colour: 'blue',
        image: 'https://via.placeholder.com/350',
        image_background: '',
      },
      {
        nid: 2,
        title: 'Hello',
        colour: 'red',
        image: 'https://via.placeholder.com/350',
        image_background: '',
      },
      {
        nid: 3,
        title: 'Bonjour',
        colour: 'yellow',
        image: 'https://via.placeholder.com/350',
        image_background: '',
      },
    ]),
  );
}
